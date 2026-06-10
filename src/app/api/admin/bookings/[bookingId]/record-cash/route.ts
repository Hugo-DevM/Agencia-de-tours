import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive(),
  notes:  z.string().optional(),
});

async function getAdminUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role !== 'ADMIN') return null;
  return user;
}

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { bookingId } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }
  const { amount, notes } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, totalAmount: true, amountPaid: true },
  });

  if (!booking) return NextResponse.json({ error: 'Reservación no encontrada' }, { status: 404 });
  if (booking.status !== 'RESERVED') {
    return NextResponse.json({ error: 'Solo se pueden registrar abonos en reservaciones con estado Apartado' }, { status: 400 });
  }

  const total     = booking.totalAmount.toNumber();
  const paid      = booking.amountPaid.toNumber();
  const remaining = total - paid;

  if (amount > remaining + 0.01) {
    return NextResponse.json({ error: `El monto excede el saldo pendiente ($${remaining.toFixed(2)} MXN)` }, { status: 400 });
  }

  const newAmountPaid = paid + amount;
  const isFullyPaid   = newAmountPaid >= total - 0.01;
  const newStatus     = isFullyPaid ? 'CONFIRMED' : 'RESERVED';

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId,
        amount,
        method:       'CASH',
        status:       'COMPLETED',
        notes:        notes ?? null,
        recordedById: admin.id,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        amountPaid:       newAmountPaid,
        status:           newStatus,
        paymentMethod:    'CASH',
        // Clear the deposit deadline as soon as any payment is received —
        // the client has demonstrated intent, so the countdown should stop.
        depositExpiresAt: null,
        ...(isFullyPaid ? { confirmedAt: new Date() } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true, newStatus, newAmountPaid });
}
