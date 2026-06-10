import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { reserveCashSchema } from '@/lib/validations';
import { createId } from '@paralleldrive/cuid2';

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // 2. Validate body
  const parsed = reserveCashSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Parámetros inválidos' },
      { status: 400 }
    );
  }
  const { tripId, seatNumbers } = parsed.data;

  // 3. Validate lock is still active
  const service = createServiceRoleClient();
  const { data: lock } = await service
    .from('seat_locks')
    .select('id')
    .eq('trip_id', tripId)
    .eq('profile_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!lock) {
    return NextResponse.json(
      { error: 'Tu reserva temporal expiró. Vuelve a seleccionar tus asientos.' },
      { status: 409 }
    );
  }

  // 4. Fetch trip
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, status: 'ACTIVE' },
    select: {
      id: true, title: true, destination: true,
      departureDate: true, pricePerSeat: true, totalSeats: true,
      minimumDeposit: true, depositDeadlineHours: true, maxReservedPercent: true,
    },
  });
  if (!trip) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });

  // 5. Check apartado is enabled for this trip
  if (!trip.minimumDeposit) {
    return NextResponse.json({ error: 'Este viaje no permite apartado' }, { status: 400 });
  }

  // 6. Check reserved seat limit
  const reservedBookings = await prisma.booking.findMany({
    where:  { tripId, status: 'RESERVED' },
    select: { seatNumbers: true },
  });
  const currentReservedSeats = reservedBookings.flatMap(b => b.seatNumbers).length;
  const maxReservedSeats     = Math.floor(trip.totalSeats * (trip.maxReservedPercent / 100));

  if (currentReservedSeats + seatNumbers.length > maxReservedSeats) {
    return NextResponse.json(
      { error: 'No hay cupo para más apartados en este viaje. Solo puedes pagar completo.' },
      { status: 409 }
    );
  }

  // 7. Fetch profile for WhatsApp message
  const profile = await prisma.profile.findUnique({
    where:  { id: user.id },
    select: { fullName: true, email: true, phone: true },
  });

  // 8. Create RESERVED booking
  const bookingId      = createId();
  const now            = new Date();
  const depositExpires = new Date(now.getTime() + trip.depositDeadlineHours * 60 * 60 * 1000);
  const totalAmount    = trip.pricePerSeat.toNumber() * seatNumbers.length;
  const minDeposit     = trip.minimumDeposit.toNumber() * seatNumbers.length;

  // Delete any stale PENDING bookings for this user+trip — never had a successful payment
  await prisma.booking.deleteMany({
    where: { tripId, profileId: user.id, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } },
  });

  try {
    await prisma.booking.create({
      data: {
        id:              bookingId,
        tripId,
        profileId:       user.id,
        seatNumbers,
        totalAmount,
        amountPaid:      0,
        status:          'RESERVED',
        paymentMethod:   'CASH',
        reservedAt:      now,
        depositExpiresAt: depositExpires,
      },
    });
  } catch (err) {
    console.error('[reserve-cash] create booking error:', err);
    return NextResponse.json({ error: 'Error al crear el apartado' }, { status: 500 });
  }

  // 9. Release seat lock — the RESERVED booking now holds the seats
  await service
    .from('seat_locks')
    .delete()
    .eq('trip_id', tripId)
    .eq('profile_id', user.id);

  // 10. Build WhatsApp message
  const dep      = new Date(trip.departureDate);
  const months   = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dateStr  = `${dep.getDate()} de ${months[dep.getMonth()]} ${dep.getFullYear()}`;
  const ref      = bookingId.slice(-8).toUpperCase();
  const seatsStr = seatNumbers.join(', ');

  const whatsappText = [
    `¡Hola! Quiero apartar mis asientos en efectivo.`,
    ``,
    `📋 Referencia: #${ref}`,
    `🚌 Viaje: ${trip.title}`,
    `📍 Destino: ${trip.destination}`,
    `📅 Fecha: ${dateStr}`,
    `💺 Asientos: ${seatsStr}`,
    `💰 Total del viaje: $${totalAmount.toFixed(2)} MXN`,
    `📦 Depósito mínimo: $${minDeposit.toFixed(2)} MXN`,
    ``,
    `Por favor confírmenme para coordinar el pago. ¡Gracias!`,
  ].join('\n');

  const whatsappPhone = process.env.WHATSAPP_PHONE ?? '';
  const whatsappUrl   = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return NextResponse.json({
    ok:              true,
    bookingId,
    ref,
    depositExpiresAt: depositExpires.toISOString(),
    totalAmount,
    minDeposit,
    whatsappUrl,
    whatsappText,
  });
}
