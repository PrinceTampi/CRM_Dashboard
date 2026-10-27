import { NextResponse } from 'next/server';
import { auth } from '@/auth';
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Silakan login untuk memuat data event.' }, { status: 401 });
  }

  if (session.user.role === 'AHASS') {
    return NextResponse.json({ events: [] });
  }

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Silakan login untuk menyimpan data event.' }, { status: 401 });
  }

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

    const result = await prisma.$transaction(async (transaction) => {
      const vehicle = await transaction.vehicle.findUnique({
        where: { engineNumber },
        include: { customer: true },
      });

      let customer = vehicle?.customer ?? await transaction.customer.findFirst({
        where: {
          OR: [{ phone: { equals: phone } }, { alternatePhone: { equals: phone } }],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (vehicle && customer && customer.id !== vehicle.customerId) {
        return { conflict: true as const };
      }

      if (!customer) {
        customer = await transaction.customer.create({
          data: {
            name,
            normalizedName: name.toLowerCase().replace(/\s+/g, ' '),
            phone,
            contactIdentityStatus: 'UNVERIFIED',
          },
        });
      } else if (vehicle && customer.phone !== phone && customer.alternatePhone !== phone) {
        if (!customer.phone) {
          customer = await transaction.customer.update({
            where: { id: customer.id },
            data: { phone },
          });
        } else if (!customer.alternatePhone) {
          customer = await transaction.customer.update({
            where: { id: customer.id },
            data: { alternatePhone: phone },
          });
        } else {
          return { conflict: true as const };
        }
      }

      if (!vehicle) {
        await transaction.vehicle.create({
          data: {
            customerId: customer.id,
            engineNumber,
            frameNumber: engineNumber,
            active: true,
          },
        });
      }

      const event = await transaction.eventRegistration.create({
        data: {
          customerId: customer.id,
          engineNumber,
          location: location || null,
          notes: notes || null,
          eventDate: new Date(),
        },
        include: { customer: true },
      });

      return { conflict: false as const, event, customer };
    });

    if (result.conflict) {
      return NextResponse.json(
        { ok: false, message: 'Nomor mesin sudah terhubung ke data konsumen lain. Periksa kembali nomor mesin dan nomor HP.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      event: {
        id: result.event.id,
        name: result.event.customer?.name ?? result.customer.name,
        phone: result.event.customer?.phone ?? result.customer.phone ?? '',
        engineNumber: result.event.engineNumber,
        location: result.event.location ?? null,
        notes: result.event.notes ?? null,
        eventDate: toDateInput(result.event.eventDate),
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
