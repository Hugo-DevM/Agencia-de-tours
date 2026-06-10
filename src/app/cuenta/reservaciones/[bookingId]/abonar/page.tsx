import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AbonarForm } from '@/components/cuenta/AbonarForm';
import { DepositCountdown } from '@/components/cuenta/DepositCountdown';

interface PageProps { params: Promise<{ bookingId: string }> }

export default async function AbonarPage({ params }: PageProps) {
  const { bookingId } = await params;
  const user = await getAuthenticatedUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, profileId: user.id },
    include: {
      trip:     { select: { title: true, destination: true, departureDate: true, minimumDeposit: true } },
      payments: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!booking) notFound();
  if (booking.status !== 'RESERVED') redirect(`/cuenta/reservaciones/${bookingId}`);

  const total      = booking.totalAmount.toNumber();
  const paid       = booking.amountPaid.toNumber();
  const remaining  = total - paid;
  const minDeposit = booking.trip.minimumDeposit?.toNumber() ?? 50;
  const pct        = Math.round((paid / total) * 100);
  const ref        = bookingId.slice(-8).toUpperCase();

  return (
    <div className="cuenta-content">
      <Link href={`/cuenta/reservaciones/${bookingId}`} className="cuenta-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Ver mi apartado
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

        {/* ── Left: form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-card">
            <h1 className="h3" style={{ marginBottom: 'var(--s-2)' }}>Hacer un abono</h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-14)', margin: 0 }}>
              Elige cuánto quieres abonar a tu apartado. Puedes hacer múltiples abonos hasta liquidar el total.
            </p>
          </div>

          <div className="form-card">
            <AbonarForm
              bookingId={bookingId}
              remaining={remaining}
              minDeposit={minDeposit}
            />
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Al abonar aceptás la política de cancelación de AgenciaTours. Los abonos no son reembolsables.
          </p>
        </div>

        {/* ── Right: summary ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Booking info */}
          <div className="form-card">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', margin: '0 0 4px' }}>
              Referencia #{ref}
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>{booking.trip.title}</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              {booking.trip.destination} · {formatDate(booking.trip.departureDate)}
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Progreso de pago</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Pagado: {formatCurrency(paid)} MXN</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Total: {formatCurrency(total)} MXN</span>
              </div>
            </div>

            <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Saldo pendiente</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#F97316', letterSpacing: '-0.02em' }}>
                {formatCurrency(remaining)} MXN
              </span>
            </div>
          </div>

          {/* Expiry */}
          {booking.depositExpiresAt && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tiempo restante de apartado
              </p>
              <DepositCountdown expiresAt={booking.depositExpiresAt.toISOString()} />
              <p style={{ fontSize: 11, color: '#C2410C', margin: '4px 0 0' }}>
                Vence el {formatDate(booking.depositExpiresAt)}
              </p>
            </div>
          )}

          {/* Payment history */}
          {booking.payments.length > 0 && (
            <div className="form-card">
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', margin: '0 0 12px' }}>
                Historial de abonos
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {booking.payments.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < booking.payments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        Abono #{i + 1} · {p.method === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      +{formatCurrency(p.amount.toNumber())} MXN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
