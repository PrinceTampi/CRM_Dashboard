import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildH23HeaderMap, normalizeH23Row, resolveH23ImportType, validateH23ImportType, validateH23RowContract } from '@/lib/import/h23';
import { safeRawJson } from '@/lib/upload-safe';

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

async function readSheetRows(file: File) {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
  if (isCsv) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const matrix = lines.map(parseCsvLine);
    return [{ sheetName: 'Data', rows: matrix }];
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  return workbook.SheetNames.map((sheetName) => ({
    sheetName,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false }) as unknown[][],
  }));
}

function normalizeDealerCode(name: string | null): string {
  const base = (name || 'dealer').trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return base || 'DEALER';
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  const importType = resolveH23ImportType(String(formData.get('type') ?? ''));

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
  }

  const sheets = await readSheetRows(file);
  const targetSheet = sheets.find((sheet) => sheet.sheetName.toLowerCase() === 'data') ?? sheets[0];

  if (!targetSheet || targetSheet.rows.length < 2) {
    return NextResponse.json({ ok: false, message: 'Sheet Data tidak ditemukan atau file kosong.' }, { status: 400 });
  }

  const [headerRow, ...dataRows] = targetSheet.rows as string[][];
  const mappedHeaders = buildH23HeaderMap(headerRow);

  if (Object.keys(mappedHeaders).length === 0) {
    return NextResponse.json({ ok: false, message: 'Header sheet Data tidak valid.' }, { status: 400 });
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = dataRows.map((row) => {
    const normalized = Object.fromEntries((headerRow || []).map((header, index) => [header, row[index] ?? '']));
    return normalizeH23Row(normalized);
  });

  const validRows = parsedRows.filter((item) => validateH23ImportType(importType, item.transactionType) && validateH23RowContract(importType, item));
  const invalidRows = parsedRows.filter((item) => !validateH23ImportType(importType, item.transactionType) || !validateH23RowContract(importType, item));

  if (importType !== 'H23' && validRows.length === 0 && invalidRows.length > 0) {
    return NextResponse.json({
      ok: false,
      message: importType === 'H2'
        ? 'File H2 hanya menerima transaksi SERVICE.'
        : 'File H3 hanya menerima transaksi PART atau PARTSERVICE.',
      warnings: invalidRows.length,
    }, { status: 422 });
  }

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      fileType: file.type || 'application/vnd.ms-excel',
      status: 'PROCESSING',
      uploadedById: adminUser.id,
      rows: {
        create: parsedRows.map((item, index) => ({
          sheetName: targetSheet.sheetName,
          rowNumber: index + 2,
          rawData: safeRawJson({
            row: item.raw,
            headerMap: mappedHeaders,
          }) as any,
          status: item.transactionType && validateH23ImportType(importType, item.transactionType) && validateH23RowContract(importType, item) ? 'VALID' : 'WARNING',
          importedEntity: 'h23-entity',
          errorMessage: item.transactionType && validateH23ImportType(importType, item.transactionType) && validateH23RowContract(importType, item) ? null : 'TRANSACTION_TYPE_MISMATCH',
        })),
      },
    },
  });

  const invoiceSummary: Array<{ invoiceId: string; itemType: 'SERVICE' | 'PART' | 'PARTSERVICE' }> = [];
  let warningCount = 0;

  for (let index = 0; index < parsedRows.length; index += 1) {
    const item = parsedRows[index];
    const rowNumber = index + 2;

    if (!item.invoiceNumber || !item.itemNumber || !item.transactionType) {
      warningCount += 1;
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          rowNumber,
          fieldName: 'invoice_or_transaction',
          errorCode: 'UNKNOWN_TRANSACTION_TYPE',
          rawValue: JSON.stringify(item.raw),
          severity: 'WARNING',
          action: 'SKIP_ROW',
        },
      });
      continue;
    }

    if (!validateH23ImportType(importType, item.transactionType) || !validateH23RowContract(importType, item)) {
      warningCount += 1;
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          rowNumber,
          fieldName: 'transaction_type',
          errorCode: 'TRANSACTION_TYPE_MISMATCH',
          rawValue: JSON.stringify(item.raw),
          severity: 'WARNING',
          action: 'SKIP_ROW',
        },
      });
      continue;
    }

    const dealer = await prisma.dealer.upsert({
      where: { code: normalizeDealerCode(item.dealerName) },
      update: { name: item.dealerName || 'Dealer' },
      create: {
        code: normalizeDealerCode(item.dealerName),
        name: item.dealerName || 'Dealer',
      },
    });

    const invoice = await prisma.h23Invoice.upsert({
      where: {
        dealerId_invoiceNumber: {
          dealerId: dealer.id,
          invoiceNumber: item.invoiceNumber,
        },
      },
      update: {
        workOrderNumber: item.workOrderNumber || undefined,
        invoiceDate: item.invoiceDate || new Date(),
      },
      create: {
        invoiceNumber: item.invoiceNumber,
        workOrderNumber: item.workOrderNumber || item.invoiceNumber,
        invoiceDate: item.invoiceDate || new Date(),
        dealerId: dealer.id,
      },
    });

    invoiceSummary.push({ invoiceId: invoice.id, itemType: item.transactionType });

    if (item.transactionType === 'SERVICE') {
      await prisma.h2ServiceItem.upsert({
        where: {
          invoiceId_itemNumber_transactionType: {
            invoiceId: invoice.id,
            itemNumber: item.itemNumber,
            transactionType: 'SERVICE',
          },
        },
        update: {
          description: item.itemDescription || 'SERVICE',
          quantity: item.quantity || 0,
          price: item.price ? String(item.price) : '0',
          grossAmount: item.grossAmount ? String(item.grossAmount) : '0',
          discountRate: item.discountRate ? String(item.discountRate) : null,
          discountAmount: item.discountAmount ? String(item.discountAmount) : null,
          dealerId: dealer.id,
        },
        create: {
          invoiceId: invoice.id,
          dealerId: dealer.id,
          itemNumber: item.itemNumber,
          description: item.itemDescription || 'SERVICE',
          transactionType: 'SERVICE',
          quantity: item.quantity || 0,
          price: item.price ? String(item.price) : '0',
          grossAmount: item.grossAmount ? String(item.grossAmount) : '0',
          discountRate: item.discountRate ? String(item.discountRate) : null,
          discountAmount: item.discountAmount ? String(item.discountAmount) : null,
        },
      });
    } else {
      await prisma.h3PartItem.upsert({
        where: {
          invoiceId_itemNumber_transactionType: {
            invoiceId: invoice.id,
            itemNumber: item.itemNumber,
            transactionType: item.transactionType,
          },
        },
        update: {
          description: item.itemDescription || 'PART',
          quantity: item.quantity || 0,
          price: item.price ? String(item.price) : '0',
          grossAmount: item.grossAmount ? String(item.grossAmount) : '0',
          discountRate: item.discountRate ? String(item.discountRate) : null,
          discountAmount: item.discountAmount ? String(item.discountAmount) : null,
          groupPart: item.groupPart || null,
          dealerId: dealer.id,
        },
        create: {
          invoiceId: invoice.id,
          dealerId: dealer.id,
          itemNumber: item.itemNumber,
          description: item.itemDescription || 'PART',
          transactionType: item.transactionType,
          quantity: item.quantity || 0,
          price: item.price ? String(item.price) : '0',
          grossAmount: item.grossAmount ? String(item.grossAmount) : '0',
          discountRate: item.discountRate ? String(item.discountRate) : null,
          discountAmount: item.discountAmount ? String(item.discountAmount) : null,
          groupPart: item.groupPart || null,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        batchId: batch.id,
        rowNumber,
        fieldName: 'transaction_type',
        errorCode: item.transactionType === 'SERVICE' ? 'ROW_IMPORTED_SERVICE' : 'ROW_IMPORTED_PART',
        rawValue: JSON.stringify(item.raw),
        severity: 'INFO',
        action: 'IMPORT_ROW',
      },
    });
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: warningCount > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED',
    },
  });

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    importType,
    sheetName: targetSheet.sheetName,
    headerMap: mappedHeaders,
    preview: validRows,
    importedInvoices: invoiceSummary.length,
    warnings: warningCount,
    message: importType === 'H2'
      ? 'H2 import berhasil diproses ke tabel domain.'
      : importType === 'H3'
        ? 'H3 import berhasil diproses ke tabel domain.'
        : 'H23 import berhasil diproses ke tabel domain.',
  });
}
