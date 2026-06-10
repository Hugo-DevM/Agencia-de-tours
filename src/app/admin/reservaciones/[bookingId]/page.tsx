import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CopyIdButton } from '@/components/admin/CopyIdButton';
import { AdminApartadoActions } from '@/components/admin/AdminApartadoActions';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'badge badge-blue',
  AWAITING_PAYMENT: 'badge badge-yellow',
  RESERVED:         'badge badge-orange',
  CONFIRMED:        'badge badge-green',
  CANCELLED:        'badge badge-red',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING:          'Pendiente',
  AWAITING_PAYMENT: 'Pago pendiente',
  RESERVED:         'Apartado',
  CONFIRMED:        'Confirmada',
  CANCELLED:        'Cancelada',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--s-3) 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--w-medium)', color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip:     { select: { id: true, title: true, destination: true, departureDate: true, returnDate: true, slug: true } },
      profile:  { select: { fullName: true, email: true, phone: true } },
      payments: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!booking) notFound();

  const nights     = Math.round(
    (booking.trip.returnDate.getTime() - booking.trip.departureDate.getTime()) / 86400000
  );
  const isReserved = booking.status === 'RESERVED';
  const paid       = booking.amountPaid.toNumber();
  const total      = booking.totalAmount.toNumber();
  const remaining  = total - paid;
  const pct        = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <>
      <RealtimeRefresh
        channelName={`admin-booking:${bookingId}`}
        tables={[
          { table: 'bookings', filter: `id=eq.${bookingId}` },
          { table: 'payments', filter: `booking_id=eq.${bookingId}` },
        ]}
      />

      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <Link href="/admin/reservaciones" className="btn-icon" title="Volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <div className="eyebrow">Reservación</div>
            <h1 style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--w-semibold)', margin: '2px 0 0' }}>
              {booking.profile.fullName ?? booking.profile.email}
            </h1>
          </div>
        </div>
        <span className={STATUS_BADGE[booking.status] ?? 'badge badge-gray'} style={{ fontSize: 'var(--fs-14)' }}>
          <span className="dot" />
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="admin-content">
        <div className="twocol">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

            {/* Cliente */}
            <div className="form-card">
              <h4 className="h4" style={{ marginBottom: 'var(--s-4)' }}>Cliente</h4>
              <Row label="Nombre"  value={booking.profile.fullName ?? '—'} />
              <Row label="Email"   value={<a href={`mailto:${booking.profile.email}`} style={{ color: 'var(--blue-700)' }}>{booking.profile.email}</a>} />
              <Row label="Teléfono" value={booking.profile.phone ?? '—'} />
            </div>

            {/* Viaje */}
            <div className="form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s-4)' }}>
                <h4 className="h4">Viaje</h4>
                <Link href={`/admin/viajes/${booking.tripId}`} className="btn-icon" title="Editar viaje">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </Link>
              </div>
              <Row label="Título"      value={booking.trip.title} />
              <Row label="Destino"     value={booking.trip.destination} />
              <Row label="Salida"      value={formatDate(booking.trip.departureDate)} />
              <Row label="Regreso"     value={formatDate(booking.trip.returnDate)} />
              <Row label="Duración"    value={`${nights} ${nights === 1 ? 'día' : 'días'}`} />
            </div>

            {/* Pago */}
            <div className="form-card">
              <h4 className="h4" style={{ marginBottom: 'var(--s-4)' }}>Pago</h4>
              <Row label="Asientos"   value={<span style={{ fontFamily: 'var(--font-mono)' }}>{booking.seatNumbers.join(', ')}</span>} />
              <Row label="Total"      value={<span style={{ color: 'var(--orange-600)', fontWeight: 'var(--w-bold)', fontFamily: 'var(--font-display)' }}>{formatCurrency(total)}</span>} />
              <Row label="Pagado"     value={<span style={{ color: '#16a34a', fontWeight: 'var(--w-bold)' }}>{formatCurrency(paid)}</span>} />
              {isReserved && <Row label="Saldo"  value={<span style={{ color: '#ea580c', fontWeight: 'var(--w-bold)' }}>{formatCurrency(remaining)}</span>} />}
              <Row label="Método"     value={booking.paymentMethod === 'CARD' ? 'Tarjeta' : booking.paymentMethod === 'CASH' ? 'Efectivo' : booking.paymentMethod === 'OXXO' ? 'OXXO Pay' : '—'} />
              <Row label="Confirmada" value={booking.confirmedAt ? formatDate(booking.confirmedAt) : '—'} />
              <Row label="Cancelada"  value={booking.cancelledAt ? formatDate(booking.cancelledAt) : '—'} />

              {/* Progress bar for RESERVED */}
              {isReserved && (
                <div style={{ marginTop: 'var(--s-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Progreso de pago</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
                  </div>
                </div>
              )}

              {/* Payment history */}
              {booking.payments.length > 0 && (
                <div style={{ marginTop: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-faint)', textTransform: 'uppercase', fontFamily: 'monospace', margin: '0 0 8px' }}>
                    Historial de abonos
                  </p>
                  {booking.payments.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < booking.payments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                          Abono #{i + 1} · {p.method === 'CASH' ? 'Efectivo' : p.method === 'OXXO' ? 'OXXO' : 'Tarjeta'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                          {formatDate(p.createdAt)}{p.notes ? ` · ${p.notes}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>
                          +{formatCurrency(p.amount.toNumber())} MXN
                        </p>
                        {p.stripeReceiptUrl && (
                          <a href={p.stripeReceiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--orange-500)', textDecoration: 'none' }}>
                            Comprobante ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reference */}
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
              ID: {bookingId} · Creada: {formatDate(booking.createdAt)}
            </p>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

            {/* Apartado actions */}
            {isReserved && (
              <AdminApartadoActions
                bookingId={bookingId}
                remaining={remaining}
                expiresAt={booking.depositExpiresAt?.toISOString() ?? null}
              />
            )}

            {/* Acciones rápidas */}
            <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              <h4 className="h4" style={{ marginBottom: 'var(--s-2)' }}>Acciones rápidas</h4>

              <Link
                href={`/admin/viajes/${booking.tripId}/asientos`}
                className="btn btn-ghost btn-block"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                Ver mapa de asientos
              </Link>

              <Link
                href={`/viajes/${booking.trip.slug}`}
                target="_blank"
                className="btn btn-ghost btn-block"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Ver viaje público
              </Link>

              <CopyIdButton id={bookingId} />
            </div>

            {/* Línea de tiempo */}
            <div className="form-card">
              <h4 className="h4" style={{ marginBottom: 'var(--s-5)' }}>Línea de tiempo</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  {
                    label: 'Reservación creada',
                    date:  booking.createdAt,
                    done:  true,
                    color: 'var(--blue-600)',
                    sub:   null as string | null,
                  },
                  // One entry per completed payment
                  ...booking.payments.map((p, idx) => ({
                    label: `Abono #${idx + 1} · ${p.method === 'CASH' ? 'Efectivo' : p.method === 'OXXO' ? 'OXXO' : 'Tarjeta'}`,
                    date:  p.createdAt,
                    done:  true,
                    color: '#16a34a',
                    sub:   `+${formatCurrency(p.amount.toNumber())} MXN`,
                    skip:  false,
                  })),
                  // If no payments yet but payment was initiated
                  ...( booking.payments.length === 0 ? [{
                    label: 'Pago iniciado',
                    date:  (['AWAITING_PAYMENT','CONFIRMED','RESERVED'] as string[]).includes(booking.status)
                             ? booking.reservedAt ?? booking.createdAt
                             : null,
                    done:  (['AWAITING_PAYMENT','CONFIRMED','RESERVED'] as string[]).includes(booking.status),
                    color: 'var(--orange-500)',
                    sub:   null as string | null,
                    skip:  false,
                  }] : []),
                  {
                    label: booking.status === 'RESERVED' ? 'Saldo liquidado' : 'Pago confirmado',
                    date:  booking.confirmedAt,
                    done:  !!booking.confirmedAt,
                    color: '#16a34a',
                    sub:   null as string | null,
                    skip:  booking.status === 'CANCELLED',
                  },
                  {
                    label: 'Cancelada',
                    date:  booking.cancelledAt,
                    done:  !!booking.cancelledAt,
                    color: '#dc2626',
                    sub:   null as string | null,
                    skip:  booking.status !== 'CANCELLED',
                  },
                ]
                  .filter(e => !e.skip)
                  .map((event, i, arr) => (
                    <div key={i} style={{ display: 'flex', gap: 'var(--s-3)', paddingBottom: i < arr.length - 1 ? 'var(--s-4)' : 0 }}>
                      {/* Dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', marginTop: 3,
                          background: event.done ? event.color : 'var(--border)',
                          border: `2px solid ${event.done ? event.color : 'var(--border)'}`,
                          flexShrink: 0,
                        }} />
                        {i < arr.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />
                        )}
                      </div>
                      {/* Text */}
                      <div style={{ paddingBottom: i < arr.length - 1 ? 'var(--s-1)' : 0 }}>
                        <p style={{
                          fontSize: 'var(--fs-13)',
                          fontWeight: event.done ? 'var(--w-medium)' : 'var(--w-normal)',
                          color: event.done ? 'var(--ink)' : 'var(--ink-faint)',
                          margin: 0,
                        }}>
                          {event.label}
                        </p>
                        {event.date && (
                          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', margin: '2px 0 0' }}>
                            {formatDate(event.date)}
                          </p>
                        )}
                        {event.sub && (
                          <p style={{ fontSize: 'var(--fs-12)', fontWeight: 700, color: '#16a34a', margin: '2px 0 0' }}>
                            {event.sub}
                          </p>
                        )}
                        {!event.done && (
                          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-faint)', margin: '2px 0 0' }}>
                            Pendiente
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
