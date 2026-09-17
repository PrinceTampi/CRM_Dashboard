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

    const [rows, eventAhass] = await Promise.all([
      prisma.h2ServiceItem.findMany({
        where: {
          invoice: {
            invoiceDate: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        include: {
          customer: true,
          vehicle: true,
          invoice: true,
        },
        orderBy: {
          invoice: {
            invoiceDate: 'desc',
          },
        },
      }),
      prisma.eventRegistration.count({
        where: {
          eventDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

    const data = rows.map((row) => ({
      name: row.customer?.name ?? 'Customer tidak diketahui',
      phone: row.customer?.phone ?? '',
      motor: row.vehicle?.model ?? row.vehicle?.engineNumber ?? '-',
      contact: row.customerId ? 'Terhubung' : 'Belum Terhubung',
      progress: row.description || 'Belum ada hasil',
      date: formatDateOnly(row.invoice.invoiceDate),
    }));

    const terhubung = data.filter((row) => row.contact.toLowerCase().includes('terhubung')).length;

    return NextResponse.json({
      rows: data,
      totalLeads: data.length,
      terhubung,
      tidakTerhubung: data.length - terhubung,
      eventAhass,
    });
  } catch (error) {
    console.error('Failed to load express H2 data', error);
    return NextResponse.json({
      rows: [],
      totalLeads: 0,
      terhubung: 0,
      tidakTerhubung: 0,
      eventAhass: 0,
    });
  }
}
