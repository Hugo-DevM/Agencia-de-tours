import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDepositCancelledEmail } from '@/lib/email';

// GET /api/cron/cancel-expired-deposits
// Runs every 15 minutes via Vercel Cron.
// Cancels RESERVED bookings whose depositExpiresAt has passed and sends an email.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

  // Find expired RESERVED bookings that have NOT received any payment yet.
  // If amountPaid > 0 the client already started paying — don't cancel them.
  const expired = await prisma.booking.findMany({
    where: {
      status:           'RESERVED',
      depositExpiresAt: { lt: now },
      amountPaid:       0,
    },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true } },
      profile: { select: { email: true, fullName: true } },
    },
  });

  // Backup: cancel AWAITING_PAYMENT bookings older than 4 days — these are OXXO
  // vouchers that expired without payment and the Stripe webhook didn't fire.
  const staleOxxo = await prisma.booking.findMany({
    where: {
      status:    'AWAITING_PAYMENT',
      createdAt: { lt: fourDaysAgo },
    },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true } },
      profile: { select: { email: true, fullName: true } },
    },
  });

  const allToCancel = [...expired, ...staleOxxo];

  if (!allToCancel.length) {
    return NextResponse.json({ cancelled: 0 });
  }

  // Bulk-cancel
  await prisma.booking.updateMany({
    where: { id: { in: allToCancel.map(b => b.id) } },
    data:  { status: 'CANCELLED', cancelledAt: now },
  });

  // Send cancellation emails (fire and forget — don't block on failures)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const emailResults = await Promise.allSettled(
    allToCancel.map(b => sendDepositCancelledEmail(b, appUrl))
  );

  const emailErrors = emailResults
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  if (emailErrors.length) {
    console.error('[cron/cancel-expired-deposits] email errors:', emailErrors);
  }

  console.log(`[cron/cancel-expired-deposits] cancelled ${expired.length} deposit + ${staleOxxo.length} stale OXXO bookings`);
  return NextResponse.json({ cancelled: allToCancel.length });
}
