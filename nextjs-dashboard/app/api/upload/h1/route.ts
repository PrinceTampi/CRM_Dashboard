import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildH1HeaderMap, normalizeH1Row } from '@/lib/import/h1';
import { safeRawJson } from '@/lib/upload-safe';

function normalizeDealerCode(value: string | null): string {
  const code = (value || 'DEALER')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return code || 'DEALER';
}

function normalizeCustomerName(value: string | null): string {
  return (value || 'Unknown Customer').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells;
}

async function readH1Rows(file: File): Promise<string[][]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');

  if (isCsv) {
    const text = await file.text();
    return text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map(parseCsvLine);
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return firstSheet
    ? XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' }) as string[][]
    : [];
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
  }

  const rows = await readH1Rows(file);

  if (rows.length < 2) {
    return NextResponse.json({ ok: false, message: 'File minimal harus berisi header dan satu baris data.' }, { status: 400 });
  }

  const headers = rows[0].map((header) => String(header ?? '').trim());
  const mappedHeaders = buildH1HeaderMap(headers);
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });

  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = rows.slice(1).map((cells) => {
    return Object.fromEntries(
      headers.map((header, index) => [
        mappedHeaders[header.toLowerCase()] ?? header,
        cells[index] ?? '',
      ])
    );
  });

  const normalized = parsedRows.map((row) => normalizeH1Row(row));

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      fileType: file.type || 'text/csv',
      status: 'READY',
      uploadedById: adminUser.id,
      rows: {
        create: normalized.map((item, index) => ({
          sheetName: 'H1',
          rowNumber: index + 2,
          rawData: safeRawJson({
            row: item.raw,
            headerMap: mappedHeaders,
          }) as any,
          status: 'VALID',
          importedEntity: 'h1-preview',
        })),
      },
    },
  });

  const importRows = await prisma.importRow.findMany({
    where: { batchId: batch.id },
    orderBy: { rowNumber: 'asc' },
  });

  let importedCustomers = 0;
  let importedSales = 0;
  let updatedCustomers = 0;
  let updatedSales = 0;
  let duplicateRows = 0;
  let warningCount = 0;

  for (const [index, item] of normalized.entries()) {
    const importRow = importRows[index];
    const rowNumber = index + 2;

    if (!item.nama_konsumen && !item.no_ktp && !item.no_hp) {
      warningCount += 1;
      await prisma.importRow.update({
        where: { id: importRow.id },
        data: { status: 'WARNING', errorMessage: 'MISSING_CUSTOMER_IDENTITY' },
      });
      continue;
    }

    const dealer = await prisma.dealer.upsert({
      where: { code: normalizeDealerCode(item.kode_dealer) },
      update: { name: item.kode_dealer || 'Dealer' },
      create: {
        code: normalizeDealerCode(item.kode_dealer),
        name: item.kode_dealer || 'Dealer',
      },
    });

    let customer = item.no_ktp
      ? await prisma.customer.findUnique({ where: { nik: item.no_ktp } })
      : null;

    if (!customer && item.nomor_mesin) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { engineNumber: item.nomor_mesin },
        select: { customer: true },
      });
      customer = vehicle?.customer ?? null;
    }

    if (!customer && item.no_hp) {
      customer = await prisma.customer.findFirst({ where: { phone: item.no_hp } });
    }

    if (!customer && item.nama_konsumen) {
      customer = await prisma.customer.findFirst({
        where: { normalizedName: normalizeCustomerName(item.nama_konsumen) },
      });
    }

    if (customer) {
      updatedCustomers += 1;
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: item.nama_konsumen || customer.name,
          normalizedName: normalizeCustomerName(item.nama_konsumen || customer.name),
          nik: item.no_ktp || undefined,
          birthDate: item.tanggal_lahir || undefined,
          phone: item.no_hp || item.no_telp || undefined,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: item.nama_konsumen || 'Unknown Customer',
          normalizedName: normalizeCustomerName(item.nama_konsumen),
          nik: item.no_ktp,
          birthDate: item.tanggal_lahir,
          phone: item.no_hp || item.no_telp,
          contactIdentityStatus: item.no_ktp || item.no_hp ? 'VERIFIED' : 'UNVERIFIED',
        },
      });
    }

    importedCustomers += 1;

    if (!item.nomor_mesin) {
      warningCount += 1;
      await prisma.importRow.update({
        where: { id: importRow.id },
        data: { status: 'WARNING', errorMessage: 'MISSING_ENGINE_NUMBER' },
      });
      continue;
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { engineNumber: item.nomor_mesin },
    });
    const vehicle = existingVehicle
      ? await prisma.vehicle.update({
        where: { id: existingVehicle.id },
        data: {
          customerId: customer.id,
          frameNumber: item.nomor_rangka || existingVehicle.frameNumber,
          model: item.tipe_dan_warna || existingVehicle.model,
        },
      })
      : await prisma.vehicle.create({
        data: {
          engineNumber: item.nomor_mesin,
          frameNumber: item.nomor_rangka || `UNKNOWN-${item.nomor_mesin}`,
          customerId: customer.id,
          model: item.tipe_dan_warna,
        },
      });

    if (!item.no || !item.tanggal_faktur) {
      warningCount += 1;
      await prisma.importRow.update({
        where: { id: importRow.id },
        data: { status: 'WARNING', errorMessage: 'MISSING_SOURCE_NUMBER_OR_INVOICE_DATE' },
      });
      continue;
    }

    const sale = await prisma.h1Sale.upsert({
      where: {
        dealerId_sourceNo_invoiceDate: {
          dealerId: dealer.id,
          sourceNo: item.no,
          invoiceDate: item.tanggal_faktur,
        },
      },
      update: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        paymentType: item.jenis_bayar || 'UNKNOWN',
        status: item.status_faktur,
      },
      create: {
        sourceNo: item.no,
        dealerId: dealer.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        invoiceDate: item.tanggal_faktur,
        paymentType: item.jenis_bayar || 'UNKNOWN',
        status: item.status_faktur,
        importRowId: importRow.id,
      },
    });

    importedSales += 1;
    const wasUpdated = sale.importRowId !== importRow.id;
    if (wasUpdated) {
      updatedSales += 1;
      duplicateRows += 1;
    }
    await prisma.importRow.update({
      where: { id: importRow.id },
      data: {
        status: 'IMPORTED',
        importedEntity: 'h1-sale',
        importedEntityId: sale.id,
      },
    });
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { status: warningCount > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED' },
  });

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    headerMap: mappedHeaders,
    preview: normalized,
    importedRows: importedSales,
    importedCustomers,
    updatedCustomers,
    updatedSales,
    duplicateRows,
    warnings: warningCount,
    message: `Data H1 berhasil diproses: ${importedSales} penjualan, ${updatedSales} diperbarui, ${warningCount} warning.`,
  });
}
