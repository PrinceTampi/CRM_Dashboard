import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type MatchMode = 'name' | 'nik' | 'kk' | 'phone';

function formatDateOnly(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeIdentity(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizePhone(value: unknown): string {
  const digits = String(value ?? '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  return digits.startsWith('0') ? digits : `0${digits}`;
}

function getRawField(rawData: unknown, names: string[]): string {
  if (!rawData || typeof rawData !== 'object') return '';
  const row = (rawData as { row?: unknown }).row;
  if (!row || typeof row !== 'object') return '';
  const values = row as Record<string, unknown>;
  const wanted = names.map((name) => normalizeIdentity(name));
  const entry = Object.entries(values).find(([key]) => wanted.includes(normalizeIdentity(key)));
  return String(entry?.[1] ?? '').trim();
}

function getModeKey(mode: MatchMode, sale: {
  customer: { name: string; nik: string | null; phone: string | null };
  rawData: unknown;
}): string {
  if (mode === 'name') return normalizeIdentity(sale.customer.name);
  if (mode === 'nik') return normalizeIdentity(sale.customer.nik);
  if (mode === 'phone') return normalizePhone(sale.customer.phone);
  return normalizeIdentity(getRawField(sale.rawData, ['KK', 'No KK', 'Nomor KK', 'No. KK', 'Kartu Keluarga']));
}

const modeLabels: Record<MatchMode, string> = {
  name: 'Nama',
  nik: 'NIK',
  kk: 'Nomor KK',
  phone: 'Nomor Telepon',
};

export async function GET() {
  try {
    const importRows = await prisma.importRow.findMany({
      where: { importedEntity: 'h1-sale', importedEntityId: { not: null } },
      select: {
        importedEntityId: true,
        rawData: true,
        batch: { select: { fileName: true, uploadedAt: true } },
      },
    });
    const rawBySaleId = new Map(importRows.map((row) => [row.importedEntityId as string, row]));
    const sales = await prisma.h1Sale.findMany({
      include: {
        customer: true,
        vehicle: true,
        dealer: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const modes = (['name', 'nik', 'kk', 'phone'] as MatchMode[]).map((mode) => {
      const groups = new Map<string, typeof sales>();

      for (const sale of sales) {
        const rawData = rawBySaleId.get(sale.id)?.rawData;
        const key = getModeKey(mode, { customer: sale.customer, rawData });
        if (!key) continue;
        const group = groups.get(key) ?? [];
        group.push(sale);
        groups.set(key, group);
      }

      return {
        mode,
        label: modeLabels[mode],
        groups: Array.from(groups.entries())
          .filter(([, group]) => group.length >= 2)
          .map(([key, group], groupIndex) => {
            const first = group[0];
            return {
              id: `${mode}-${key}`,
              no: groupIndex + 1,
              matchValue: mode === 'phone' ? first.customer.phone ?? key : mode === 'name' ? first.customer.name : mode === 'nik' ? first.customer.nik ?? key : getRawField(rawBySaleId.get(first.id)?.rawData, ['KK', 'No KK', 'Nomor KK', 'No. KK', 'Kartu Keluarga']),
              matchMode: modeLabels[mode],
              customer: first.customer.name,
              nik: first.customer.nik ?? '',
              kk: getRawField(rawBySaleId.get(first.id)?.rawData, ['KK', 'No KK', 'Nomor KK', 'No. KK', 'Kartu Keluarga']),
              phone: first.customer.phone ?? '',
              occurrences: group.length,
              firstDate: formatDateOnly(group[group.length - 1].invoiceDate),
              lastDate: formatDateOnly(group[0].invoiceDate),
              rows: group.map((sale) => ({
                sourceNo: sale.sourceNo,
                invoiceDate: formatDateOnly(sale.invoiceDate),
                dealer: sale.dealer.name || sale.dealer.code,
                engine: sale.vehicle.engineNumber,
                frame: sale.vehicle.frameNumber,
                paymentType: sale.paymentType,
                status: sale.status ?? '',
                fileName: rawBySaleId.get(sale.id)?.batch.fileName ?? 'Data H1',
                uploadedAt: formatDateOnly(rawBySaleId.get(sale.id)?.batch.uploadedAt),
              })),
            };
          }),
      };
    });

    return NextResponse.json({
      modes,
    });
  } catch (error) {
    console.error('Failed to load repair orders', error);
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
