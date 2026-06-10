'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props { bookingId: string }

// Polls GET /api/bookings/[id]/status every 5s while booking is PENDING.
// When the webhook fires and status changes to CONFIRMED, refreshes the page.
export function ConfirmationPoller({ bookingId }: Props) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;

    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`);
        if (res.ok) {
          const { status } = await res.json() as { status: string };
          if (status === 'CONFIRMED' || status === 'CANCELLED') {
            router.refresh();
            return;
          }
        }
      } catch { /* ignore */ }
      if (!stopped) setTimeout(poll, 5000);
    }

    const t = setTimeout(poll, 5000);
    return () => { stopped = true; clearTimeout(t); };
  }, [bookingId, router]);

  return (
    <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)', marginTop: 'var(--s-3)' }}>
      Verificando estado del pago…
    </p>
  );
}
