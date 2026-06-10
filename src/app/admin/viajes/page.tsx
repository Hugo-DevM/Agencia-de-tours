import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import DeleteTripButton from '@/components/admin/DeleteTripButton';

export const metadata = { title: 'Viajes' };

const PER_PAGE = 8;

interface PageProps {
  searchParams: Promise<{ pagina?: string }>;
}

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <span className="badge badge-green"><span className="dot" />Activo</span>;
    case 'DRAFT': return <span className="badge badge-gray">Borrador</span>;
    case 'CANCELLED': return <span className="badge badge-red">Cancelado</span>;
    default: return <span className="badge badge-gray">{status}</span>;
  }
}

export default async function AdminTripsPage({ searchParams }: PageProps) {
  const { pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? '1', 10) || 1);
  const skip = (page - 1) * PER_PAGE;

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      orderBy: { departureDate: 'desc' },
      skip,
      take: PER_PAGE,
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: ['CONFIRMED', 'AWAITING_PAYMENT'] } } },
          },
        },
      },
    }),
    prisma.trip.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Administración</div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            Viajes
          </h1>
        </div>
        <Link href="/admin/viajes/nuevo" className="btn btn-primary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nuevo viaje
        </Link>
      </div>

      <div className="admin-content">
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h4 className="h4">Todos los viajes</h4>
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)' }}>
              {total} total · pág. {page}/{Math.max(1, totalPages)}
            </span>
          </div>

          {trips.length === 0 && page === 1 ? (
            <div style={{ padding: 'var(--s-16)', textAlign: 'center' }}>
              <div style={{ marginBottom: 'var(--s-4)', color: 'var(--ink-faint)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="m9 20-6-3V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7"/>
                </svg>
              </div>
              <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--s-4)' }}>No hay viajes todavía.</p>
              <Link href="/admin/viajes/nuevo" className="btn btn-primary btn-sm">
                Crear primer viaje
              </Link>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Viaje</th>
                    <th>Fechas</th>
                    <th>Precio</th>
                    <th>Asientos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => {
                    const confirmedSeats = trip._count.bookings;
                    return (
                      <tr key={trip.id}>
                        <td>
                          <div style={{ fontWeight: 'var(--w-semibold)' }}>{trip.title}</div>
                          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-faint)' }}>{trip.destination}</div>
                        </td>
                        <td style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-muted)' }}>
                          <div>{formatDate(trip.departureDate)}</div>
                          <div style={{ color: 'var(--ink-faint)' }}>{formatDate(trip.returnDate)}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--orange-600)' }}>
                          {formatCurrency(Number(trip.pricePerSeat))}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)' }}>
                          {confirmedSeats}/{trip.totalSeats}
                        </td>
                        <td>{statusBadge(trip.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Link
                              href={`/admin/viajes/${trip.id}/asientos`}
                              className="btn-icon"
                              title="Ver asientos"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4H5v-4Z"/>
                                <path d="M3 17h18M7 17v2M17 17v2"/>
                              </svg>
                            </Link>
                            <Link
                              href={`/admin/viajes/${trip.id}`}
                              className="btn-icon"
                              title="Editar"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </Link>
                            <DeleteTripButton tripId={trip.id} tripTitle={trip.title} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: 'var(--s-3) var(--s-5)',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              {page > 1 ? (
                <Link href={`/admin/viajes?pagina=${page - 1}`} className="admin-page-btn" aria-label="Anterior">←</Link>
              ) : (
                <span className="admin-page-btn" style={{ opacity: 0.3, cursor: 'default', pointerEvents: 'none' }}>←</span>
              )}

              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  const isEdge = p === 1 || p === totalPages;
                  const isNear = Math.abs(p - page) <= 1;
                  if (!isEdge && !isNear) {
                    const prevIsEdge = p - 1 === 1 || p - 1 === totalPages;
                    const prevIsNear = Math.abs((p - 1) - page) <= 1;
                    if (prevIsEdge || prevIsNear) {
                      return <span key={`e${p}`} style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-faint)', fontSize: 13, padding: '0 2px' }}>…</span>;
                    }
                    return null;
                  }
                  return (
                    <Link
                      key={p}
                      href={`/admin/viajes?pagina=${p}`}
                      className={`admin-page-btn${p === page ? ' active' : ''}`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>

              {page < totalPages ? (
                <Link href={`/admin/viajes?pagina=${page + 1}`} className="admin-page-btn" aria-label="Siguiente">→</Link>
              ) : (
                <span className="admin-page-btn" style={{ opacity: 0.3, cursor: 'default', pointerEvents: 'none' }}>→</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
