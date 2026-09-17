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
    const repairOrders = await prisma.repairOrder.findMany({
      include: {
        customer: true,
        vehicle: true,
        dealer: true,
      },
      orderBy: { roDate: 'desc' },
    });

    return NextResponse.json({
      rows: repairOrders.map((ro, index) => ({
        no: index + 1,
        customer: ro.customer?.name ?? 'Customer tidak diketahui',
        phone: ro.customer?.phone ?? '',
        nik: ro.customer?.nik ?? '',
        engine: ro.vehicle?.engineNumber ?? '',
        roNumber: ro.roNumber,
        ahass: ro.dealer?.name ?? ro.dealer?.code ?? 'AHASS',
        date: formatDateOnly(ro.roDate),
        job: ro.job,
        status: ro.status,
        cost: Number(ro.cost ?? 0),
      })),
    });
  } catch (error) {
    console.error('Failed to load repair orders', error);
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
