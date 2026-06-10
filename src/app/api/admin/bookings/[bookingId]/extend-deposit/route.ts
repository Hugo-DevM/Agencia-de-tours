import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  hours: z.number().int().min(1).max(168).default(24), // 1h – 7 days
});

async function getAdminUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (profile?.role !== 'ADMIN') return null;
  return user;
}

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { bookingId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const hours = parsed.success ? parsed.data.hours : 24;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, depositExpiresAt: true },
  });

  if (!booking) return NextResponse.json({ error: 'Reservación no encontrada' }, { status: 404 });
  if (booking.status !== 'RESERVED') {
    return NextResponse.json({ error: 'Solo se puede extender el plazo de apartados activos' }, { status: 400 });
  }

  // Extend from now if already expired, or from current expiry
  const base = booking.depositExpiresAt && booking.depositExpiresAt > new Date()
    ? booking.depositExpiresAt
    : new Date();
  const newExpiry = new Date(base.getTime() + hours * 3600_000);

  await prisma.booking.update({
    where: { id: bookingId },
    data: { depositExpiresAt: newExpiry },
  });

  return NextResponse.json({ ok: true, depositExpiresAt: newExpiry.toISOString() });
}
