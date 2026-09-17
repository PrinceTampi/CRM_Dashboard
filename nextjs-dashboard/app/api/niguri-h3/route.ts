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

    const leads = await prisma.h3ActivationLead.findMany({
      where: {
        uploadedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        customer: true,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 200,
    });

    const rows = leads.map((lead) => ({
      name: lead.customer?.name ?? 'Customer tidak diketahui',
      phone: lead.customer?.phone ?? '',
      contact: lead.contactLabel || (lead.hasFollowUp === 'YA' ? 'Terhubung' : 'Belum tersedia'),
      deal: lead.prospectStatus || (lead.hasFollowUp === 'YA' ? 'Follow Up' : 'Tidak Deal'),
      date: formatDateOnly(lead.uploadedAt),
    }));

    return NextResponse.json({
      rows,
      totalAct: rows.length,
      terhubungCount: rows.filter((row) => row.contact.toLowerCase().includes('terhubung')).length,
      dealCount: rows.filter((row) => row.deal.toLowerCase().includes('deal') || row.deal.toLowerCase().includes('follow')).length,
    });
  } catch (error) {
    console.error('Failed to load Niguri H3 activation data', error);
    return NextResponse.json({ rows: [], totalAct: 0, terhubungCount: 0, dealCount: 0 });
  }
}
