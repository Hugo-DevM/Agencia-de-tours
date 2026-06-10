import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true, returnDate: true } },
      profile: { select: { fullName: true, email: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({
      valid: false, error: 'Reservación no encontrada',
      status: 'NOT_FOUND', passengerName: '', email: '',
      tripTitle: '', destination: '', departureDate: '', seats: '',
      bookingId, isPast: false,
    });
  }

  const isValid = booking.status === 'CONFIRMED';
  const isPast  = booking.trip.departureDate < new Date();

  const STATUS_LABEL: Record<string, string> = {
    PENDING:          'Pendiente',
    AWAITING_PAYMENT: 'Pago pendiente',
    RESERVED:         'Apartado',
    CONFIRMED:        'Confirmada',
    CANCELLED:        'Cancelada',
  };

  return NextResponse.json({
    valid:         isValid,
    status:        STATUS_LABEL[booking.status] ?? booking.status,
    passengerName: booking.profile.fullName ?? booking.profile.email,
    email:         booking.profile.email,
    tripTitle:     booking.trip.title,
    destination:   booking.trip.destination,
    departureDate: formatDate(booking.trip.departureDate),
    seats:         booking.seatNumbers.join(', '),
    bookingId:     booking.id,
    isPast,
  });
}
