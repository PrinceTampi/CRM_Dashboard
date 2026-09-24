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

function monthNumberFromDate(date: Date): number {
  return date.getMonth() + 1;
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
          id: true,
          name: true,
          birthDate: true,
          phone: true,
          h1Sales: {
            select: { id: true },
          },
        },
      }),
      prisma.birthdayFollowUp.findMany({
        include: { customer: true },
        orderBy: { followUpDate: 'desc' },
      }),
    ]);

    const monthFollowUps = followUps
      .filter((item) => item.followUpDate)
      .filter((item) => monthKeyFromDate(new Date(item.followUpDate)) === selectedMonth);

    const followUpByCustomer = new Map<string, typeof monthFollowUps[number]>();
    for (const item of monthFollowUps) {
      if (!followUpByCustomer.has(item.customerId)) followUpByCustomer.set(item.customerId, item);
    }

    const selectedMonthNumber = month || 1;
    const birthdayCustomers = customers
      .filter((customer) => customer.birthDate)
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        birth: formatDateOnly(customer.birthDate),
        phone: customer.phone ?? '',
        h1SalesCount: customer.h1Sales.length,
        followUp: followUpByCustomer.get(customer.id)
          ? {
            contact: followUpByCustomer.get(customer.id)?.contactStatus ?? 'Belum ada status',
            deal: followUpByCustomer.get(customer.id)?.dealStatus ?? 'Belum ada deal',
          }
          : null,
      }))
      .filter((customer) => customer.birth)
      .filter((customer) => monthNumberFromDate(new Date(customer.birth)) === selectedMonthNumber)
      .sort((a, b) => a.birth.localeCompare(b.birth));

    const followUpList = monthFollowUps
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
