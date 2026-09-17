import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateUserCreatePayload } from '@/lib/validation';

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AHASS';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    users: users.map(serializeUser),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const payload = validateUserCreatePayload(body);

    if (!payload.ok) {
      return NextResponse.json({ ok: false, message: payload.message }, { status: 400 });
    }

    const normalizedEmail = payload.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ ok: false, message: 'Email sudah terdaftar pada akun lain.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(payload.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: payload.data.name,
        email: normalizedEmail,
        passwordHash,
        role: payload.data.role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: serializeUser(user),
      message: 'Akun berhasil dibuat.',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return NextResponse.json({ ok: false, message: 'Gagal membuat akun pengguna baru.' }, { status: 500 });
  }
}
