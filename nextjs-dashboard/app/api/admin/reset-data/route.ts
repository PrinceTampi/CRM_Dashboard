import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const CONFIRMATION = 'HAPUS DATA LOCAL';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, message: 'Reset data hanya tersedia di local development.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== CONFIRMATION) {
      return NextResponse.json({ ok: false, message: `Ketik "${CONFIRMATION}" untuk mengonfirmasi.` }, { status: 400 });
    }

    const deleted = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(`
        TRUNCATE TABLE
          "audit_logs",
          "import_rows",
          "h2_follow_ups",
          "lcr_follow_ups",
          "birthday_follow_ups",
          "event_registrations",
          "repair_orders",
          "h3_activation_leads",
          "prospect_leads",
          "lcr_campaign_records",
          "niguri_h1_snapshots",
          "niguri_h3_snapshots",
          "h2_service_items",
          "h3_part_items",
          "h1_sales",
          "h23_invoices",
          "import_batches",
          "vehicles",
          "customers",
          "lov_values",
          "dealers"
        RESTART IDENTITY CASCADE
      `);

      return { reset: true };
    }, { maxWait: 10000, timeout: 120000 });

    return NextResponse.json({
      ok: true,
      deleted,
      message: 'Seluruh data bisnis berhasil dihapus. Akun user tetap dipertahankan.',
    });
  } catch (error) {
    console.error('Failed to reset local business data:', error);
    return NextResponse.json({ ok: false, message: 'Reset gagal. Tidak ada perubahan yang diselesaikan.' }, { status: 500 });
  }
}
