import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildLcrHeaderMap, normalizeLcrRow } from '@/lib/import/lcr';
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
  const targetSheet = sheets.find((sheet) => sheet.sheetName.toLowerCase() === 'data') ?? sheets[0];

  if (!targetSheet || targetSheet.rows.length < 2) {
    return NextResponse.json({ ok: false, message: 'Sheet Data tidak ditemukan atau file kosong.' }, { status: 400 });
  }

  const [headerRow, ...dataRows] = targetSheet.rows as string[][];
  const mappedHeaders = buildLcrHeaderMap(headerRow);

  if (Object.keys(mappedHeaders).length === 0) {
    return NextResponse.json({ ok: false, message: 'Header sheet Data tidak valid.' }, { status: 400 });
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = dataRows
    .map((row) => {
      const normalized = Object.fromEntries((headerRow || []).map((header, index) => [header, row[index] ?? '']));
      return normalizeLcrRow(normalized);
    })
    .filter((row) => row.engineNumber || row.frameNumber);

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
          status: item.engineNumber ? 'VALID' : 'WARNING',
          importedEntity: 'lcr-campaign',
          errorMessage: item.engineNumber ? null : 'MISSING_ENGINE_NUMBER',
        })),
      },
    },
  });

  let warningCount = 0;

  for (let index = 0; index < parsedRows.length; index += 1) {
    const item = parsedRows[index];
    const rowNumber = index + 2;

    if (!item.engineNumber) {
      warningCount += 1;
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          rowNumber,
          fieldName: 'nomor_mesin',
          errorCode: 'MISSING_ENGINE_NUMBER',
          rawValue: JSON.stringify(item.raw),
          severity: 'WARNING',
          action: 'SKIP_ROW',
        },
      });
      continue;
    }

    const dealerCode = normalizeDealerCode(item.dealerCode || item.operatingDealer || 'dealer');
    const dealer = await prisma.dealer.upsert({
      where: { code: dealerCode },
      update: { name: item.operatingDealer || item.dealerCode || 'Dealer LCR' },
      create: {
        code: dealerCode,
        name: item.operatingDealer || item.dealerCode || 'Dealer LCR',
      },
    });

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { engineNumber: item.engineNumber },
      include: { customer: true },
    });

    let customer = existingVehicle?.customer;
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: `LCR Customer - ${item.engineNumber}`,
          normalizedName: `lcr customer ${item.engineNumber}`.slice(0, 120),
          phone: null,
          contactIdentityStatus: 'UNVERIFIED',
        },
      });
    }

    const vehicle = await prisma.vehicle.upsert({
      where: { engineNumber: item.engineNumber },
      update: {
        frameNumber: item.frameNumber || existingVehicle?.frameNumber || 'UNKNOWN',
        customerId: customer.id,
        model: item.ring || existingVehicle?.model || null,
      },
      create: {
        engineNumber: item.engineNumber,
        frameNumber: item.frameNumber || 'UNKNOWN',
        customerId: customer.id,
        model: item.ring || null,
      },
    });

    const campaignCode = normalizeDealerCode(item.ring || 'LCR').slice(0, 32) || 'LCR';

    await prisma.lcrCampaignRecord.upsert({
      where: {
        vehicleId_campaignCode: {
          vehicleId: vehicle.id,
          campaignCode,
        },
      },
      update: {
        dealerId: dealer.id,
        referenceFrame: item.frameNumber || null,
        isTreated: item.isTreated,
        treatmentStatus: item.treatmentStatus || null,
      },
      create: {
        vehicleId: vehicle.id,
        dealerId: dealer.id,
        campaignCode,
        referenceFrame: item.frameNumber || null,
        isTreated: item.isTreated,
        treatmentStatus: item.treatmentStatus || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        batchId: batch.id,
        rowNumber,
        fieldName: 'lcr_campaign',
        errorCode: item.isTreated ? 'LCR_TREATED' : 'LCR_PENDING',
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
    message: 'LCR campaign import berhasil diproses ke tabel domain.',
  });
}
