import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const schema = z.object({
  bookingId: z.string().min(1),
  amount:    z.number().positive(),
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
  const { bookingId, amount } = parsed.data;

  // 2. Fetch booking — must be RESERVED and belong to this user
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, profileId: user.id, status: 'RESERVED' },
    include: {
      trip:    { select: { title: true, minimumDeposit: true } },
      profile: { select: { email: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: 'Apartado no encontrado o ya liquidado' }, { status: 404 });
  }

  const remaining = booking.totalAmount.toNumber() - booking.amountPaid.toNumber();
  if (amount > remaining + 0.01) {
    return NextResponse.json(
      { error: `El monto excede el saldo pendiente ($${remaining.toFixed(2)} MXN)` },
      { status: 400 }
    );
  }

  const minDeposit = booking.trip.minimumDeposit?.toNumber() ?? 50;
  if (amount < minDeposit - 0.01) {
    return NextResponse.json(
      { error: `El abono mínimo es $${minDeposit.toFixed(2)} MXN` },
      { status: 400 }
    );
  }

  // 3. Create Stripe PaymentIntent for this abono
  const amountCents = Math.round(amount * 100);
  const profile = await prisma.profile.findUnique({
    where: { id: user.id }, select: { email: true },
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'mxn',
      payment_method_types: ['card'],
      metadata: {
        bookingId,
        tripId:    booking.tripId,
        profileId: user.id,
        mode:      'abono',
      },
      receipt_email: profile?.email ?? undefined,
      description: `Abono — ${booking.trip.title} (asientos ${booking.seatNumbers.join(', ')})`,
    });

    // 4. Create Payment record (PENDING until webhook confirms)
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        method: 'CARD',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId:    payment.id,
    });

  } catch (err) {
    console.error('[add-payment] stripe error:', err);
    return NextResponse.json({ error: 'Error al iniciar el pago' }, { status: 500 });
  }
}
