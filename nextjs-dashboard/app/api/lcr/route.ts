import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateLcrPayload } from '@/lib/validation';

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
  const followUps = await prisma.lcrFollowUp.findMany({
    include: {
      customer: { include: { vehicles: true } },
      dealer: true,
    },
    orderBy: { followUpDate: 'desc' },
  });

  return NextResponse.json({
    records: followUps.map((item) => ({
      id: item.id,
      name: item.customer?.name ?? 'Customer tidak diketahui',
      phone: item.customer?.phone ?? '',
      nik: item.customer?.nik ?? '',
      motor: item.customer?.vehicles?.[0]?.model ?? 'Belum ada',
      district: item.dealer?.name ?? 'Belum ada',
      status: item.status,
      contact: item.contactStatus ?? 'Belum di-FU',
      result: item.result ?? 'Belum ada hasil',
      date: formatDateOnly(item.followUpDate),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validateLcrPayload(body);

    if (!payload.ok) {
      return NextResponse.json(
        { ok: false, message: payload.message },
        { status: 400 }
      );
    }

    const { name, phone, nik, motor, district, status, contact, result } = payload.data;

    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ phone: { equals: phone } }, { alternatePhone: { equals: phone } }, { nik: { equals: nik ?? undefined } }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          normalizedName: name.toLowerCase().replace(/\s+/g, ' '),
          phone,
          nik: nik || null,
          contactIdentityStatus: 'UNVERIFIED',
        },
      });
    }

    const dealer = await prisma.dealer.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const followUp = await prisma.lcrFollowUp.create({
      data: {
        customerId: customer.id,
        dealerId: dealer?.id ?? (await prisma.dealer.create({ data: { code: 'DEFAULT', name: 'Default Dealer' } })).id,
        status,
        contactStatus: contact,
        result,
        followUpDate: new Date(),
      },
      include: { customer: true, dealer: true },
    });

    return NextResponse.json({
      ok: true,
      record: {
        id: followUp.id,
        name: followUp.customer?.name ?? name,
        phone: followUp.customer?.phone ?? phone,
        nik: followUp.customer?.nik ?? nik,
        motor: motor || 'Belum ada',
        district: followUp.dealer?.name ?? (district || 'Belum ada'),
        status: followUp.status,
        contact: followUp.contactStatus ?? 'Belum di-FU',
        result: followUp.result ?? 'Belum ada hasil',
        date: formatDateOnly(followUp.followUpDate),
      },
    });
  } catch (error) {
    console.error('Failed to save LCR follow-up', error);
    return NextResponse.json(
      { ok: false, message: 'Gagal menyimpan data LCR.' },
      { status: 500 }
    );
  }
}
