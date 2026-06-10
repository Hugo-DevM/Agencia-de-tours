import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AdminSeatMap } from '@/components/admin/AdminSeatMap';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

interface PageProps {
  params: Promise<{ id: string }>;
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
  AWAITING_PAYMENT: 'Pago pend.',
  RESERVED:         'Apartado',
  CONFIRMED:        'Confirmada',
  CANCELLED:        'Cancelada',
};

export default async function AdminSeatMapPage({ params }: PageProps) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: { not: 'CANCELLED' } },
        include: { profile: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      seatLocks: {
        where: { expiresAt: { gt: new Date() } },
        select: { seatNumbers: true, profileId: true },
      },
    },
  });

  if (!trip) notFound();

  // Build seat state maps
  const confirmedSeats = trip.bookings
    .filter(b => b.status === 'CONFIRMED')
    .flatMap(b => b.seatNumbers);

  const reservedSeats = trip.bookings
    .filter(b => b.status === 'RESERVED')
    .flatMap(b => b.seatNumbers);

  const pendingSeats = trip.bookings
    .filter(b => b.status !== 'CONFIRMED' && b.status !== 'RESERVED')
    .flatMap(b => b.seatNumbers);

  const lockedSeats = trip.seatLocks.flatMap(l => l.seatNumbers);

  const takenCount = new Set([...confirmedSeats, ...pendingSeats]).size;
  const pct = Math.round((takenCount / trip.totalSeats) * 100);

  const BUS_TYPE_LABEL: Record<string, string> = {
    SINGLE_DOOR:   '1 puerta',
    DOUBLE_DOOR:   '2 puertas',
    DOUBLE_DECKER: 'Doble planta',
  };
  const TRIP_STATUS: Record<string, { label: string; dot: string; color: string; bg: string }> = {
    ACTIVE:    { label: 'Activo',    dot: '#22c55e', color: '#16a34a', bg: '#DCFCE7' },
    DRAFT:     { label: 'Borrador',  dot: '#94a3b8', color: '#475569', bg: '#F1F5F9' },
    CANCELLED: { label: 'Cancelado', dot: '#f87171', color: '#dc2626', bg: '#FEE2E2' },
  };
  const tripStatus = TRIP_STATUS[trip.status] ?? TRIP_STATUS.DRAFT;
  const availableSeats = trip.totalSeats - takenCount;

  return (
    <>
      <RealtimeRefresh
        channelName={`admin-seats:${id}`}
        tables={[
          { table: 'bookings',   filter: `trip_id=eq.${id}` },
          { table: 'seat_locks', filter: `trip_id=eq.${id}` },
        ]}
      />

      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/viajes" className="btn-icon" title="Volver a viajes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Link href="/admin/viajes" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--blue-600, #2563eb)', textDecoration: 'none' }}>Viajes</Link>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>/</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-subtle)' }}>Mapa de asientos</span>
            </div>
            <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              {trip.title}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: tripStatus.bg, color: tripStatus.color, fontSize: 13, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: tripStatus.dot }} />
            {tripStatus.label}
          </span>
        </div>
      </div>

      {/* ── Stats banner ── */}
      <div className="mt-6" style={{ padding: '0 var(--admin-px, 28px)', marginBottom: 'var(--s-5)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--ink-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Salida {formatDate(trip.departureDate)}
              </span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{BUS_TYPE_LABEL[trip.busType] ?? trip.busType}</span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span style={{ fontWeight: 600, color: 'var(--blue-600, #2563eb)' }}>{trip.totalSeats} asientos</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange-600, #ea580c)', fontFamily: 'var(--font-mono)' }}>
              {takenCount} / {trip.totalSeats} asientos ocupados
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 99, background: 'var(--canvas-2)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--orange-500)', transition: 'width 0.4s ease' }} />
          </div>

          {/* 4 stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { count: confirmedSeats.length, label: 'Confirmados', color: '#DC2626' },
              { count: reservedSeats.length,  label: 'Apartados',   color: '#F97316' },
              { count: pendingSeats.length,   label: 'Pendientes',  color: '#d97706' },
              { count: lockedSeats.length,    label: 'Bloqueados',  color: '#9333ea' },
              { count: availableSeats,        label: 'Disponibles', color: '#0284c7' },
            ].map(({ count, label, color }) => (
              <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px 16px', background: 'var(--surface-raised)' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color, margin: '0 0 2px', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{count}</p>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-subtle)', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="twocol" style={{ alignItems: 'start' }}>

          {/* Bus map */}
          <div className="form-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 'var(--s-5)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-subtle)', flexShrink: 0 }}>
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
              <span style={{ fontSize: 'var(--fs-13)', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.01em' }}>
                Mapa del autobús
              </span>
              <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-faint)' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', background: 'var(--canvas-2)', padding: '2px 8px', borderRadius: 999 }}>
                Solo lectura
              </span>
            </div>
            <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
              <AdminSeatMap
                totalSeats={trip.totalSeats}
                busType={trip.busType}
                confirmedSeats={confirmedSeats}
                reservedSeats={reservedSeats}
                pendingSeats={pendingSeats}
                lockedSeats={lockedSeats}
              />
            </div>
          </div>

          {/* Bookings list */}
          <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="h4">Reservaciones ({trip.bookings.length})</h4>
            </div>

            {trip.bookings.length === 0 ? (
              <p style={{ padding: 'var(--s-8)', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 'var(--fs-14)' }}>
                Sin reservaciones aún
              </p>
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {trip.bookings.map(b => (
                  <Link key={b.id} href={`/admin/reservaciones/${b.id}`} className="seat-booking-row">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-3)' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 'var(--w-semibold)', fontSize: 'var(--fs-14)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.profile.fullName ?? b.profile.email}
                        </p>
                        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', margin: '2px 0 0' }}>
                          {b.profile.email}
                        </p>
                      </div>
                      <span className={STATUS_BADGE[b.status] ?? 'badge badge-gray'} style={{ flexShrink: 0, fontSize: 12 }}>
                        <span className="dot" />
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--s-2)' }}>
                      <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-muted)' }}>
                        Asientos: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{b.seatNumbers.join(', ')}</span>
                      </span>
                      <span style={{ fontSize: 'var(--fs-13)', fontWeight: 'var(--w-semibold)', color: 'var(--orange-600)' }}>
                        {formatCurrency(b.totalAmount.toNumber())}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
