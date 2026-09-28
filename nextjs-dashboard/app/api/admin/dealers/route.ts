import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function serializeDealer(dealer: { id: string; code: string; name: string }) {
  return { id: dealer.id, code: dealer.code, name: dealer.name };
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  const dealers = await prisma.dealer.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json({ ok: true, dealers: dealers.map(serializeDealer) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';

    if (!code || !name) {
      return NextResponse.json({ ok: false, message: 'Kode resmi dan nama dealer wajib diisi.' }, { status: 400 });
    }
    if (code.length > 64 || name.length > 160) {
      return NextResponse.json({ ok: false, message: 'Kode atau nama dealer terlalu panjang.' }, { status: 400 });
    }

    const [existingCode, existingName] = await Promise.all([
      prisma.dealer.findUnique({ where: { code } }),
      prisma.dealer.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }),
    ]);
    if (existingCode) {
      return NextResponse.json({ ok: false, message: `Kode ${code} sudah digunakan oleh ${existingCode.name}.` }, { status: 409 });
    }
    if (existingName) {
      return NextResponse.json({ ok: false, message: `Nama dealer sudah terdaftar dengan kode ${existingName.code}.` }, { status: 409 });
    }

    const dealer = await prisma.dealer.create({ data: { code, name }, select: { id: true, code: true, name: true } });
    return NextResponse.json({ ok: true, dealer: serializeDealer(dealer), message: 'Dealer berhasil ditambahkan ke master.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to add dealer master record', error);
    return NextResponse.json({ ok: false, message: 'Gagal menambahkan dealer ke master.' }, { status: 500 });
  }
}
