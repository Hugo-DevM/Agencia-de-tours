import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReservacionesFilters } from '@/components/admin/ReservacionesFilters';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';

interface SearchParams {
  estado?: string;
  viaje?: string;
  q?: string;
  pagina?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
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

const PAGE_SIZE = 10;

async function BookingsTable({ estado, viaje, q, pagina }: SearchParams) {
  const page = Math.max(1, parseInt(pagina ?? '1'));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    // Hide abandoned checkouts: CANCELLED bookings that never had a payment
    NOT: { status: 'CANCELLED' as never, amountPaid: 0 },
    ...(estado ? { status: estado as never } : {}),
    ...(viaje  ? { tripId: viaje } : {}),
    ...(q      ? {
      OR: [
        { profile: { fullName: { contains: q, mode: 'insensitive' as never } } },
        { profile: { email:    { contains: q, mode: 'insensitive' as never } } },
      ],
    } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        trip:    { select: { id: true, title: true, departureDate: true } },
        profile: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  if (!bookings.length) {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: 'var(--s-16)' }}>
        <p style={{ color: 'var(--ink-faint)' }}>No se encontraron reservaciones con esos filtros.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)' }}>
        {total} reservación{total !== 1 ? 'es' : ''} encontrada{total !== 1 ? 's' : ''}
      </p>

      <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Viaje</th>
                <th>Asientos</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 'var(--w-medium)', fontSize: 'var(--fs-14)' }}>
                      {b.profile.fullName ?? '—'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-faint)' }}>
                      {b.profile.email}
                    </div>
                  </td>
                  <td style={{ maxWidth: 180 }}>
                    <div style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--w-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.trip.title}
                    </div>
                    <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)' }}>
                      {formatDate(b.trip.departureDate)}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)' }}>
                    {b.seatNumbers.join(', ')}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--orange-600)', fontWeight: 'var(--w-semibold)' }}>
                    {formatCurrency(b.totalAmount.toNumber())}
                  </td>
                  <td style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-muted)' }}>
                    {b.paymentMethod === 'CARD' ? 'Tarjeta' : b.paymentMethod === 'OXXO' ? 'OXXO' : b.paymentMethod === 'CASH' ? 'Efectivo' : '—'}
                  </td>
                  <td>
                    <span className={STATUS_BADGE[b.status] ?? 'badge badge-gray'}>
                      <span className="dot" />
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-subtle)' }}>
                    {formatDate(b.createdAt)}
                  </td>
                  <td>
                    <Link
                      href={`/admin/reservaciones/${b.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="admin-pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`?${new URLSearchParams({ ...(estado ? { estado } : {}), ...(viaje ? { viaje } : {}), ...(q ? { q } : {}), pagina: String(p) }).toString()}`}
              className={`admin-page-btn ${p === page ? 'active' : ''}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AdminReservacionesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Trips for filter dropdown
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true },
    orderBy: { departureDate: 'desc' },
  });

  return (
    <>
      <RealtimeRefresh
        channelName="admin-reservaciones"
        tables={[{ table: 'bookings' }, { table: 'payments' }]}
      />

      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Administración</div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            Reservaciones
          </h1>
        </div>
      </div>

      <div className="admin-content">
        <Suspense>
          <ReservacionesFilters
            trips={trips}
            currentEstado={params.estado ?? ''}
            currentViaje={params.viaje ?? ''}
            currentQ={params.q ?? ''}
          />
        </Suspense>

        <Suspense fallback={<div className="form-card" style={{ height: 200 }} />}>
          <BookingsTable
            estado={params.estado}
            viaje={params.viaje}
            q={params.q}
            pagina={params.pagina}
          />
        </Suspense>
      </div>
    </>
  );
}
