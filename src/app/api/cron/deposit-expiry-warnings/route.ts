import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDepositExpiryWarning } from '@/lib/email';

// GET /api/cron/deposit-expiry-warnings
// Runs every hour via Vercel Cron.
// Sends a warning email to customers whose apartado expires in the next 1–2 hours.
// The 1-hour window ensures each booking is warned exactly once per run cycle.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now     = new Date();
  const in1hour = new Date(now.getTime() + 1 * 3600_000);
  const in2hours = new Date(now.getTime() + 2 * 3600_000);

  // Bookings expiring in the 1–2h window (caught exactly once per hourly run)
  const expiring = await prisma.booking.findMany({
    where: {
      status:           'RESERVED',
      depositExpiresAt: { gte: in1hour, lte: in2hours },
    },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true } },
      profile: { select: { email: true, fullName: true } },
    },
  });

  if (!expiring.length) {
    return NextResponse.json({ warned: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const results = await Promise.allSettled(
    expiring.map(b => sendDepositExpiryWarning(b, appUrl))
  );

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  if (errors.length) {
    console.error('[cron/deposit-expiry-warnings] email errors:', errors);
  }

  console.log(`[cron/deposit-expiry-warnings] warned ${expiring.length} customers`);
  return NextResponse.json({ warned: expiring.length });
}
