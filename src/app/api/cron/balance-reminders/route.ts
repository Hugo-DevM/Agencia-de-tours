import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBalanceReminderEmail } from '@/lib/email';

// GET /api/cron/balance-reminders
// Runs once daily at 10:00 AM (Mexico City) via Vercel Cron.
// Sends a reminder email to customers with a RESERVED booking whose trip
// departs in exactly 7 days, 3 days, or 1 day — so they liquidate before departure.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Build date windows for 1, 3, and 7 days from now (start/end of each day)
  function dayWindow(daysFromNow: number) {
    const start = new Date(now);
    start.setDate(start.getDate() + daysFromNow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  const windows = [dayWindow(1), dayWindow(3), dayWindow(7)];

  // Fetch RESERVED bookings for trips departing on any of the reminder days
  const toRemind = await prisma.booking.findMany({
    where: {
      status: 'RESERVED',
      trip: {
        departureDate: {
          in: windows.flatMap(w => [w.gte, w.lte]), // Prisma OR via separate query below
        },
      },
    },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true } },
      profile: { select: { email: true, fullName: true } },
    },
  });

  // Filter to only the exact day windows (Prisma doesn't support OR date ranges cleanly above)
  const filtered = toRemind.filter(b => {
    const dep = b.trip.departureDate.getTime();
    return windows.some(w => dep >= w.gte.getTime() && dep <= w.lte.getTime());
  });

  if (!filtered.length) {
    return NextResponse.json({ reminded: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const results = await Promise.allSettled(
    filtered.map(b => sendBalanceReminderEmail(b, appUrl))
  );

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  if (errors.length) {
    console.error('[cron/balance-reminders] email errors:', errors);
  }

  console.log(`[cron/balance-reminders] reminded ${filtered.length} customers`);
  return NextResponse.json({ reminded: filtered.length });
}
