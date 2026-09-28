import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Silakan login untuk memuat master dealer.' }, { status: 401 });
  }

  try {
    const dealers = await prisma.dealer.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
    return NextResponse.json({ ok: true, dealers });
  } catch (error) {
    console.error('Failed to load dealer master', error);
    return NextResponse.json({ ok: false, message: 'Master dealer gagal dimuat.' }, { status: 500 });
  }
}
