import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BookingQR } from '@/components/cuenta/BookingQR';
import { DepositCountdown } from '@/components/cuenta/DepositCountdown';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:          'Pendiente',
  AWAITING_PAYMENT: 'Pago pendiente',
  RESERVED:         'Apartado',
  CONFIRMED:        'Confirmada',
  CANCELLED:        'Cancelada',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'badge badge-yellow',
  AWAITING_PAYMENT: 'badge badge-yellow',
  RESERVED:         'badge badge-orange',
  CONFIRMED:        'badge badge-green',
  CANCELLED:        'badge badge-red',
};

const PAYMENT_LABEL: Record<string, string> = {
  CARD: 'Tarjeta de crédito/débito',
  OXXO: 'OXXO Pay',
  CASH: 'Efectivo',
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { bookingId } = await params;
  const user = await getAuthenticatedUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, profileId: user.id },
    include: {
      trip: {
        select: {
          title: true, destination: true, slug: true,
          departureDate: true, returnDate: true, coverImage: true,
          description: true, minimumDeposit: true,
        },
      },
      payments: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!booking) notFound();

  const nights = Math.round(
    (booking.trip.returnDate.getTime() - booking.trip.departureDate.getTime()) / 86400000
  );

  const isConfirmed      = booking.status === 'CONFIRMED';
  const isReserved       = booking.status === 'RESERVED';
  const isAwaitingOxxo   = booking.status === 'AWAITING_PAYMENT';
  const isPast           = booking.trip.departureDate < new Date();

  // Fetch OXXO voucher details from Stripe if applicable
  type OxxoInfo = { number: string | null; expiresAfter: number | null; hostedVoucherUrl: string | null };
  let oxxoInfo: OxxoInfo | null = null;
  if (isAwaitingOxxo) {
    const oxxoPayment = booking.payments.find(p => p.stripePaymentIntentId);
    if (oxxoPayment?.stripePaymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(oxxoPayment.stripePaymentIntentId);
        if (pi.status === 'requires_action' && pi.next_action?.type === 'oxxo_display_details') {
          const d = pi.next_action.oxxo_display_details;
          oxxoInfo = {
            number:           d.number ?? null,
            expiresAfter:     d.expires_after ?? null,
            hostedVoucherUrl: d.hosted_voucher_url ?? null,
          };
        }
      } catch { /* Stripe unavailable — still show the OXXO panel without details */ }
    }
  }
  // Sum from actual completed payments — more reliable than booking.amountPaid
  // which can lag behind due to webhook race conditions
  const paid      = booking.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const total     = booking.totalAmount.toNumber();
  const remaining = Math.max(0, total - paid);
  const pct         = total > 0 ? Math.round((paid / total) * 100) : 0;
  const minDeposit  = booking.trip.minimumDeposit?.toNumber() ?? 50;

  // Data encoded in QR — URL so staff can scan with any phone camera
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const qrData = `${appUrl}/validar/${booking.id}`;

  return (
    <div className="cuenta-content">
      <RealtimeRefresh
        channelName={`booking-detail:${bookingId}`}
        tables={[
          { table: 'bookings',  filter: `id=eq.${bookingId}` },
          { table: 'payments',  filter: `booking_id=eq.${bookingId}` },
        ]}
      />

      {/* Back */}
      <Link href="/cuenta/reservaciones" className="cuenta-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Mis reservaciones
      </Link>

      <div className="booking-detail-grid">
        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

          {/* Header card */}
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--s-2)' }}>{booking.trip.destination}</p>
                <h1 className="h3">{booking.trip.title}</h1>
              </div>
              <span className={STATUS_BADGE[booking.status] ?? 'badge badge-gray'} style={{ fontSize: 'var(--fs-13)' }}>
                <span className="dot" />
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>

            {booking.trip.coverImage && (
              <div style={{ marginTop: 'var(--s-5)', borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '16/6' }}>
                <img src={booking.trip.coverImage} alt={booking.trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          {/* Trip details */}
          <div className="form-card">
            <h2 className="h4" style={{ marginBottom: 'var(--s-5)' }}>Detalles del viaje</h2>
            <div className="booking-detail-grid-inner">
              <div className="booking-detail-item">
                <p className="booking-detail-label">Salida</p>
                <p className="booking-detail-val">{formatDate(booking.trip.departureDate)}</p>
              </div>
              <div className="booking-detail-item">
                <p className="booking-detail-label">Regreso</p>
                <p className="booking-detail-val">{formatDate(booking.trip.returnDate)}</p>
              </div>
              <div className="booking-detail-item">
                <p className="booking-detail-label">Duración</p>
                <p className="booking-detail-val">{nights} {nights === 1 ? 'día' : 'días'}</p>
              </div>
              <div className="booking-detail-item">
                <p className="booking-detail-label">Asientos</p>
                <p className="booking-detail-val">{booking.seatNumbers.join(', ')}</p>
              </div>
              {booking.paymentMethod && (
                <div className="booking-detail-item">
                  <p className="booking-detail-label">Método de pago</p>
                  <p className="booking-detail-val">{PAYMENT_LABEL[booking.paymentMethod] ?? booking.paymentMethod}</p>
                </div>
              )}
              {booking.confirmedAt && (
                <div className="booking-detail-item">
                  <p className="booking-detail-label">Confirmada el</p>
                  <p className="booking-detail-val">{formatDate(booking.confirmedAt)}</p>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: 'var(--s-5) 0' }} />

            {isReserved ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-14)' }}>Progreso de pago</span>
                    <span style={{ fontSize: 'var(--fs-13)', fontWeight: 700, color: 'var(--ink)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Pagado: {formatCurrency(paid)} MXN</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Total: {formatCurrency(total)} MXN</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Saldo pendiente</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-26)', fontWeight: 'var(--w-bold)', color: 'var(--orange-600)' }}>
                    {formatCurrency(remaining)} MXN
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Total pagado</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-26)', fontWeight: 'var(--w-bold)', color: 'var(--orange-600)' }}>
                  {formatCurrency(total)} MXN
                </span>
              </div>
            )}

            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', marginTop: 'var(--s-2)' }}>
              Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{booking.id}</span>
            </p>
          </div>

          {/* Payment history */}
          {booking.payments.filter(p => p.status === 'COMPLETED').length > 0 && (
            <div className="form-card">
              <h2 className="h4" style={{ marginBottom: 'var(--s-4)' }}>Historial de pagos</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {booking.payments.filter(p => p.status === 'COMPLETED').map((p, i, arr) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--s-3) 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        Abono #{i + 1} · {p.method === 'CASH' ? 'Efectivo' : p.method === 'OXXO' ? 'OXXO' : 'Tarjeta'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>
                        +{formatCurrency(p.amount.toNumber())} MXN
                      </p>
                      {p.stripeReceiptUrl && (
                        <a href={p.stripeReceiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--orange-500)', textDecoration: 'none' }}>
                          Ver comprobante ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QR / apartado sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

          {/* OXXO pending panel */}
          {isAwaitingOxxo && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--r-xl)', padding: 'var(--s-5)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EA580C', margin: '0 0 12px' }}>
                Pago OXXO pendiente
              </p>

              {/* Voucher number */}
              {oxxoInfo?.number && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, border: '1px solid #FED7AA' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#92400E', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    Número de referencia
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '0.08em', wordBreak: 'break-all' }}>
                    {oxxoInfo.number}
                  </p>
                </div>
              )}

              {/* Expiry */}
              {oxxoInfo?.expiresAfter && (
                <p style={{ fontSize: 12, color: '#C2410C', fontWeight: 600, margin: '0 0 12px' }}>
                  Vence el {new Date(oxxoInfo.expiresAfter * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              {/* Amount */}
              <p style={{ fontSize: 22, fontWeight: 900, color: '#EA580C', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
                {formatCurrency(total)} MXN
              </p>

              {/* View voucher button */}
              {oxxoInfo?.hostedVoucherUrl ? (
                <a
                  href={oxxoInfo.hostedVoucherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '12px 0', borderRadius: 999,
                    background: '#F97316', color: '#fff',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(249,115,22,.3)',
                  }}
                >
                  Ver voucher OXXO →
                </a>
              ) : (
                <p style={{ fontSize: 12, color: '#92400E', textAlign: 'center', margin: 0 }}>
                  Ve a cualquier tienda OXXO y proporciona este número de referencia al cajero.
                </p>
              )}

              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 'var(--s-3) 0 0' }}>
                Tu asiento está reservado hasta que venza el voucher.
              </p>
            </div>
          )}

          {/* Apartado panel */}
          {isReserved && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--r-xl)', padding: 'var(--s-5)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EA580C', margin: '0 0 4px' }}>
                {paid > 0 ? 'Asiento apartado' : 'Tiempo para pagar'}
              </p>
              {booking.depositExpiresAt && paid === 0 && (
                <>
                  <DepositCountdown expiresAt={booking.depositExpiresAt.toISOString()} />
                  <p style={{ fontSize: 11, color: '#C2410C', margin: '4px 0 var(--s-4)' }}>
                    Vence el {formatDate(booking.depositExpiresAt)}
                  </p>
                </>
              )}
              <Link
                href={`/cuenta/reservaciones/${bookingId}/abonar`}
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '12px 0', borderRadius: 999,
                  background: '#F97316', color: '#fff',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(249,115,22,.3)',
                }}
              >
                Hacer un abono →
              </Link>
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 'var(--s-3) 0 0' }}>
                Saldo pendiente: {formatCurrency(remaining)} MXN
              </p>
            </div>
          )}

          {isConfirmed && !isPast && (
            <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {/* Header */}
              <div style={{ background: '#0F1F4B', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>Pase de abordar</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{booking.trip.title}</p>
                </div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>
                </svg>
              </div>

              {/* Body */}
              <div style={{ background: '#fff', padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* QR */}
                <div style={{ flexShrink: 0 }}>
                  <BookingQR data={qrData} size={130} />
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-subtle)', margin: '0 0 2px' }}>Destino</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{booking.trip.destination}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-subtle)', margin: '0 0 2px' }}>Salida</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{formatDate(booking.trip.departureDate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-subtle)', margin: '0 0 4px' }}>Asientos</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {booking.seatNumbers.map(n => (
                        <span key={n} style={{ width: 28, height: 28, borderRadius: '50%', background: '#0F1F4B', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: '#F8FAFC', borderTop: '1px dashed var(--border)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: 'var(--ink-subtle)', margin: 0 }}>
                  Presenta este QR al abordar
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', margin: 0 }}>
                  {booking.id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {isPast && isConfirmed && (
            <div className="form-card" style={{ textAlign: 'center', opacity: 0.6 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" style={{ margin: '0 auto var(--s-3)' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <p className="muted" style={{ fontSize: 'var(--fs-14)' }}>Este viaje ya se realizó</p>
            </div>
          )}

          <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <Link href={`/viajes/${booking.trip.slug}`} className="btn btn-ghost btn-block" style={{ textAlign: 'center' }}>
              Ver viaje
            </Link>
            <Link href="/viajes" className="btn btn-orange btn-block" style={{ textAlign: 'center' }}>
              Reservar otro viaje
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
