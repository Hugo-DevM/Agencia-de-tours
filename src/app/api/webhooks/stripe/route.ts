import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendBookingConfirmation } from '@/lib/email';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(pi);
      break;
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
      await handlePaymentFailed(pi);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId;
  const mode      = pi.metadata?.mode ?? 'full';
  if (!bookingId) return;

  // Find the payment record for this PI
  const payment = await prisma.payment.findFirst({
    where: { bookingId, stripePaymentIntentId: pi.id },
  });
  if (!payment) return;

  const charge     = pi.latest_charge as Stripe.Charge | null;
  const receiptUrl = typeof charge === 'object' ? charge?.receipt_url ?? null : null;
  const method: 'CARD' | 'OXXO' = pi.payment_method_types?.[0] === 'oxxo' ? 'OXXO' : 'CARD';

  // Use the actual Stripe amount as source of truth, not the DB record
  const actualCharge = pi.amount / 100;

  // Atomic increment avoids race conditions when concurrent payments succeed simultaneously
  const [, updatedBooking] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'COMPLETED', stripeReceiptUrl: receiptUrl, method, amount: actualCharge },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        amountPaid:    { increment: actualCharge },
        paymentMethod: method,
      },
      include: {
        trip:    { select: { id: true, title: true, departureDate: true, returnDate: true, destination: true } },
        profile: { select: { email: true, fullName: true } },
      },
    }),
  ]);

  // Determine status AFTER atomic increment so we have the real final value
  const isFullyPaid = updatedBooking.amountPaid.toNumber() >= updatedBooking.totalAmount.toNumber();
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status:      isFullyPaid ? 'CONFIRMED' : 'RESERVED',
      confirmedAt: isFullyPaid ? new Date() : undefined,
      reservedAt:  !isFullyPaid ? new Date() : undefined,
    },
  });

  // Delete stale PENDING bookings for same user+trip — never had a successful payment
  await prisma.booking.deleteMany({
    where: {
      tripId:    updatedBooking.tripId,
      profileId: updatedBooking.profileId,
      status:    { in: ['PENDING', 'AWAITING_PAYMENT'] },
      id:        { not: bookingId },
    },
  });

  // Release seat lock
  const service = createServiceRoleClient();
  await service
    .from('seat_locks')
    .delete()
    .eq('trip_id', updatedBooking.tripId)
    .eq('profile_id', updatedBooking.profileId);

  // Send email only on full confirmation
  if (isFullyPaid) {
    sendBookingConfirmation(updatedBooking).catch(err =>
      console.error('[webhook] email send error:', err)
    );
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId;
  if (!bookingId) return;

  // Delete PENDING/AWAITING_PAYMENT bookings on payment failure — never had a successful payment.
  // Don't touch RESERVED (partially paid).
  await prisma.booking.deleteMany({
    where: { id: bookingId, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
  }).catch(err => console.error('[webhook] delete booking error:', err));

  const tripId    = pi.metadata?.tripId;
  const profileId = pi.metadata?.profileId;
  if (tripId && profileId) {
    const service = createServiceRoleClient();
    await service
      .from('seat_locks')
      .delete()
      .eq('trip_id', tripId)
      .eq('profile_id', profileId);
  }
}
