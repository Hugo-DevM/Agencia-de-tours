import Link from 'next/link';
import Image from 'next/image';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

const PER_PAGE = 5;

const DEST_GRADIENTS: Record<string, string> = {
  default:       'linear-gradient(160deg,#38BDF8 0%,#0EA5E9 38%,#FCD34D 100%)',
  guanajuato:    'linear-gradient(160deg,#FBBF24 0%,#F97316 50%,#BE123C 100%)',
  'san luis':    'linear-gradient(160deg,#34D399 0%,#059669 50%,#064E3B 100%)',
  oaxaca:        'linear-gradient(160deg,#FBBF24 0%,#F97316 50%,#BE123C 100%)',
  chiapas:       'linear-gradient(160deg,#34D399 0%,#059669 50%,#064E3B 100%)',
  cdmx:          'linear-gradient(160deg,#818CF8 0%,#4F46E5 60%,#1E1B4B 100%)',
  veracruz:      'linear-gradient(160deg,#34D399 0%,#0EA5E9 60%,#0F172A 100%)',
};

function getGradient(destination: string) {
  const key = destination.toLowerCase();
  for (const [k, v] of Object.entries(DEST_GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return DEST_GRADIENTS.default;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED:        { label: 'Confirmado',       color: '#16a34a', bg: '#DCFCE7', dot: '#22c55e' },
  PENDING:          { label: 'Pendiente de pago', color: '#b45309', bg: '#FEF3C7', dot: '#f59e0b' },
  AWAITING_PAYMENT: { label: 'Pendiente de pago', color: '#b45309', bg: '#FEF3C7', dot: '#f59e0b' },
  RESERVED:         { label: 'Apartado',          color: '#c2410c', bg: '#FFF7ED', dot: '#f97316' },
  CANCELLED:        { label: 'Cancelado',         color: '#64748b', bg: '#F1F5F9', dot: '#94a3b8' },
};

function CalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
    </svg>
  );
}

interface PageProps {
  searchParams: Promise<{ pagina?: string }>;
}

