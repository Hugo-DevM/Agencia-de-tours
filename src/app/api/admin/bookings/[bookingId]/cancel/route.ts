import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

async function getAdminUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role !== 'ADMIN') return null;
  return user;
}

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  });

  if (!booking) return NextResponse.json({ error: 'Reservación no encontrada' }, { status: 404 });
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Ya está cancelada' }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
