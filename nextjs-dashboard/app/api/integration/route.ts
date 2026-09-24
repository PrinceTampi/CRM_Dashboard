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
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicles: true,
        h1Sales: { orderBy: { invoiceDate: 'desc' }, take: 1 },
        eventRegistrations: { orderBy: { eventDate: 'desc' }, take: 1 },
      },
    });

    const rows = customers.map((customer) => {
      const latestSale = customer.h1Sales[0];
      const latestEvent = customer.eventRegistrations[0];
      const latestDate = latestSale?.invoiceDate ?? latestEvent?.eventDate ?? customer.createdAt;

      return {
        name: customer.name,
        phone: customer.phone ?? '',
        engine: customer.vehicles[0]?.engineNumber ?? latestEvent?.engineNumber ?? '',
        source: latestSale ? 'H1 Penjualan' : latestEvent ? 'AHASS Event' : 'Master Customer',
        date: formatDateOnly(latestDate),
      };
    });

    const completeCustomers = rows.filter((row) => row.name && row.phone && row.engine).length;

    return NextResponse.json({
      rows,
      summary: {
        totalCustomers: rows.length,
        completeCustomers,
        incompleteCustomers: rows.length - completeCustomers,
      },
    });
  } catch (error) {
    console.error('Failed to load integrated customer data', error);
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
