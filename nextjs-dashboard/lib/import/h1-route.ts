import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildH1HeaderMap, normalizeH1Row } from './h1';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: 'File upload required.' }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return NextResponse.json({ ok: false, message: 'Minimal CSV requires header and one row.' }, { status: 400 });
  }

  const headers = lines[0].split(',').map((header) => header.trim());
  const map = buildH1HeaderMap(headers);
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });

  if (!adminUser) {
    return NextResponse.json({ ok: false, message: 'Admin account not found.' }, { status: 500 });
  }

  const sampleRow = normalizeH1Row(Object.fromEntries(
    lines[1].split(',').map((cell, index) => [headers[index] ?? `column_${index}`, cell])
  ));

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      fileType: 'csv',
      status: 'READY',
      uploadedById: adminUser.id,
      rows: {
        create: [
          {
            sheetName: 'H1',
            rowNumber: 2,
            rawData: JSON.parse(JSON.stringify({
              row: sampleRow.raw,
              headerMap: map,
            })) as any,
            status: 'VALID',
            importedEntity: 'H1Preview',
          },
        ],
      },
    },
  });

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    headerMap: map,
    sample: sampleRow,
    message: 'H1 preview generated successfully.',
  });
}
