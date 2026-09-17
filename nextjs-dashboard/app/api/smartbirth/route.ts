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

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1, 0, 0, 0, 0);

    const [customers, followUps] = await Promise.all([
      prisma.customer.findMany({
        where: { birthDate: { not: null } },
        select: {
          name: true,
          birthDate: true,
          phone: true,
        },
      }),
      prisma.birthdayFollowUp.findMany({
        include: { customer: true },
        orderBy: { followUpDate: 'desc' },
      }),
    ]);

    const birthdayCustomers = customers
      .filter((customer) => customer.birthDate)
      .map((customer) => ({
        name: customer.name,
        birth: formatDateOnly(customer.birthDate),
        phone: customer.phone ?? '',
      }))
      .filter((customer) => customer.birth)
      .filter((customer) => monthKeyFromDate(new Date(customer.birth)) === selectedMonth)
      .sort((a, b) => a.birth.localeCompare(b.birth));

    const followUpList = followUps
      .filter((item) => item.followUpDate)
      .filter((item) => monthKeyFromDate(new Date(item.followUpDate)) === selectedMonth)
      .map((item) => ({
        name: item.customer?.name ?? 'Customer tidak diketahui',
        phone: item.customer?.phone ?? '',
        contact: item.contactStatus ?? 'Belum ada status',
        deal: item.dealStatus ?? 'Belum ada deal',
        date: formatDateOnly(item.followUpDate),
      }));

    return NextResponse.json({
      month: selectedMonth,
      birthdayCustomers,
      followUps: followUpList,
      totalBirthday: birthdayCustomers.length,
      totalFollowUp: followUpList.length,
      monthLabel: monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    console.error('Failed to load smart birth summary', error);
    return NextResponse.json(
      {
        month: new Date().toISOString().slice(0, 7),
        birthdayCustomers: [],
        followUps: [],
        totalBirthday: 0,
        totalFollowUp: 0,
        monthLabel: '',
      },
      { status: 200 }
    );
  }
}
