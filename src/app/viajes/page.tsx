import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TripCard } from '@/components/trips/TripCard';
import { CatalogFilters } from '@/components/trips/CatalogFilters';
import { CategoryPills } from '@/components/trips/CategoryPills';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase/server';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';


interface SearchParams {
  destino?: string;
  orden?: string;
  categoria?: string;
  precioMax?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function TripGrid({ destino, orden, precioMax, categoria }: SearchParams) {
  const maxPrice = precioMax ? parseFloat(precioMax) : undefined;

  const [trips, supabase] = await Promise.all([
    prisma.trip.findMany({
      where: {
        status: 'ACTIVE',
        ...(destino   ? { destination: destino } : {}),
        ...(maxPrice  ? { pricePerSeat: { lte: maxPrice } } : {}),
        ...(categoria && categoria !== 'Todos' ? { category: categoria } : {}),
      },
      include: {
        bookings: {
          where: { status: { in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'] } },
          select: { seatNumbers: true },
        },
      },
      orderBy:
        orden === 'precio-asc'  ? { pricePerSeat: 'asc' }
        : orden === 'precio-desc' ? { pricePerSeat: 'desc' }
        : { departureDate: 'asc' },
    }),
    createServerClient(),
  ]);

  // Fetch user's favorites (empty set if not logged in)
  const { data: { user } } = await supabase.auth.getUser();
  let favoriteIds = new Set<string>();
  if (user) {
    const favs = await prisma.favorite.findMany({
      where: { profileId: user.id },
      select: { tripId: true },
    });
    favoriteIds = new Set(favs.map(f => f.tripId));
  }

  if (!trips.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
        <p className="text-lg font-semibold text-gray-800">No hay viajes disponibles</p>
        <p className="text-gray-400">Intenta con otro filtro o vuelve pronto.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {trips.map(trip => {
        const taken = trip.bookings.reduce((sum, b) => sum + b.seatNumbers.length, 0);
        return (
          <TripCard
            key={trip.id}
            tripId={trip.id}
            isFavorited={favoriteIds.has(trip.id)}
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
  );
}

async function DestinationList() {
  const rows = await prisma.trip.findMany({
    where: { status: 'ACTIVE' },
    select: { destination: true },
    distinct: ['destination'],
    orderBy: { destination: 'asc' },
  });
  return rows.map(r => r.destination);
}

async function CategoryList() {
  const rows = await prisma.trip.findMany({
    where: { status: 'ACTIVE', category: { not: null } },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map(r => r.category as string);
}

async function TripCount({ destino, precioMax, categoria }: SearchParams) {
  const maxPrice = precioMax ? parseFloat(precioMax) : undefined;
  const count = await prisma.trip.count({
    where: {
      status: 'ACTIVE',
      ...(destino   ? { destination: destino } : {}),
      ...(maxPrice  ? { pricePerSeat: { lte: maxPrice } } : {}),
      ...(categoria && categoria !== 'Todos' ? { category: categoria } : {}),
    },
  });
  return (
    <p className="text-sm text-gray-500 m-0">
      <strong className="text-gray-800">{count}</strong>{' '}
      {count === 1 ? 'viaje encontrado' : 'viajes encontrados'}
    </p>
  );
}

export default async function ViajesPage({ searchParams }: PageProps) {
  const params    = await searchParams;
  const destino   = params.destino   ?? '';
  const orden     = params.orden     ?? 'fecha';
  const categoria = params.categoria ?? 'Todos';
  const precioMax = params.precioMax ?? '';
  const [destinations, categories] = await Promise.all([DestinationList(), CategoryList()]);

  return (
    <>
      <RealtimeRefresh
        channelName="catalogo-viajes"
        tables={[{ table: 'trips' }]}
      />
      <Navbar />
      <main>
        {/* ── Dark header ── */}
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #0F1F4B 0%, #0f2357 70%, #162050 100%)' }}
        >
          {/* Background decorative icons */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {/* Plane large — top right */}
            <svg className="absolute" style={{ top: '14%', right: '6%', opacity: .07, transform: 'rotate(-20deg)' }} width="180" height="180" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z"/>
            </svg>
            {/* Compass — center right */}
            <svg className="absolute" style={{ top: '55%', right: '18%', opacity: .05, transform: 'rotate(15deg)' }} width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="12,2 14.5,9.5 12,12 9.5,9.5" fill="white" stroke="none"/>
              <polygon points="12,22 9.5,14.5 12,12 14.5,14.5" fill="rgba(255,255,255,0.4)" stroke="none"/>
              <line x1="12" y1="2" x2="12" y2="4" stroke="white" strokeWidth="1.5"/>
              <line x1="12" y1="20" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
              <line x1="2" y1="12" x2="4" y2="12" stroke="white" strokeWidth="1.5"/>
              <line x1="20" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5"/>
            </svg>
            {/* Map pin — left side */}
            <svg className="absolute" style={{ top: '20%', left: '42%', opacity: .05, transform: 'rotate(-8deg)' }} width="100" height="100" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
            </svg>
            {/* Small plane — bottom left */}
            <svg className="absolute" style={{ bottom: '15%', left: '8%', opacity: .06, transform: 'rotate(30deg)' }} width="90" height="90" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z"/>
            </svg>
            {/* Luggage — far right bottom */}
            <svg className="absolute" style={{ bottom: '8%', right: '4%', opacity: .05 }} width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2">
              <rect x="6" y="8" width="12" height="13" rx="2"/>
              <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
              <line x1="12" y1="12" x2="12" y2="17"/>
              <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
            </svg>
            {/* Globe — top left area */}
            <svg className="absolute" style={{ top: '8%', left: '55%', opacity: .04, transform: 'rotate(-5deg)' }} width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8">
              <circle cx="12" cy="12" r="10"/>
              <ellipse cx="12" cy="12" rx="4" ry="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="8" x2="22" y2="8"/>
              <line x1="2" y1="16" x2="22" y2="16"/>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-14 pb-16">
            {/* Eyebrow */}
            <p className="font-mono text-xs uppercase tracking-widest m-0" style={{ color: '#fb923c' }}>
              <span style={{ color: 'rgba(251,146,60,.45)' }}>[</span>
              {' '}38 destinos · Salidas todo el año{' '}
              <span style={{ color: 'rgba(251,146,60,.45)' }}>]</span>
            </p>

            {/* Title */}
            <h1 className="text-white font-bold mt-3 mb-0" style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)', lineHeight: 1.1 }}>
              Viajes disponibles.
            </h1>

            {/* Subtitle */}
            <p className="mt-3 mb-0 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,.72)' }}>
              Elegí entre playas, ciudades coloniales, cascadas y pueblos mágicos.<br />
              Todos con asiento garantizado y guía incluido.
            </p>
          </div>
        </div>

        {/* Filter panel — fuera del header, -mt sube encima del borde oscuro */}
        <div className="relative z-10 -mt-[46px] max-w-7xl mx-auto px-6">
          <Suspense>
            <CatalogFilters
              destinations={destinations}
              currentDestination={destino}
              currentOrder={orden}
              currentPrecioMax={precioMax}
            />
          </Suspense>
        </div>

        {/* ── Results ── */}
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-24">
          {/* Count + pills */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <Suspense fallback={<p className="text-sm text-gray-400">Cargando…</p>}>
              <TripCount destino={destino} precioMax={precioMax} categoria={categoria} />
            </Suspense>
            <Suspense>
              <CategoryPills categories={['Todos', ...categories]} current={categoria} />
            </Suspense>
          </div>

          <Suspense fallback={<TripGridSkeleton />}>
            <TripGrid destino={destino} orden={orden} precioMax={precioMax} categoria={categoria} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

function TripGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
          <div className="bg-gray-200" style={{ aspectRatio: '3/2' }} />
          <div className="p-5 flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
