import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const [events, sales, customers] = await Promise.all([
      prisma.eventRegistration.findMany({
        orderBy: { eventDate: 'desc' },
        take: 25,
        include: { customer: true },
      }),
      prisma.h1Sale.findMany({
        orderBy: { invoiceDate: 'desc' },
        take: 25,
        include: { customer: true, vehicle: true },
      }),
      prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { vehicles: true },
      }),
    ]);

    const rows = [
      ...events.map((event) => ({
        name: event.customer?.name ?? 'Customer tidak diketahui',
        phone: event.customer?.phone ?? '',
        engine: event.engineNumber ?? '',
        source: 'AHASS Event',
        date: formatDateOnly(event.eventDate),
      })),
      ...sales.map((sale) => ({
        name: sale.customer?.name ?? 'Customer tidak diketahui',
        phone: sale.customer?.phone ?? '',
        engine: sale.vehicle?.engineNumber ?? '',
        source: 'H1 Penjualan',
        date: formatDateOnly(sale.invoiceDate),
      })),
      ...customers.map((customer) => ({
        name: customer.name,
        phone: customer.phone ?? '',
        engine: customer.vehicles?.[0]?.engineNumber ?? '',
        source: 'Master Customer',
        date: formatDateOnly(customer.createdAt),
      })),
    ]
      .filter((row) => row.name && row.phone)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 120);

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Failed to load integrated customer data', error);
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
