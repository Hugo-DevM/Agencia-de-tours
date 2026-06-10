import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { updateBookingStatusSchema } from '@/lib/validations';

// PATCH /api/bookings/[id] — admin changes booking status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verify admin
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const parsed = updateBookingStatusSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }
  const { status } = parsed.data;

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: status as never,
      ...(status === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
      ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}
