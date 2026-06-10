import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

export const metadata = { title: 'Dashboard' };

const PER_PAGE = 8;

interface PageProps {
  searchParams: Promise<{ pagina?: string }>;
}

function badgeClass(status: string) {
  switch (status) {
    case 'CONFIRMED':        return 'badge badge-green';
    case 'AWAITING_PAYMENT': return 'badge badge-yellow';
    case 'PENDING':          return 'badge badge-blue';
    case 'CANCELLED':        return 'badge badge-red';
    default:                 return 'badge badge-gray';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'CONFIRMED':        return 'Confirmada';
    case 'AWAITING_PAYMENT': return 'Pago pend.';
    case 'PENDING':          return 'Pendiente';
    case 'CANCELLED':        return 'Cancelada';
    default:                 return status;
  }
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? '1', 10) || 1);
  const skip = (page - 1) * PER_PAGE;

  const user = await getAuthenticatedUser();
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const bookingWhere = {
    status: { in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'] as never[] },
    NOT: { status: 'CANCELLED' as never, amountPaid: 0 },
  };

  const [
    totalBookings, revenueAgg, activeTripsCount,
    upcomingTrips, recentBookings, totalRecentCount, activeTripsForSeats,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'AWAITING_PAYMENT'] } } }),
    prisma.booking.aggregate({
      where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.trip.count({ where: { status: 'ACTIVE' } }),
    prisma.trip.findMany({
      where: { status: 'ACTIVE', departureDate: { gte: new Date() } },
      orderBy: { departureDate: 'asc' },
      take: 5,
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: ['CONFIRMED', 'AWAITING_PAYMENT'] } } },
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        trip:    { select: { title: true } },
        profile: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PER_PAGE,
    }),
    prisma.booking.count({ where: bookingWhere }),
    prisma.trip.findMany({
      where: { status: 'ACTIVE', departureDate: { gte: new Date() } },
      select: {
        totalSeats: true,
        _count: {
          select: {
            bookings: { where: { status: { in: ['CONFIRMED', 'AWAITING_PAYMENT'] } } },
          },
        },
      },
    }),
  ]);

  const revenue        = Number(revenueAgg._sum.totalAmount ?? 0);
  const availableSeats = activeTripsForSeats.reduce((sum, t) => sum + (t.totalSeats - t._count.bookings), 0);
  const totalPages     = Math.ceil(totalRecentCount / PER_PAGE);
  const greeting       = profile?.fullName ? profile.fullName.split(' ')[0] : 'Admin';

  return (
    <>
      <RealtimeRefresh
        channelName="admin-dashboard"
        tables={[
          { table: 'bookings' },
          { table: 'payments' },
        ]}
      />

      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Panel de control</div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            Buenos días, {greeting}.
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
        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 'var(--s-6)' }}>
          <div className="stat">
            <div className="stat-icon" style={{ background: 'var(--blue-50)', color: 'var(--blue-700)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 1 2-2 2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
                <path d="M7 17v2M17 17v2"/>
              </svg>
            </div>
            <div className="stat-num">{totalBookings}</div>
            <div className="stat-label">Reservas activas</div>
          </div>

          <div className="stat">
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-num" style={{ fontSize: 'var(--fs-26)' }}>{formatCurrency(revenue)}</div>
            <div className="stat-label">Ingresos este mes</div>
          </div>

          <div className="stat">
            <div className="stat-icon" style={{ background: 'var(--orange-100)', color: 'var(--orange-600)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 20-6-3V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <div className="stat-num">{activeTripsCount}</div>
            <div className="stat-label">Viajes activos</div>
          </div>

          <div className="stat">
            <div className="stat-icon" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-num">{availableSeats}</div>
            <div className="stat-label">Asientos disponibles</div>
          </div>
        </div>

        {/* Two-column */}
        <div className="twocol">
          {/* Recent bookings */}
          <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h4 className="h4">Reservas recientes</h4>
              <span style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)' }}>
                {totalRecentCount} total · pág. {page}/{totalPages}
              </span>
            </div>

            {/* Table */}
            <div className="tbl-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Viaje</th>
                    <th>Asientos</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: 'var(--s-8)' }}>
                        Sin reservas aún
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 'var(--w-medium)' }}>
                            {b.profile.fullName ?? b.profile.email}
                          </div>
                          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-faint)' }}>
                            {b.profile.fullName ? b.profile.email : formatDate(b.createdAt)}
                          </div>
                        </td>
                        <td style={{ maxWidth: 140 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.trip.title}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)' }}>
                          {b.seatNumbers.join(', ')}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)' }}>
                          {formatCurrency(Number(b.totalAmount))}
                        </td>
                        <td>
                          <span className={badgeClass(b.status)}>
                            {statusLabel(b.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div style={{
                padding: 'var(--s-3) var(--s-5)',
                borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                {/* Prev */}
                {page > 1 ? (
                  <Link href={`/admin?pagina=${page - 1}`} className="admin-page-btn" aria-label="Anterior">←</Link>
                ) : (
                  <span className="admin-page-btn" style={{ opacity: 0.3, cursor: 'default', pointerEvents: 'none' }}>←</span>
                )}

                {/* Page numbers */}
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
                        href={`/admin?pagina=${p}`}
                        className={`admin-page-btn${p === page ? ' active' : ''}`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {/* Next */}
                {page < totalPages ? (
                  <Link href={`/admin?pagina=${page + 1}`} className="admin-page-btn" aria-label="Siguiente">→</Link>
                ) : (
                  <span className="admin-page-btn" style={{ opacity: 0.3, cursor: 'default', pointerEvents: 'none' }}>→</span>
                )}
              </div>
            )}
          </div>

          {/* Upcoming trips */}
          <div className="form-card" style={{ alignSelf: 'start' }}>
            <h4 className="h4" style={{ marginBottom: 'var(--s-4)' }}>Próximos viajes</h4>
            {upcomingTrips.length === 0 ? (
              <p style={{ color: 'var(--ink-faint)', fontSize: 'var(--fs-14)', textAlign: 'center', padding: 'var(--s-8) 0' }}>
                Sin viajes próximos
              </p>
            ) : (
              upcomingTrips.map((trip) => {
                const confirmedSeats = trip._count.bookings;
                const pct = Math.round((confirmedSeats / trip.totalSeats) * 100);
                return (
                  <div key={trip.id} className="up-trip">
                    {/* Top row: thumb + info + count */}
                    <div className="up-trip-top">
                      <div className="up-thumb" style={{ background: 'var(--blue-100)' }}>
                        {trip.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={trip.coverImage} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 20-6-3V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="up-trip-info">
                        <div style={{ fontWeight: 'var(--w-semibold)', fontSize: 'var(--fs-13)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trip.title}
                        </div>
                        <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', marginTop: 2 }}>
                          {formatDate(trip.departureDate)}
                        </div>
                      </div>
                      <span className="up-trip-count">{confirmedSeats}/{trip.totalSeats}</span>
                    </div>
                    {/* Full-width progress bar */}
                    <div className="occ-bar">
                      <div className="occ-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
