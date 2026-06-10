import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id, profileId: user.id },
    select: { status: true },
  });

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ status: booking.status });
}
