import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatDateOnly(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const [leads, partItems] = await Promise.all([
      prisma.h3ActivationLead.findMany({
        where: { uploadedAt: { gte: monthStart, lte: monthEnd } },
        include: { customer: true, contactStatusLov: true, notDealReasonLov: true },
        orderBy: { uploadedAt: 'desc' },
        take: 200,
      }),
      prisma.h3PartItem.findMany({
        where: { invoice: { invoiceDate: { gte: monthStart, lte: monthEnd } } },
        select: { quantity: true, grossAmount: true, customerId: true, invoice: { select: { customerId: true } } },
      }),
    ]);

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

    const rows = leads.map((lead) => ({
      name: lead.customer?.name ?? 'Customer tidak diketahui',
      phone: lead.customer?.phone ?? '',
      contact: lead.contactStatusLov?.value ?? lead.contactLabel ?? (lead.hasFollowUp === 'YA' ? 'Follow Up' : 'Belum tersedia'),
      deal: lead.prospectStatus ?? lead.progressStatus ?? lead.notDealReasonLov?.value ?? (lead.hasFollowUp === 'YA' ? 'Follow Up' : 'Belum tersedia'),
      date: formatDateOnly(lead.uploadedAt),
    }));

    return NextResponse.json({
      rows,
      totalAct: rows.length,
      terhubungCount: rows.filter((row) => row.contact.toLowerCase().includes('terhubung')).length,
      dealCount: rows.filter((row) => row.deal.trim().toLowerCase() === 'deal').length,
      partQuantity: partItems.reduce((total, item) => total + item.quantity, 0),
      partRevenue: partItems.reduce((total, item) => total + Number(item.grossAmount), 0),
      pipelines: {
        h1ToH3: pipelineData['h1 to h3'],
        h2ToH3: pipelineData['h2 to h3'],
      },
    });
  } catch (error) {
    console.error('Failed to load Niguri H3 activation data', error);
    return NextResponse.json({ rows: [], totalAct: 0, terhubungCount: 0, dealCount: 0, partQuantity: 0, partRevenue: 0, pipelines: { h1ToH3: null, h2ToH3: null } });
  }
}
