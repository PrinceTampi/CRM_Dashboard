import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compareH3IdentityToH23, normalizeH3CustomerName, normalizeH3Phone } from '@/lib/import/h3-activate';

function formatDateTimeWita(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${formatted} WITA`;
}

function getWitaMonthRange(value: string) {
  const [year, month] = value.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1) - 8 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, month, 1) - 8 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') ?? new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
      return NextResponse.json({ ok: false, message: 'Format bulan harus YYYY-MM.' }, { status: 400 });
    }
    const { start: monthStart, end: monthEnd } = getWitaMonthRange(selectedMonth);

    const [leads, partItems, h23InvoiceCount] = await Promise.all([
      prisma.h3ActivationLead.findMany({
        where: { uploadedAt: { gte: monthStart, lt: monthEnd } },
        include: { customer: true, contactStatusLov: true, notDealReasonLov: true },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.h3PartItem.findMany({
        where: { invoice: { invoiceDate: { gte: monthStart, lt: monthEnd } } },
        select: { quantity: true, grossAmount: true, customerId: true, invoice: { select: { customerId: true } } },
      }),
      prisma.h23Invoice.count(),
    ]);

    const phoneNumbers = [...new Set(leads
      .map((lead) => normalizeH3Phone(lead.customer?.phone))
      .filter((phone): phone is string => Boolean(phone)))];
    const customerNames = [...new Set(leads
      .map((lead) => normalizeH3CustomerName(lead.customer?.normalizedName ?? lead.customer?.name))
      .filter((name): name is string => Boolean(name)))];
    const identityFilters = [
      ...(phoneNumbers.length > 0 ? [{ phone: { in: phoneNumbers } }] : []),
      ...(customerNames.length > 0 ? [{ normalizedName: { in: customerNames } }] : []),
    ];
    const h23Customers = h23InvoiceCount > 0 && identityFilters.length > 0
      ? await prisma.customer.findMany({
        where: { h23Invoices: { some: {} }, OR: identityFilters },
        select: { name: true, normalizedName: true, phone: true },
      })
      : [];

    const pipelineKeys = ['h1 to h3', 'h2 to h3'] as const;
    const pipelineData = Object.fromEntries(pipelineKeys.map((key) => [key, { leads: 0, connected: 0, deals: 0, partQuantity: 0, partRevenue: 0 }])) as Record<(typeof pipelineKeys)[number], { leads: number; connected: number; deals: number; partQuantity: number; partRevenue: number }>;
    const customerPipeline = new Map<string, (typeof pipelineKeys)[number]>();

    for (const lead of leads) {
      const source = lead.sourceData.toLowerCase().replace(/\s+/g, ' ').trim();
      const key = pipelineKeys.find((pipeline) => source === pipeline);
      if (!key) continue;
      pipelineData[key].leads += 1;
      if ((lead.contactStatusLov?.value ?? lead.contactLabel ?? '').toLowerCase().includes('terhubung')) pipelineData[key].connected += 1;
      if ((lead.prospectStatus ?? lead.progressStatus ?? '').trim().toLowerCase() === 'deal') pipelineData[key].deals += 1;
      if (lead.customerId) customerPipeline.set(lead.customerId, key);
    }

    for (const item of partItems) {
      const key = item.customerId ? customerPipeline.get(item.customerId) : item.invoice.customerId ? customerPipeline.get(item.invoice.customerId) : undefined;
      if (!key) continue;
      pipelineData[key].partQuantity += item.quantity;
      pipelineData[key].partRevenue += Number(item.grossAmount);
    }

    const rows = leads.map((lead) => {
      const name = lead.customer?.name ?? 'Customer tidak diketahui';
      const phone = lead.customer?.phone ?? '';
      const comparison = h23InvoiceCount === 0
        ? { status: 'not_compared' as const, matchedByPhone: false, matchedByName: false }
        : compareH3IdentityToH23(lead.customer?.normalizedName ?? lead.customer?.name, phone, h23Customers);

      return {
        name,
        phone,
        contact: lead.contactStatusLov?.value ?? lead.contactLabel ?? (lead.hasFollowUp === 'YA' ? 'Follow Up' : 'Belum tersedia'),
        deal: lead.prospectStatus ?? lead.progressStatus ?? lead.notDealReasonLov?.value ?? (lead.hasFollowUp === 'YA' ? 'Follow Up' : 'Belum tersedia'),
        date: formatDateTimeWita(lead.uploadedAt),
        h23Match: comparison.status,
        matchedByPhone: comparison.matchedByPhone,
        matchedByName: comparison.matchedByName,
      };
    });
    const h23MatchCount = rows.filter((row) => row.h23Match !== 'none' && row.h23Match !== 'not_compared').length;

    return NextResponse.json({
      ok: true,
      rows,
      totalAct: rows.length,
      terhubungCount: rows.filter((row) => row.contact.toLowerCase().includes('terhubung')).length,
      dealCount: rows.filter((row) => row.deal.trim().toLowerCase() === 'deal').length,
      h23ComparisonAvailable: h23InvoiceCount > 0,
      h23MatchCount,
      h23PhoneMatchCount: rows.filter((row) => row.matchedByPhone).length,
      h23NameMatchCount: rows.filter((row) => row.matchedByName).length,
      h23NoMatchCount: h23InvoiceCount > 0 ? rows.filter((row) => row.h23Match === 'none').length : 0,
      partQuantity: partItems.reduce((total, item) => total + item.quantity, 0),
      partRevenue: partItems.reduce((total, item) => total + Number(item.grossAmount), 0),
      pipelines: {
        h1ToH3: pipelineData['h1 to h3'],
        h2ToH3: pipelineData['h2 to h3'],
      },
    });
  } catch (error) {
    console.error('Failed to load Niguri H3 activation data', error);
    return NextResponse.json({ ok: false, message: 'Data Niguri H3 gagal dimuat.' }, { status: 500 });
  }
}
