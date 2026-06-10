import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';
import { rateLimit } from '@/lib/rate-limit';
import { lockSeatsSchema } from '@/lib/validations';

// POST /api/seats/lock — lock seats atomically for 15 minutes
export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Rate limit: 10 lock attempts per user per minute
  const rl = rateLimit(`lock:${user.id}`, { limit: 10, windowSecs: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'Retry-After':           String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Zod validation
  const parsed = lockSeatsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Parámetros inválidos' },
      { status: 400 }
    );
  }
  const { tripId, seatNumbers } = parsed.data;

  const lockId = createId();
  const service = createServiceRoleClient();

  const { data, error } = await service.rpc('lock_seats', {
    p_trip_id:      tripId,
    p_profile_id:   user.id,
    p_seat_numbers: seatNumbers,
    p_lock_id:      lockId,
    p_ttl_minutes:  15,
  });

  if (error) {
    console.error('[POST /api/seats/lock] rpc error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { ok: boolean; conflict?: number[]; expires_at?: string };

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, conflict: result.conflict },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    lockId,
    expiresAt: result.expires_at,
  });
}

// DELETE /api/seats/lock — release a lock early (user navigates away)
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await req.json();
  const { lockId } = body as { lockId: string };

  if (!lockId) {
    return NextResponse.json({ error: 'lockId requerido' }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from('seat_locks')
    .delete()
    .eq('id', lockId)
    .eq('profile_id', user.id); // owner check

  if (error) {
    console.error('[DELETE /api/seats/lock] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
