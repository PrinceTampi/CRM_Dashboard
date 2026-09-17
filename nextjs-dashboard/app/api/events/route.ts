import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEventPayload } from '@/lib/validation';

function toDateInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET() {
  const events = await prisma.eventRegistration.findMany({
    orderBy: { eventDate: 'desc' },
    take: 20,
    include: { customer: true },
  });

  return NextResponse.json({
    events: events.map((event) => ({
      id: event.id,
      name: event.customer?.name ?? 'Customer tidak diketahui',
      phone: event.customer?.phone ?? '',
      engineNumber: event.engineNumber,
      location: event.location ?? null,
      notes: event.notes ?? null,
      eventDate: toDateInput(event.eventDate),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validateEventPayload(body);

    if (!payload.ok) {
      return NextResponse.json(
        { ok: false, message: payload.message },
        { status: 400 }
      );
    }

    const { name, phone, engineNumber, location, notes } = payload.data;

    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ phone: { equals: phone } }, { alternatePhone: { equals: phone } }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          normalizedName: name.toLowerCase().replace(/\s+/g, ' '),
          phone,
          contactIdentityStatus: 'UNVERIFIED',
        },
      });
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { engineNumber },
    });

    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          engineNumber,
          frameNumber: engineNumber,
          active: true,
        },
      });
    }

    const event = await prisma.eventRegistration.create({
      data: {
        customerId: customer.id,
        engineNumber,
        location: location || null,
        notes: notes || null,
        eventDate: new Date(),
      },
      include: { customer: true },
    });

    return NextResponse.json({
      ok: true,
      event: {
        id: event.id,
        name: event.customer?.name ?? customer.name,
        phone: event.customer?.phone ?? customer.phone ?? '',
        engineNumber: event.engineNumber,
        location: event.location ?? null,
        notes: event.notes ?? null,
        eventDate: toDateInput(event.eventDate),
      },
    });
  } catch (error) {
    console.error('Failed to create AHASS event registration', error);
    return NextResponse.json(
      { ok: false, message: 'Gagal menyimpan data event AHASS.' },
      { status: 500 }
    );
  }
}
