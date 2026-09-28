import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildProspectHeaderMap, normalizeProspectRow } from '@/lib/import/prospect';
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
    return [{ sheetName: 'PROSPEK', rows: matrix }];
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
  const sourceMonth = String(formData.get('month') ?? '').trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
  }

  const sheets = await readSheetRows(file);
  const targetSheet = sheets.find((sheet) => sheet.sheetName.toLowerCase().includes('prospek')) ?? sheets[0];

  if (!targetSheet || targetSheet.rows.length < 2) {
    return NextResponse.json({ ok: false, message: 'Sheet prospek tidak ditemukan atau file kosong.' }, { status: 400 });
  }

  const [headerRow, ...dataRows] = targetSheet.rows as string[][];
  const mappedHeaders = buildProspectHeaderMap(headerRow);

  if (Object.keys(mappedHeaders).length === 0) {
    return NextResponse.json({ ok: false, message: 'Header sheet prospek tidak valid.' }, { status: 400 });
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = dataRows
    .map((row) => {
      const normalized = Object.fromEntries((headerRow || []).map((header, index) => [
        mappedHeaders[String(header ?? '').trim().toLowerCase()] ?? header,
        row[index] ?? '',
      ]));
      return normalizeProspectRow(normalized);
    })
    .filter((row) => row.leadId || row.customerName || row.phone);

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      fileType: file.type || 'application/vnd.ms-excel',
      status: 'PROCESSING',
      uploadedById: adminUser.id,
    },
  });

  const importRowChunkSize = 500;
  for (let start = 0; start < parsedRows.length; start += importRowChunkSize) {
    const chunk = parsedRows.slice(start, start + importRowChunkSize);
    await prisma.importRow.createMany({
      data: chunk.map((item, offset) => ({
          batchId: batch.id,
          sheetName: targetSheet.sheetName,
          rowNumber: start + offset + 2,
          rawData: safeRawJson({ row: item.raw, headerMap: mappedHeaders, sourceMonth }) as any,
          status: item.leadId ? 'VALID' : 'WARNING',
          importedEntity: 'prospect-lead',
          errorMessage: item.leadId ? null : 'MISSING_LEAD_ID',
      })),
    });
  }
  const importRows = await prisma.importRow.findMany({
    where: { batchId: batch.id },
    orderBy: { rowNumber: 'asc' },
  });

  let warningCount = 0;
  let importedRows = 0;
  const seenLeadIds = new Set<string>();
  let duplicateRows = 0;

  for (const [index, item] of parsedRows.entries()) {
    const rowNumber = index + 2;
    const importRow = importRows[index];

    if (!item.leadId) {
      warningCount += 1;
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          importRowId: importRow.id,
          rowNumber,
          fieldName: 'lead_id',
          errorCode: 'MISSING_LEAD_ID',
          rawValue: JSON.stringify(item.raw),
          severity: 'WARNING',
          action: 'SKIP_ROW',
        },
      });
      continue;
    }

    if (seenLeadIds.has(item.leadId)) duplicateRows += 1;
    seenLeadIds.add(item.leadId);

    const assignedDealer = item.assignedDealerCode ? await prisma.dealer.upsert({
      where: { code: normalizeDealerCode(item.assignedDealerCode) },
      update: { name: item.assignedDealerCode },
      create: { code: normalizeDealerCode(item.assignedDealerCode), name: item.assignedDealerCode },
    }) : null;

    let customer = null;
    if (item.phone) {
      customer = await prisma.customer.findFirst({ where: { phone: item.phone } });
    }

    if (!customer && item.customerName) {
      customer = await prisma.customer.create({
        data: {
          name: item.customerName,
          normalizedName: item.customerName.trim(),
          phone: item.phone,
          contactIdentityStatus: 'UNVERIFIED',
        },
      });
    }

    const lead = await prisma.prospectLead.upsert({
      where: { leadId: item.leadId },
      update: {
        guestbookId: item.guestbookId || null,
        guestbookAt: item.guestbookAt || null,
        customerId: customer?.id ?? null,
        salesChannel: item.salesChannel || null,
        eventCode: item.eventCode || null,
        eventDescription: item.eventDescription || null,
        platform: item.platform || null,
        contactStatus: item.contactStatus || null,
        contactChannel: item.contactChannel || null,
        nextFollowUp: item.nextFollowUp || null,
        slaDeadline: item.slaDeadline || null,
        prospectType: item.prospectType || null,
        customerType: item.customerType || null,
        assignedDealerId: assignedDealer?.id ?? null,
        status: item.status || 'NEW',
      },
      create: {
        leadId: item.leadId,
        guestbookId: item.guestbookId || null,
        guestbookAt: item.guestbookAt || null,
        customerId: customer?.id ?? null,
        salesChannel: item.salesChannel || null,
        eventCode: item.eventCode || null,
        eventDescription: item.eventDescription || null,
        platform: item.platform || null,
        contactStatus: item.contactStatus || null,
        contactChannel: item.contactChannel || null,
        nextFollowUp: item.nextFollowUp || null,
        slaDeadline: item.slaDeadline || null,
        prospectType: item.prospectType || null,
        customerType: item.customerType || null,
        assignedDealerId: assignedDealer?.id ?? null,
        status: item.status || 'NEW',
      },
    });
    importedRows += 1;

    await prisma.auditLog.create({
      data: {
        batchId: batch.id,
        importRowId: importRow.id,
        rowNumber,
        fieldName: 'prospect_lead',
        errorCode: 'PROSPECT_UPSERTED',
        rawValue: JSON.stringify(item.raw),
        severity: 'INFO',
        action: 'IMPORT_ROW',
      },
    });
    await prisma.importRow.update({
      where: { id: importRow.id },
      data: { status: 'IMPORTED', importedEntityId: lead.leadId },
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
    totalRows: parsedRows.length,
    importedRows,
    warnings: warningCount,
    duplicateRows,
    message: 'Prospect pipeline import berhasil diproses ke tabel domain.',
  });
}
