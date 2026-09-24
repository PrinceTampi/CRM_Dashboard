import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getMonthRange(value: string | null) {
  const [year, month] = (value ?? '').split('-').map(Number);
  const start = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerName = searchParams.get('dealer');
    const { start, end } = getMonthRange(searchParams.get('month'));

    const dealer = dealerName
      ? await prisma.dealer.findFirst({ where: { name: dealerName }, select: { id: true } })
      : null;

    if (!dealer) {
      return NextResponse.json({ totalDataSource: 0, totalDataAnalysisResult: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0 });
    }

    const [totalDataSource, totalUnitSold] = await Promise.all([
      prisma.h1Sale.count({ where: { dealerId: dealer.id, invoiceDate: { gte: start, lt: end } } }),
      prisma.h1Sale.count({ where: { dealerId: dealer.id, invoiceDate: { gte: start, lt: end }, status: { contains: 'SOLD', mode: 'insensitive' } } }),
    ]);

    return NextResponse.json({
      totalDataSource,
      totalDataAnalysisResult: totalDataSource,
      totalProspect: totalDataSource,
      totalCustomerDeal: totalUnitSold,
      totalUnitSold,
    });
  } catch (error) {
    console.error('Failed to load Niguri H1 data', error);
    return NextResponse.json({ totalDataSource: 0, totalDataAnalysisResult: 0, totalProspect: 0, totalCustomerDeal: 0, totalUnitSold: 0 }, { status: 500 });
  }
}