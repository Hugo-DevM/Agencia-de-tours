import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [recentBookings, recentPayments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
      include: {
        profile: { select: { fullName: true, email: true } },
        trip:    { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.payment.findMany({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      include: {
        booking: {
          include: {
            profile: { select: { fullName: true, email: true } },
            trip:    { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  type NotificationItem = {
    id: string;
    type: 'booking_confirmed' | 'booking_reserved' | 'payment';
    title: string;
    body: string;
    amount: number | null;
    bookingId: string;
    createdAt: string;
  };

  const notifications: NotificationItem[] = [
    ...recentBookings.map(b => ({
      id:        `booking-${b.id}`,
      type:      (b.status === 'CONFIRMED' ? 'booking_confirmed' : 'booking_reserved') as NotificationItem['type'],
      title:     b.status === 'CONFIRMED' ? 'Reservación confirmada' : 'Nuevo apartado',
      body:      `${b.profile.fullName ?? b.profile.email} · ${b.trip.title}`,
      amount:    b.status === 'CONFIRMED' ? b.totalAmount.toNumber() : null,
      bookingId: b.id,
      createdAt: b.createdAt.toISOString(),
    })),
    ...recentPayments.map(p => ({
      id:        `payment-${p.id}`,
      type:      'payment' as NotificationItem['type'],
      title:     'Abono recibido',
      body:      `${p.booking.profile.fullName ?? p.booking.profile.email} · ${p.booking.trip.title}`,
      amount:    p.amount.toNumber(),
      bookingId: p.bookingId,
      createdAt: p.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 25);

  return NextResponse.json({ notifications });
}
