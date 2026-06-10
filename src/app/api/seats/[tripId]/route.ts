import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface SeatRow {
  seat_number: number;
  state: 'confirmed' | 'pending' | 'locked';
  profile_id: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const service = createServiceRoleClient();

  // Try to get current user — unauthenticated visitors still see the map
  let userId: string | null = null;
  try {
    const auth = await createServerClient();
    const { data: { user } } = await auth.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* ignore */ }

  const [rpcResult, reservedBookings, pendingBookings] = await Promise.all([
    service.rpc('get_seat_availability', { p_trip_id: tripId }),
    prisma.booking.findMany({
      where:  { tripId, status: 'RESERVED' },
      select: { seatNumbers: true },
    }),
    // Fetch PENDING bookings from Prisma — the RPC may classify these as
    // 'confirmed' since it doesn't distinguish paid vs in-progress bookings.
    prisma.booking.findMany({
      where:  { tripId, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
      select: { seatNumbers: true },
    }),
  ]);

  if (rpcResult.error) {
    console.error('[GET /api/seats] rpc error:', rpcResult.error.message);
    return NextResponse.json({ error: rpcResult.error.message }, { status: 500 });
  }

  const rows = (rpcResult.data ?? []) as SeatRow[];

  // RESERVED (apartado) seats — shown separately with their own color
  const reservedSeats     = reservedBookings.flatMap(b => b.seatNumbers);
  // PENDING booking seats — the RPC may wrongly classify these as 'confirmed'
  const pendingBookingSeats = pendingBookings.flatMap(b => b.seatNumbers);

  // confirmed = truly paid seats only (strip out reserved & pending-booking seats)
  const rpcConfirmed = rows.filter(r => r.state === 'confirmed').map(r => r.seat_number);
  const confirmed    = rpcConfirmed.filter(
    n => !reservedSeats.includes(n) && !pendingBookingSeats.includes(n)
  );

  // pending = RPC pending + any PENDING-booking seats the RPC put in 'confirmed'
  const rpcPending       = rows.filter(r => r.state === 'pending').map(r => r.seat_number);
  const allPendingSeats  = Array.from(new Set([...rpcPending, ...pendingBookingSeats]));

  // For authenticated users: find their own lock and pending booking so the
  // client can exclude them from the blocked view and release stale state.
  let myLock: { id: string; seatNumbers: number[] } | null = null;
  let myPendingBookingId: string | null = null;
  let myLockSeats: number[] = [];
  let myPendingSeats: number[] = [];

  if (userId) {
    const [lockResult, myBooking] = await Promise.all([
      service
        .from('seat_locks')
        .select('id, seat_numbers')
        .eq('trip_id', tripId)
        .eq('profile_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      prisma.booking.findFirst({
        where: { tripId, profileId: userId, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
        select: { id: true, seatNumbers: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (lockResult.data) {
      myLock      = { id: lockResult.data.id, seatNumbers: lockResult.data.seat_numbers as number[] };
      myLockSeats = myLock.seatNumbers;
    }
    if (myBooking) {
      myPendingBookingId = myBooking.id;
      myPendingSeats     = myBooking.seatNumbers;
    }
  }

  // Exclude the current user's own seats from locked/pending so they see them as free
  return NextResponse.json({
    confirmed,
    reserved: reservedSeats,
    pending: allPendingSeats.filter(n => !myPendingSeats.includes(n)),
    locked: rows
      .filter(r => r.state === 'locked' && !myLockSeats.includes(r.seat_number))
      .map(r => r.seat_number),
    myLock,
    myPendingBookingId,
  });
}
