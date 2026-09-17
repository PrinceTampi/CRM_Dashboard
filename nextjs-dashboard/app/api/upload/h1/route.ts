import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildH1HeaderMap, normalizeH1Row } from '@/lib/import/h1';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File wajib diunggah.' }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return NextResponse.json({ ok: false, message: 'File minimal harus berisi header dan satu baris data.' }, { status: 400 });
  }

  const headers = lines[0].split(',').map((header) => header.trim());
  const mappedHeaders = buildH1HeaderMap(headers);
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });

  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found. Seed demo users first.' }, { status: 500 });
  }

  const parsedRows = lines.slice(1, 4).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    return Object.fromEntries(cells.map((cell, index) => [headers[index] ?? `column_${index}`, cell]));
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
          rawData: JSON.parse(JSON.stringify({
            row: item.raw,
            headerMap: mappedHeaders,
          })) as any,
          status: 'VALID',
          importedEntity: 'h1-preview',
        })),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    headerMap: mappedHeaders,
    preview: normalized,
    message: 'Preview H1 berhasil dibuat.',
  });
}
