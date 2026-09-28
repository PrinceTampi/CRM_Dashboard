import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { safeRawJson } from '@/lib/upload-safe';

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

async function readWorkbookRows(file: File) {
  if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')) {
    const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
    return [{ sheetName: 'Niguri H1', rows: lines.map(parseCsvLine) }];
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  return workbook.SheetNames.map((sheetName) => ({
    sheetName,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false }) as unknown[][],
  }));
}

function parseNonNegativeInteger(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number(text.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function validMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

function getMonthRange(value: string | null) {
  const [year, month] = (value ?? '').split('-').map(Number);
  const start = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerName = searchParams.get('dealer');
    const { start, end } = getMonthRange(searchParams.get('month'));

    const dealer = dealerName
      ? await prisma.dealer.findFirst({ where: { name: dealerName }, select: { id: true } })
      : null;

    if (!dealer) {
      return NextResponse.json({ totalDataSource: 0, totalDataAnalysisResult: 0, totalDataFollowupPhone: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0, hasSnapshot: false });
    }

    const snapshots = await prisma.niguriH1Snapshot.findMany({
      where: { dealerId: dealer.id, month: { gte: start, lt: end } },
    });

    return NextResponse.json({
      totalDataSource: snapshots.reduce((total, row) => total + row.totalDataSource, 0),
      totalDataAnalysisResult: snapshots.reduce((total, row) => total + row.totalDataAnalysisResult, 0),
      totalDataFollowupPhone: snapshots.reduce((total, row) => total + row.totalDataFollowupPhone, 0),
      totalProspect: snapshots.reduce((total, row) => total + row.totalProspect, 0),
      totalCustomerDeal: snapshots.reduce((total, row) => total + row.totalCustomerDeal, 0),
      totalUnitSold: snapshots.reduce((total, row) => total + row.totalUnitSold, 0),
      hasSnapshot: snapshots.length > 0,
    });
  } catch (error) {
    console.error('Failed to load Niguri H1 data', error);
    return NextResponse.json({ totalDataSource: 0, totalDataAnalysisResult: 0, totalDataFollowupPhone: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0, hasSnapshot: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const dealerName = String(formData.get('dealer') ?? '').trim();
    const selectedMonth = String(formData.get('month') ?? '').trim();

    if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'File DMMS wajib dipilih.' }, { status: 400 });
    if (!dealerName) return NextResponse.json({ ok: false, message: 'Dealer wajib dipilih.' }, { status: 400 });
    if (!validMonth(selectedMonth)) return NextResponse.json({ ok: false, message: 'Pilih bulan data yang valid.' }, { status: 400 });

    const dealer = await prisma.dealer.findFirst({ where: { name: dealerName } });
    if (!dealer) return NextResponse.json({ ok: false, message: `Dealer "${dealerName}" belum terdaftar di master dealer.` }, { status: 422 });

    const sheets = await readWorkbookRows(file);
    const sheet = sheets.find((item) => item.sheetName.toLowerCase().includes('niguri h1')) ?? sheets[0];
    if (!sheet || sheet.rows.length < 2) return NextResponse.json({ ok: false, message: 'File DMMS kosong atau sheet Niguri H1 tidak ditemukan.' }, { status: 422 });

    const [headerRow, ...dataRows] = sheet.rows;
    const headerIndexes = new Map((headerRow ?? []).map((header, index) => [normalizeHeader(header), index]));
    const columns = {
      sourceCategory: ['data_source_kategori', 'source_category', 'kategori_sumber_data'],
      totalDataSource: ['total_data_source'],
      totalDataAnalysisResult: ['total_data_analysis_result'],
      totalDataFollowupPhone: ['total_data_followup_phone', 'total_data_follow_up_phone'],
      totalProspect: ['total_prospect'],
      totalCustomerDeal: ['total_customer_deal'],
      totalUnitSold: ['total_unit_sold'],
    } as const;
    const missingHeaders = Object.entries(columns)
      .filter(([, aliases]) => !aliases.some((alias) => headerIndexes.has(normalizeHeader(alias))))
      .map(([field]) => field);
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        ok: false,
        message: `Header file belum sesuai kontrak Niguri H1. Kolom belum ditemukan: ${missingHeaders.join(', ')}.`,
      }, { status: 422 });
    }

    const getCell = (row: unknown[], aliases: readonly string[]) => {
      const index = aliases.map(normalizeHeader).map((alias) => headerIndexes.get(alias)).find((candidate) => candidate !== undefined);
      return index === undefined ? undefined : row[index];
    };
    const parsedRows = dataRows.map((row) => ({
      sourceCategory: String(getCell(row, columns.sourceCategory) ?? '').trim(),
      totalDataSource: parseNonNegativeInteger(getCell(row, columns.totalDataSource)),
      totalDataAnalysisResult: parseNonNegativeInteger(getCell(row, columns.totalDataAnalysisResult)),
      totalDataFollowupPhone: parseNonNegativeInteger(getCell(row, columns.totalDataFollowupPhone)),
      totalProspect: parseNonNegativeInteger(getCell(row, columns.totalProspect)),
      totalCustomerDeal: parseNonNegativeInteger(getCell(row, columns.totalCustomerDeal)),
      totalUnitSold: parseNonNegativeInteger(getCell(row, columns.totalUnitSold)),
      raw: row,
    })).filter((row) => row.raw.some((value) => String(value ?? '').trim()));

    const invalidRows = parsedRows.filter((row) => !row.sourceCategory || row.totalDataSource === null || row.totalDataAnalysisResult === null || row.totalDataFollowupPhone === null || row.totalProspect === null || row.totalCustomerDeal === null || row.totalUnitSold === null);
    if (parsedRows.length === 0) return NextResponse.json({ ok: false, message: 'Tidak ada baris kategori Niguri H1 untuk disimpan.' }, { status: 422 });
    if (invalidRows.length > 0) return NextResponse.json({ ok: false, message: `${invalidRows.length} baris DMMS memiliki kategori kosong atau metrik bukan bilangan bulat >= 0.` }, { status: 422 });

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    if (!adminUser) return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });

    const [year, month] = selectedMonth.split('-').map(Number);
    const snapshotMonth = new Date(Date.UTC(year, month - 1, 1));
    const batch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'PROCESSING',
        uploadedById: adminUser.id,
        rows: {
          create: parsedRows.map((row, index) => ({
            sheetName: sheet.sheetName,
            rowNumber: index + 2,
            rawData: safeRawJson({ row: row.raw, sourceMonth: selectedMonth, sourceCategory: row.sourceCategory }) as any,
            status: 'VALID',
            importedEntity: 'niguri-h1-snapshot',
          })),
        },
      },
    });
    const importRows = await prisma.importRow.findMany({ where: { batchId: batch.id }, orderBy: { rowNumber: 'asc' } });

    for (const [index, row] of parsedRows.entries()) {
      const metrics = {
        totalDataSource: row.totalDataSource!,
        totalDataAnalysisResult: row.totalDataAnalysisResult!,
        totalDataFollowupPhone: row.totalDataFollowupPhone!,
        totalProspect: row.totalProspect!,
        totalCustomerDeal: row.totalCustomerDeal!,
        totalUnitSold: row.totalUnitSold!,
      };
      const snapshot = await prisma.niguriH1Snapshot.upsert({
        where: {
          dealerId_month_sourceCategory: {
            dealerId: dealer.id,
            month: snapshotMonth,
            sourceCategory: row.sourceCategory,
          },
        },
        update: metrics,
        create: { dealerId: dealer.id, month: snapshotMonth, sourceCategory: row.sourceCategory, ...metrics },
      });
      await prisma.importRow.update({
        where: { id: importRows[index].id },
        data: { status: 'IMPORTED', importedEntityId: snapshot.id },
      });
    }

    await prisma.importBatch.update({ where: { id: batch.id }, data: { status: 'COMPLETED' } });
    return NextResponse.json({ ok: true, batchId: batch.id, importedRows: parsedRows.length, month: selectedMonth, dealer: dealer.name, message: `${parsedRows.length} kategori Niguri H1 berhasil disimpan.` });
  } catch (error) {
    console.error('Failed to import Niguri H1 DMMS', error);
    return NextResponse.json({ ok: false, message: 'Gagal memproses file DMMS Niguri H1.' }, { status: 500 });
  }
}