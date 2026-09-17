import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validatePasswordUpdatePayload } from '@/lib/validation';
import bcrypt from 'bcrypt';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Session tidak valid.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, message: 'User tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Session tidak valid.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = validatePasswordUpdatePayload(body);

    if (!payload.ok) {
      return NextResponse.json({ ok: false, message: payload.message }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(payload.data.password, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Failed to update password:', error);
    return NextResponse.json({ ok: false, message: 'Gagal mengubah password.' }, { status: 500 });
  }
}
