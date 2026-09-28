import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { buildRcrDataFromRecords, normalizePhone } from '@/lib/rcr-data';

function normalizeDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('-');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return trimmed.slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

async function readRealTransactionRecords() {
  const [h1Sales, h23Invoices] = await Promise.all([
    prisma.h1Sale.findMany({
      select: {
        invoiceDate: true,
        dealer: { select: { name: true, code: true } },
        customer: { select: { phone: true } },
      },
    }),
    prisma.h23Invoice.findMany({
      select: {
        invoiceDate: true,
        dealer: { select: { name: true, code: true } },
        customer: { select: { phone: true } },
        serviceItems: { select: { transactionType: true } },
        partItems: { select: { transactionType: true } },
      },
    }),
  ]);

  const records: Array<{ phone: string; date: string; dealer: string; segment: string; category: string }> = [];

  for (const sale of h1Sales) {
    const phone = normalizePhone(sale.customer?.phone ?? '');
    if (!phone) continue;
    records.push({
      phone,
      date: normalizeDate(sale.invoiceDate),
      dealer: sale.dealer?.name || sale.dealer?.code || 'Dealer Umum',
      segment: 'Regular',
      category: 'Sales',
    });
  }

  for (const invoice of h23Invoices) {
    const phone = normalizePhone(invoice.customer?.phone ?? '');
    if (!phone) continue;

    const dealerName = invoice.dealer?.name || invoice.dealer?.code || 'Dealer Umum';
    const hasService = invoice.serviceItems.length > 0;
    const hasPart = invoice.partItems.length > 0;

    if (hasService) {
      records.push({
        phone,
        date: normalizeDate(invoice.invoiceDate),
        dealer: dealerName,
        segment: 'Regular',
        category: 'Service',
      });
    }

    if (hasPart) {
      records.push({
        phone,
        date: normalizeDate(invoice.invoiceDate),
        dealer: dealerName,
        segment: 'Regular',
        category: 'Sparepart',
      });
    }
  }

  return records;
}

export async function GET() {
  try {
    const sourceRows = await readRealTransactionRecords();

    const aggregated = buildRcrDataFromRecords(
      sourceRows.map((row) => ({
        phone: row.phone,
        date: row.date,
        dealer: row.dealer,
        segment: row.segment,
        category: row.category,
      })),
    );

    const months = Array.from(new Set(aggregated.map((row) => row.period))).sort();
    const dealers = Array.from(new Set(aggregated.map((row) => row.dealer))).sort();
    const segments = Array.from(new Set(aggregated.map((row) => row.segment))).sort();
    const categories = Array.from(new Set(aggregated.map((row) => row.category))).sort();

    return NextResponse.json({
      ok: true,
      months,
      dealers,
      segments,
      categories,
      rows: aggregated,
    });
  } catch (error) {
    console.error('RCR summary load error:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Data RCR gagal dimuat.',
        months: [],
        dealers: [],
        segments: [],
        categories: [],
        rows: [],
      },
      { status: 200 },
    );
  }
}
