import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

const schema = z.object({
  tripId:      z.string().min(1),
  seatNumbers: z.array(z.number().int().positive()).min(1).max(6),
  lockId:      z.string().min(1),
  mode:        z.enum(['full', 'deposit']).default('full'),
});

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Parámetros inválidos' },
      { status: 400 }
    );
  }
  const { tripId, seatNumbers, lockId, mode } = parsed.data;

  // 2. Validate lock is still active
  const service = createServiceRoleClient();
  const { data: lock } = await service
    .from('seat_locks')
    .select('id, seat_numbers, expires_at')
    .eq('trip_id', tripId)
    .eq('profile_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lock) {
    return NextResponse.json(
      { error: 'Tu reserva temporal expiró. Vuelve a seleccionar tus asientos.' },
      { status: 409 }
    );
  }

  // 3. Fetch trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, status: 'ACTIVE' },
    select: { id: true, title: true, pricePerSeat: true, slug: true, minimumDeposit: true },
  });
  if (!trip) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });

  // 4. Fetch profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { email: true, fullName: true },
  });

  // 5. Calculate amount
  const totalAmount    = trip.pricePerSeat.toNumber() * seatNumbers.length;
  const depositAmount  = trip.minimumDeposit ? trip.minimumDeposit.toNumber() * seatNumbers.length : totalAmount;
  const chargeAmount   = mode === 'deposit' ? depositAmount : totalAmount;
  const amountCents    = Math.round(chargeAmount * 100);

  if (mode === 'deposit' && !trip.minimumDeposit) {
    return NextResponse.json({ error: 'Este viaje no permite apartado' }, { status: 400 });
  }

  // 6. Idempotency — reuse existing booking + PaymentIntent if still valid
  const existing = await prisma.booking.findFirst({
    where: {
      tripId,
      profileId: user.id,
      status: { in: ['PENDING', 'AWAITING_PAYMENT'] },
    },
    include: {
      payments: {
        where: { stripePaymentIntentId: { not: null }, status: 'PENDING' },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing?.payments[0]?.stripePaymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(existing.payments[0].stripePaymentIntentId!);
      const terminalStatuses = ['canceled', 'succeeded', 'processing'];
      if (!terminalStatuses.includes(pi.status)) {
        // Only reuse if the amount matches — mode may have changed (full ↔ deposit)
        if (pi.amount === amountCents) {
          return NextResponse.json({ clientSecret: pi.client_secret, bookingId: existing.id });
        }
        // Amount changed — cancel the old PI and create a fresh one
        await stripe.paymentIntents.cancel(pi.id).catch(() => null);
      }
    } catch { /* PI not found — fall through */ }
  }

  // Cancel stale PENDING bookings
  await prisma.booking.updateMany({
    where: { tripId, profileId: user.id, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  // 7. Create booking
  const bookingId = createId();
  const now        = new Date();

  try {
    await prisma.booking.create({
      data: {
        id:           bookingId,
        tripId,
        profileId:    user.id,
        seatNumbers,
        totalAmount,
        amountPaid:   0,
        status:       'PENDING',
        paymentMethod: 'CARD',
        ...(mode === 'deposit' ? { reservedAt: now } : {}),
      },
    });
  } catch (err) {
    console.error('[create-payment-intent] create booking error:', err);
    return NextResponse.json({ error: 'Error al crear la reservación' }, { status: 500 });
  }

  // 8. Create Stripe PaymentIntent
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'mxn',
      payment_method_types: ['card', 'oxxo'],
      payment_method_options: { oxxo: { expires_after_days: 3 } },
      metadata: {
        bookingId,
        tripId,
        profileId: user.id,
        seats:     seatNumbers.join(','),
        mode,
      },
      receipt_email: profile?.email ?? undefined,
      description: `${trip.title} — Asientos ${seatNumbers.join(', ')}${mode === 'deposit' ? ' (depósito)' : ''}`,
    });

    // 9. Store payment record (not on booking — on Payment table)
    await prisma.payment.create({
      data: {
        bookingId,
        amount:               chargeAmount,
        method:               'CARD',
        status:               'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, bookingId });

  } catch (err: unknown) {
    await prisma.booking.delete({ where: { id: bookingId } }).catch(() => null);
    console.error('[create-payment-intent] stripe error:', err);
    // Stripe test-mode amount limit — surface a clear message instead of a generic 500
    const stripeMsg = (err as { raw?: { message?: string } })?.raw?.message ?? '';
    if (stripeMsg.toLowerCase().includes('amount must be at most')) {
      return NextResponse.json(
        { error: 'El monto excede el límite permitido en modo de prueba ($10,000 MXN). Usa un precio menor para probar.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al iniciar el pago' }, { status: 500 });
  }
}
