'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props { bookingId: string }

/**
 * Listens for booking status changes via Supabase Realtime and refreshes
 * the page when the status moves to CONFIRMED or RESERVED.
 * Falls back to HTTP polling every 8 s in case the realtime channel drops.
 */
export function ConfirmationPoller({ bookingId }: Props) {
  const router = useRouter();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`confirmation:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus === 'CONFIRMED' || newStatus === 'RESERVED' || newStatus === 'CANCELLED') {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId, router]);

  // Polling fallback
  useEffect(() => {
    let stopped = false;

    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`);
        if (res.ok) {
          const { status } = await res.json() as { status: string };
          if (status === 'CONFIRMED' || status === 'RESERVED' || status === 'CANCELLED') {
            router.refresh();
            return;
          }
        }
      } catch { /* ignore */ }
      if (!stopped) setTimeout(poll, 8000);
    }

    const t = setTimeout(poll, 8000);
    return () => { stopped = true; clearTimeout(t); };
  }, [bookingId, router]);

  return (
    <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)', marginTop: 'var(--s-3)' }}>
      Verificando estado del pago…
    </p>
  );
}
