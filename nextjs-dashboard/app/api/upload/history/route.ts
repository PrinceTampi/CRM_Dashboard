import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getUploadType(entities: string[]): string {
  const types = new Set<string>();
  for (const entity of entities) {
    if (entity.startsWith('h1-')) types.add('H1');
    else if (entity.startsWith('h23-')) types.add('H2/H3');
    else if (entity === 'h3-activation') types.add('H3 Activate');
    else if (entity === 'prospect-lead') types.add('Prospek');
    else if (entity === 'lcr-campaign') types.add('LCR');
    else if (entity === 'birthday-follow-up') types.add('BFU');
    else if (entity === 'niguri-h1-snapshot') types.add('Niguri H1');
  }
  return Array.from(types).join(', ') || 'Upload';
}

function getSourceMonth(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return null;
  const data = rawData as Record<string, unknown>;
  const nestedRow = data.row;
  const nestedMonth = nestedRow && typeof nestedRow === 'object' && !Array.isArray(nestedRow)
    ? (nestedRow as Record<string, unknown>).sourceMonth
    : null;
  const value = data.sourceMonth ?? nestedMonth;
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function getStatus(status: string): string {
  if (status === 'COMPLETED') return 'Berhasil';
  if (status === 'COMPLETED_WITH_WARNINGS') return 'Selesai dengan warning';
  if (status === 'FAILED') return 'Gagal';
  if (status === 'PROCESSING' || status === 'VALIDATING') return 'Diproses';
  return status;
}

export async function GET() {
  try {
    const batches = await prisma.importBatch.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 50,
      include: { rows: { select: { importedEntity: true, rawData: true } } },
    });

    return NextResponse.json({
      rows: batches.map((batch) => ({
        date: formatDateOnly(batch.uploadedAt),
        type: getUploadType(batch.rows.map((row) => row.importedEntity ?? '')),
        month: batch.rows.map((row) => getSourceMonth(row.rawData)).find(Boolean) ?? 'Tidak tercatat',
        count: batch.rows.length,
        status: getStatus(batch.status),
      })),
    });
  } catch (error) {
    console.error('Failed to load upload history', error);
    return NextResponse.json({ rows: [], message: 'Riwayat upload gagal dimuat.' }, { status: 500 });
  }
}
