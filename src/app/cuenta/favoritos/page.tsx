import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import { TripCard } from '@/components/trips/TripCard';

export default async function FavoritosPage() {
  const user = await getAuthenticatedUser();

  const favorites = await prisma.favorite.findMany({
    where: { profileId: user.id },
    include: {
      trip: {
        include: {
          bookings: {
            where: { status: { in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'] } },
            select: { seatNumbers: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!favorites.length) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 16, padding: '60px 0', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#FFF1F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Aún no tenés viajes guardados
        </p>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Tocá el corazón en cualquier viaje para guardarlo aquí.
        </p>
        <Link
          href="/viajes"
          style={{
            marginTop: 8, padding: '12px 28px', borderRadius: 999,
            background: '#F97316', color: '#fff',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}
        >
          Explorar viajes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        <strong style={{ color: '#0F172A' }}>{favorites.length}</strong>{' '}
        {favorites.length === 1 ? 'viaje guardado' : 'viajes guardados'}
      </p>

      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {favorites.map(({ trip }) => {
          const taken = trip.bookings.reduce((sum, b) => sum + b.seatNumbers.length, 0);
          return (
            <TripCard
              key={trip.id}
              tripId={trip.id}
              isFavorited={true}
              slug={trip.slug}
              title={trip.title}
              destination={trip.destination}
              coverImage={trip.coverImage}
              departureDate={trip.departureDate}
              returnDate={trip.returnDate}
              pricePerSeat={trip.pricePerSeat.toNumber()}
              totalSeats={trip.totalSeats}
              takenSeats={taken}
            />
          );
        })}
      </div>
    </div>
  );
}
