import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { safeRawJson } from '@/lib/upload-safe';

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

async function readRows(file: File): Promise<{ sheetName: string; rows: unknown[][] }[]> {
  if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')) {
    const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
    return [{ sheetName: 'BFU', rows: lines.map(parseCsvLine) }];
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  return workbook.SheetNames.map((sheetName) => ({
    sheetName,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false }) as unknown[][],
  }));
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhone(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits.startsWith('0') ? digits : `0${digits}`;
}

function parseFollowUpDate(value: unknown): Date | null {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const numericDate = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (numericDate) {
    const year = Number(numericDate[3].length === 2 ? `20${numericDate[3]}` : numericDate[3]);
    const date = new Date(Date.UTC(year, Number(numericDate[2]) - 1, Number(numericDate[1])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const monthDate = text.match(/^(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{2,4})$/);
  if (monthDate) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.indexOf(monthDate[2].slice(0, 3).toLowerCase());
    if (monthIndex < 0) return null;
    const year = Number(monthDate[3].length === 2 ? `20${monthDate[3]}` : monthDate[3]);
    const date = new Date(Date.UTC(year, monthIndex, Number(monthDate[1])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sourceMonth = String(formData.get('month') ?? '').trim() || null;
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
    }

    const sheets = await readRows(file);
    const targetSheet = sheets.find((sheet) => /bfu|birthday|follow.?up/i.test(sheet.sheetName)) ?? sheets[0];
    if (!targetSheet || targetSheet.rows.length < 2) {
      return NextResponse.json({ ok: false, message: 'Sheet BFU tidak ditemukan atau file kosong.' }, { status: 400 });
    }

    const [headers, ...dataRows] = targetSheet.rows;
    const headerIndexes = new Map((headers ?? []).map((header, index) => [normalizeHeader(header), index]));
    const findIndex = (aliases: string[]) => aliases.map(normalizeHeader).map((header) => headerIndexes.get(header)).find((index) => index !== undefined);
    const nameIndex = findIndex(['Nama', 'Nama Konsumen', 'Nama Customer']);
    const phoneIndex = findIndex(['No HP', 'No HP Konsumen', 'Nomor HP', 'Phone']);
    const contactIndex = findIndex(['Status Contact', 'Contact Status', 'Status Kontak']);
    const dealIndex = findIndex(['Status Deal', 'Deal Status', 'Hasil FU', 'Hasil Follow Up']);
    const dateIndex = findIndex(['Tanggal FU', 'Tgl FU', 'Tanggal Follow Up', 'Follow Up Date']);

    if (phoneIndex === undefined || dateIndex === undefined || (contactIndex === undefined && dealIndex === undefined)) {
      return NextResponse.json({
        ok: false,
        message: 'Header wajib BFU: No HP, Tanggal FU, dan Status Contact atau Status Deal.',
      }, { status: 422 });
    }

    const parsedRows = dataRows.map((row) => ({
      name: nameIndex === undefined ? '' : String(row[nameIndex] ?? '').trim(),
      phone: normalizePhone(row[phoneIndex]),
      contact: contactIndex === undefined ? '' : String(row[contactIndex] ?? '').trim(),
      deal: dealIndex === undefined ? '' : String(row[dealIndex] ?? '').trim(),
      followUpDate: parseFollowUpDate(row[dateIndex]),
      raw: Object.fromEntries((headers ?? []).map((header, index) => [String(header ?? `Kolom ${index + 1}`), row[index] ?? ''])),
    }));

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    if (!adminUser) {
      return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
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
            rawData: safeRawJson({ row: item.raw, sourceMonth }) as any,
            status: item.phone && item.followUpDate && (item.contact || item.deal) ? 'VALID' : 'WARNING',
            importedEntity: 'birthday-follow-up',
          })),
        },
      },
    });
    const importRows = await prisma.importRow.findMany({ where: { batchId: batch.id }, orderBy: { rowNumber: 'asc' } });

    let importedRows = 0;
    let warningCount = 0;

    for (const [index, item] of parsedRows.entries()) {
      const importRow = importRows[index];
      const rowNumber = index + 2;
      const followUpDate = item.followUpDate;
      const customer = item.phone
        ? await prisma.customer.findFirst({ where: { phone: item.phone } })
        : null;
      const errorCode = !item.phone || !item.followUpDate || (!item.contact && !item.deal)
        ? 'INVALID_BFU_ROW'
        : !customer ? 'CUSTOMER_NOT_FOUND' : null;

      if (!customer || !followUpDate || errorCode) {
        warningCount += 1;
        const code = errorCode ?? 'CUSTOMER_NOT_FOUND';
        await prisma.importRow.update({
          where: { id: importRow.id },
          data: { status: 'WARNING', errorMessage: code },
        });
        await prisma.auditLog.create({
          data: {
            batchId: batch.id,
            importRowId: importRow.id,
            rowNumber,
            fieldName: 'customer_or_follow_up',
            errorCode: code,
            rawValue: safeRawJson(item.raw) as any,
            severity: 'WARNING',
            action: 'SKIP_ROW',
          },
        });
        continue;
      }

      const existing = await prisma.birthdayFollowUp.findFirst({
        where: { customerId: customer.id, followUpDate },
        orderBy: { id: 'asc' },
      });
      const followUp = existing
        ? await prisma.birthdayFollowUp.update({
          where: { id: existing.id },
          data: { contactStatus: item.contact || null, dealStatus: item.deal || null },
        })
        : await prisma.birthdayFollowUp.create({
          data: {
            customerId: customer.id,
            followUpDate,
            contactStatus: item.contact || null,
            dealStatus: item.deal || null,
          },
        });

      importedRows += 1;
      await prisma.importRow.update({
        where: { id: importRow.id },
        data: { status: 'IMPORTED', importedEntityId: followUp.id },
      });
      await prisma.auditLog.create({
        data: {
          batchId: batch.id,
          importRowId: importRow.id,
          rowNumber,
          fieldName: 'birthday_follow_up',
          errorCode: 'BFU_IMPORTED',
          rawValue: safeRawJson(item.raw) as any,
          severity: 'INFO',
          action: 'UPSERT_ROW',
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
      totalRows: parsedRows.length,
      importedRows,
      warnings: warningCount,
      preview: parsedRows.map((item) => ({ ...item, followUpDate: item.followUpDate ? formatDateOnly(item.followUpDate) : null })),
      message: 'Import follow-up ulang tahun berhasil diproses.',
    });
  } catch (error) {
    console.error('Failed to import birthday follow-ups', error);
    return NextResponse.json({ ok: false, message: 'Gagal memproses file follow-up ulang tahun.' }, { status: 500 });
  }
}