export default async function ReservacionesPage({ searchParams }: PageProps) {
  const { pagina } = await searchParams;
  const user = await getAuthenticatedUser();

  const page  = Math.max(1, parseInt(pagina ?? '1', 10) || 1);
  const skip  = (page - 1) * PER_PAGE;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { profileId: user.id },
      include: {
        trip: {
          select: {
            title: true, destination: true, slug: true,
            departureDate: true, returnDate: true, coverImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PER_PAGE,
    }),
    prisma.booking.count({ where: { profileId: user.id } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  if (!bookings.length && page === 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0', textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.3">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>
        </svg>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Aún no tenés reservaciones</p>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Explorá los viajes disponibles y reservá tu lugar.</p>
        <Link href="/viajes" style={{ marginTop: 8, padding: '12px 28px', borderRadius: 999, background: '#F97316', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Ver viajes disponibles
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <RealtimeRefresh
        channelName={`reservaciones:${user.id}`}
        tables={[{ table: 'bookings', filter: `profile_id=eq.${user.id}` }]}
      />

      {/* Count */}
      <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
        <strong style={{ color: '#0F172A' }}>{total}</strong>{' '}
        {total === 1 ? 'reservación' : 'reservaciones'} ·{' '}
        página <strong style={{ color: '#0F172A' }}>{page}</strong> de{' '}
        <strong style={{ color: '#0F172A' }}>{totalPages}</strong>
      </p>

      {/* Booking cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bookings.map(b => {
          const dep = new Date(b.trip.departureDate);
          const ret = new Date(b.trip.returnDate);
          const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          const sameMonth = dep.getMonth() === ret.getMonth();
          const dateRange = sameMonth
            ? `${dep.getDate()} – ${ret.getDate()} ${months[dep.getMonth()]} ${dep.getFullYear()}`
            : `${dep.getDate()} ${months[dep.getMonth()]} – ${ret.getDate()} ${months[ret.getMonth()]} ${ret.getFullYear()}`;

          const status      = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.CANCELLED;
          const isPending      = b.status === 'PENDING';
          const isAwaitingOxxo = b.status === 'AWAITING_PAYMENT';
          const isReserved  = b.status === 'RESERVED';
          const isCompleted = b.trip.departureDate < new Date() && b.status === 'CONFIRMED';
          const paid        = b.amountPaid.toNumber();
          const total       = b.totalAmount.toNumber();
          const pct         = total > 0 ? Math.round((paid / total) * 100) : 0;
          const displayStatus = isCompleted
            ? { label: 'Completado', color: '#64748b', bg: '#F1F5F9', dot: '#94a3b8' }
            : status;

          return (
            <div key={b.id} className="bk-card">
              {/* Image */}
              <div className="bk-img" style={{ background: getGradient(b.trip.destination) }}>
                {b.trip.coverImage && (
                  <Image
                    src={b.trip.coverImage}
                    alt={b.trip.title}
                    fill
                    sizes="(max-width:600px) 100vw, 180px"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  background: '#F97316', color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 999,
                }}>
                  {b.trip.destination}
                </span>
              </div>

              {/* Body */}
              <div className="bk-body">
                {/* Trip info */}
                <div className="bk-info">
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.trip.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                      <CalIcon /> {dateRange}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Asientos:</span>
                    {b.seatNumbers.map(n => (
                      <span key={n} style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#EFF6FF', color: '#1E3A8A',
                        fontSize: 11, fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status + price + action */}
                <div className="bk-side">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 999,
                    background: displayStatus.bg,
                    fontSize: 11, fontWeight: 600, color: displayStatus.color,
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: displayStatus.dot, flexShrink: 0 }} />
                    {displayStatus.label}
                  </span>

                  {/* Progress bar for RESERVED */}
                  {isReserved && (
                    <div style={{ width: '100%' }}>
                      <div style={{ height: 6, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: '#F97316' }} />
                      </div>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, textAlign: 'right' }}>
                        {formatCurrency(paid)} / {formatCurrency(total)} MXN ({pct}%)
                      </p>
                    </div>
                  )}

                  {!isReserved && (
                    <div>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px', textAlign: 'right' }}>
                        {isPending || isAwaitingOxxo ? 'Total' : 'Total pagado'}
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: '#F97316', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                        {formatCurrency(b.totalAmount.toNumber())} MXN
                      </p>
                    </div>
                  )}

                  {isAwaitingOxxo ? (
                    <Link
                      href={`/cuenta/reservaciones/${b.id}`}
                      style={{
                        padding: '7px 14px', borderRadius: 999,
                        background: '#F97316', color: '#fff',
                        fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ver voucher OXXO →
                    </Link>
                  ) : isPending ? (
                    <Link
                      href={`/viajes/${b.trip.slug}#asientos`}
                      style={{
                        padding: '7px 14px', borderRadius: 999,
                        background: '#F97316', color: '#fff',
                        fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Completar pago →
                    </Link>
                  ) : isReserved ? (
                    <Link
                      href={`/cuenta/reservaciones/${b.id}/abonar`}
                      style={{
                        padding: '7px 14px', borderRadius: 999,
                        background: '#F97316', color: '#fff',
                        fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Abonar →
                    </Link>
                  ) : (
                    <Link
                      href={`/cuenta/reservaciones/${b.id}`}
                      style={{
                        padding: '7px 14px', borderRadius: 999,
                        border: '1.5px solid #1E3A8A', color: '#1E3A8A',
                        background: '#fff',
                        fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ver detalle →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
          {/* Prev */}
          {page > 1 ? (
            <Link
              href={`/cuenta/reservaciones?pagina=${page - 1}`}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #E2E8F0', background: '#fff',
                color: '#0F172A', textDecoration: 'none',
                fontSize: 16, lineHeight: 1,
              }}
              aria-label="Página anterior"
            >
              ←
            </Link>
          ) : (
            <span style={{
              width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #F1F5F9', background: '#F8F9FB',
              color: '#CBD5E1', fontSize: 16, lineHeight: 1,
              cursor: 'default',
            }}>
              ←
            </span>
          )}

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
            // Show: first, last, current ±1, and ellipsis in between
            const isEdge   = p === 1 || p === totalPages;
            const isNear   = Math.abs(p - page) <= 1;
            const show     = isEdge || isNear;
            const prevShow = isEdge || Math.abs((p - 1) - page) <= 1 || p - 1 === 1 || p - 1 === totalPages;

            if (!show) {
              // Render ellipsis only once per gap
              return !prevShow ? null : (
                <span key={`ellipsis-${p}`} style={{ color: '#94a3b8', fontSize: 14, padding: '0 2px' }}>…</span>
              );
            }

            const isActive = p === page;
            return (
              <Link
                key={p}
                href={`/cuenta/reservaciones?pagina=${p}`}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? '#0F1F4B' : '#fff',
                  border: isActive ? '1.5px solid #0F1F4B' : '1.5px solid #E2E8F0',
                  color: isActive ? '#fff' : '#0F172A',
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {p}
              </Link>
            );
          })}

          {/* Next */}
          {page < totalPages ? (
            <Link
              href={`/cuenta/reservaciones?pagina=${page + 1}`}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #E2E8F0', background: '#fff',
                color: '#0F172A', textDecoration: 'none',
                fontSize: 16, lineHeight: 1,
              }}
              aria-label="Página siguiente"
            >
              →
            </Link>
          ) : (
            <span style={{
              width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #F1F5F9', background: '#F8F9FB',
              color: '#CBD5E1', fontSize: 16, lineHeight: 1,
              cursor: 'default',
            }}>
              →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
