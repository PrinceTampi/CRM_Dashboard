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

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthIndex = Number.isNaN(month) ? new Date().getMonth() + 1 : month;
    const monthDate = new Date(year || new Date().getFullYear(), (monthIndex || 1) - 1, 1, 0, 0, 0, 0);
    const monthStart = new Date(monthDate);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const [customers, eventRegistrations, repairOrders, salesTrend] = await Promise.all([
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          birthDate: true,
          phone: true,
        },
      }),
      prisma.eventRegistration.findMany({
        orderBy: { eventDate: 'desc' },
        include: {
          customer: true,
        },
      }),
      prisma.repairOrder.findMany({
        where: {
          roDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          dealer: true,
          customer: true,
          vehicle: true,
        },
        orderBy: { roDate: 'desc' },
      }),
      (async () => {
        const sales: Array<{ month: string; count: number }> = [];
        const startBase = new Date(monthDate.getFullYear(), monthDate.getMonth() - 5, 1, 0, 0, 0, 0);

        for (let i = 0; i < 6; i += 1) {
          const cursor = new Date(startBase.getFullYear(), startBase.getMonth() + i, 1, 0, 0, 0, 0);
          const cursorStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
          const cursorEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
          const count = await prisma.h1Sale.count({
            where: {
              invoiceDate: {
                gte: cursorStart,
                lte: cursorEnd,
              },
            },
          });
          sales.push({ month: monthKeyFromDate(cursor), count });
        }

        return sales;
      })(),
    ]);

    const today = new Date();
    const birthdayList = customers
      .filter((customer) => customer.birthDate)
      .map((customer) => ({
        name: customer.name,
        birth: formatDateOnly(customer.birthDate),
        phone: customer.phone ?? '',
      }))
      .filter((item) => item.birth)
      .sort((a, b) => a.birth.localeCompare(b.birth));

    const birthdayTodayCount = birthdayList.filter((customer) => {
      const birthDate = new Date(customer.birth);
      return birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate();
    }).length;

    const birthdayMonthCount = birthdayList.filter((customer) => {
      const birthDate = new Date(customer.birth);
      const monthStr = monthKeyFromDate(birthDate);
      return monthStr === selectedMonth;
    }).length;

    const eventList = eventRegistrations.map((event) => ({
      name: event.customer?.name ?? 'Customer tidak diketahui',
      phone: event.customer?.phone ?? '',
      engine: event.engineNumber ?? '',
      location: event.location ?? null,
      notes: event.notes ?? null,
      date: formatDateOnly(event.eventDate),
    }));

    const monthlyRepairOrders = repairOrders.map((ro, index) => ({
      no: index + 1,
      customer: ro.customer?.name ?? 'Customer tidak diketahui',
      phone: ro.customer?.phone ?? '',
      nik: '',
      engine: ro.vehicle?.engineNumber ?? '',
      roNumber: ro.roNumber,
      ahass: ro.dealer?.name ?? ro.dealer?.code ?? 'AHASS',
      date: formatDateOnly(ro.roDate),
      job: ro.job,
      status: ro.status,
      cost: Number(ro.cost ?? 0),
    }));

    const roByAhass = Array.from(
      repairOrders.reduce((map, ro) => {
        const key = ro.dealer?.name ?? ro.dealer?.code ?? 'AHASS';
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>())
    )
      .map(([ahass, count]) => ({ ahass, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalCustomers: customers.length,
      birthdayTodayCount,
      birthdayMonthCount,
      birthdayList: birthdayList.filter((customer) => {
        const birthDate = new Date(customer.birth);
        return birthDate.getMonth() === monthDate.getMonth();
      }),
      eventList,
      monthlyRepairOrders,
      roByAhass,
      salesTrend,
    });
  } catch (error) {
    console.error('Failed to load monitoring summary', error);
    return NextResponse.json(
      {
        totalCustomers: 0,
        birthdayTodayCount: 0,
        birthdayMonthCount: 0,
        birthdayList: [],
        eventList: [],
        monthlyRepairOrders: [],
        roByAhass: [],
        salesTrend: [],
      },
      { status: 200 }
    );
  }
}
