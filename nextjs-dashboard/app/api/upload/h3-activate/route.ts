import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildH3ActivationHeaderMap, normalizeH3ActivationRow } from '@/lib/import/h3-activate';
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

function normalizeDealerCode(value: string | null): string {
  const base = (value || 'dealer').trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
  return base || 'DEALER';
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
  }

  const sheets = await readSheetRows(file);
  const targetSheet = sheets.find((sheet) => sheet.sheetName.toLowerCase().includes('activate')) ?? sheets[0];

  if (!targetSheet || targetSheet.rows.length < 2) {
    return NextResponse.json({ ok: false, message: 'Sheet H3 Activate tidak ditemukan atau file kosong.' }, { status: 400 });
  }

  const [headerRow, ...dataRows] = targetSheet.rows as string[][];
  const mappedHeaders = buildH3ActivationHeaderMap(headerRow);

  if (Object.keys(mappedHeaders).length === 0) {
    return NextResponse.json({ ok: false, message: 'Header sheet H3 Activate tidak valid.' }, { status: 400 });
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = dataRows
    .map((row) => {
      const normalized = Object.fromEntries((headerRow || []).map((header, index) => [header, row[index] ?? '']));
      return normalizeH3ActivationRow(normalized);
    })
    .filter((row) => row.sourceId !== null && (row.customerName || row.noHp || row.assignedDealerCode));

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
          rawData: safeRawJson({ row: item.raw, headerMap: mappedHeaders }) as any,
          status: item.sourceId ? 'VALID' : 'WARNING',
          importedEntity: 'h3-activation',
          errorMessage: item.sourceId ? null : 'MISSING_SOURCE_ID',
        })),
      },
    },
  });

  let warningCount = 0;

  for (const [index, item] of parsedRows.entries()) {
    const rowNumber = index + 2;

    if (!item.sourceId) {
      warningCount += 1;
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          rowNumber,
          fieldName: 'source_id',
          errorCode: 'MISSING_SOURCE_ID',
          rawValue: JSON.stringify(item.raw),
          severity: 'WARNING',
          action: 'SKIP_ROW',
        },
      });
      continue;
    }

    const assignedDealer = item.assignedDealerCode ? await prisma.dealer.upsert({
      where: { code: normalizeDealerCode(item.assignedDealerCode) },
      update: { name: item.assignedDealerCode },
      create: { code: normalizeDealerCode(item.assignedDealerCode), name: item.assignedDealerCode },
    }) : null;

    let customer = null;
    if (item.noHp) {
      customer = await prisma.customer.findFirst({ where: { phone: item.noHp } });
    }

    if (!customer && item.customerName) {
      customer = await prisma.customer.create({
        data: {
          name: item.customerName,
          normalizedName: item.customerName.trim(),
          phone: item.noHp,
          contactIdentityStatus: 'UNVERIFIED',
        },
      });
    }

    await prisma.h3ActivationLead.upsert({
      where: { sourceId: item.sourceId },
      update: {
        uploadedAt: item.uploadedAt || new Date(),
        assignedAt: item.assignedAt || null,
        customerId: customer?.id ?? null,
        sourceData: item.sourceData || 'UNKNOWN',
        mdCode: item.mdCode || 'UNKNOWN',
        assignedDealerId: assignedDealer?.id ?? null,
        contactLabel: item.contactStatus || null,
        progressStatus: item.hasFollowUp || null,
        prospectStatus: item.notDealReason || null,
        hasFollowUp: item.hasFollowUp || 'TIDAK',
      },
      create: {
        sourceId: item.sourceId,
        uploadedAt: item.uploadedAt || new Date(),
        assignedAt: item.assignedAt || null,
        customerId: customer?.id ?? null,
        sourceData: item.sourceData || 'UNKNOWN',
        mdCode: item.mdCode || 'UNKNOWN',
        assignedDealerId: assignedDealer?.id ?? null,
        contactLabel: item.contactStatus || null,
        progressStatus: item.hasFollowUp || null,
        prospectStatus: item.notDealReason || null,
        hasFollowUp: item.hasFollowUp || 'TIDAK',
      },
    });

    await prisma.auditLog.create({
      data: {
        batchId: batch.id,
        rowNumber,
        fieldName: 'h3_activation_lead',
        errorCode: item.hasFollowUp === 'YA' ? 'H3_FOLLOWUP_YES' : 'H3_FOLLOWUP_NO',
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
    sheetName: targetSheet.sheetName,
    headerMap: mappedHeaders,
    preview: parsedRows,
    importedRows: parsedRows.length,
    warnings: warningCount,
    message: 'H3 activation import berhasil diproses ke tabel domain.',
  });
}
