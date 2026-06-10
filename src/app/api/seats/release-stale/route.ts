import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// POST /api/seats/release-stale
// Called when the user lands on the seat map after a failed/abandoned checkout.
// Releases their active lock and cancels any PENDING booking that didn't succeed.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { tripId } = await req.json() as { tripId?: string };
  if (!tripId) return NextResponse.json({ ok: false }, { status: 400 });

  const service = createServiceRoleClient();

  // 1. Release any active seat lock for this user+trip
  await service
    .from('seat_locks')
    .delete()
    .eq('trip_id', tripId)
    .eq('profile_id', user.id)
    .gt('expires_at', new Date().toISOString());

  // 2. Cancel PENDING/AWAITING_PAYMENT bookings whose payment didn't succeed
  const pendingBookings = await prisma.booking.findMany({
    where: { tripId, profileId: user.id, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
    include: {
      payments: {
        where: { stripePaymentIntentId: { not: null } },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  for (const booking of pendingBookings) {
    const payment = booking.payments[0];
    if (payment?.stripePaymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
        // Payment already went through — leave it alone; webhook will confirm the booking
        if (pi.status === 'succeeded' || pi.status === 'processing') continue;
      } catch { /* PI not found — safe to cancel */ }
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
