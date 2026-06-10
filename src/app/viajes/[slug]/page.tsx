import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TripGallery } from '@/components/trips/TripGallery';
import { TripItinerary } from '@/components/trips/TripItinerary';
import { SeatSelector } from '@/components/seat-map/SeatSelector';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTrip(slug: string) {
  return prisma.trip.findUnique({
    where: { slug, status: 'ACTIVE' },
    include: {
      bookings: {
        where: { status: { in: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'RESERVED'] } },
        select: { seatNumbers: true, status: true },
      },
      seatLocks: {
        where: { expiresAt: { gt: new Date() } },
        select: { seatNumbers: true },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await prisma.trip.findUnique({
    where: { slug, status: 'ACTIVE' },
    select: { title: true, description: true, destination: true, coverImage: true },
  });
  if (!trip) return { title: 'Viaje no encontrado' };
  return {
    title: `${trip.title} — AgenciaTours`,
    description: trip.description.slice(0, 155),
    openGraph: { images: trip.coverImage ? [trip.coverImage] : [] },
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) notFound();

  const nights = Math.round(
    (trip.returnDate.getTime() - trip.departureDate.getTime()) / 86400000
  );

  const confirmedSeats = trip.bookings
    .filter(b => b.status === 'CONFIRMED')
    .flatMap(b => b.seatNumbers);

  const reservedSeats = trip.bookings
    .filter(b => b.status === 'RESERVED')
    .flatMap(b => b.seatNumbers);

  const pendingSeats = trip.bookings
    .filter(b => b.status === 'PENDING' || b.status === 'AWAITING_PAYMENT')
    .flatMap(b => b.seatNumbers);

  // Current reserved seat count for the apartado limit
  const currentReservedSeats = reservedSeats.length;

  const lockedSeats = trip.seatLocks.flatMap(l => l.seatNumbers);

  const takenSeats = [...new Set([...confirmedSeats, ...reservedSeats, ...pendingSeats, ...lockedSeats])].length;
  const available  = trip.totalSeats - takenSeats;
  const isLow      = available > 0 && available <= 5;
  const isSoldOut  = available === 0;

  const itinerary = (trip.itinerary as { day: number; title: string; description?: string }[]) ?? [];
  const price     = trip.pricePerSeat.toNumber();

  const availColor = isSoldOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';
  const availLabel = isSoldOut ? 'Agotado' : `${available} asientos`;

  return (
    <>
      <Navbar />
      <main style={{ background: '#F8F9FB', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <div
          className="relative overflow-hidden"
          style={{ minHeight: 380 }}
        >
          {/* Background: image or gradient */}
          {trip.coverImage ? (
            <Image
              src={trip.coverImage}
              alt={trip.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(120deg, #1565C0 0%, #1976D2 35%, #00897B 100%)' }}
            />
          )}
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)' }}
          />

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-6" style={{ paddingTop: 80, paddingBottom: 80 }}>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>Inicio</Link>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>/</span>
              <Link href="/viajes" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>Viajes</Link>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>/</span>
              <span style={{ color: '#FB923C', fontSize: 13, fontWeight: 500 }}>{trip.title}</span>
            </nav>

            {/* Destination badge */}
            <span
              style={{
                display: 'inline-block',
                background: '#F97316',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 14px',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              {trip.destination}
            </span>

            {/* Title */}
            <h1
              style={{
                color: '#fff',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                lineHeight: 1.1,
                margin: '0 0 16px',
                maxWidth: '16ch',
              }}
            >
              {trip.title}
            </h1>

            {/* Location + rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14 }}>{trip.destination}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>★ 4.9</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>312 reseñas</span>
            </div>
          </div>
        </div>

        {/* ── INFO BAR ── */}
        <div className="max-w-7xl mx-auto px-6" style={{ marginTop: -28, position: 'relative', zIndex: 10 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'stretch',
              flexWrap: 'wrap',
              overflow: 'hidden',
            }}
          >
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                ),
                label: 'SALIDA',
                value: formatDate(trip.departureDate),
                valueStyle: { color: '#0F172A', fontWeight: 700, fontSize: 16 },
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                ),
                label: 'REGRESO',
                value: formatDate(trip.returnDate),
                valueStyle: { color: '#0F172A', fontWeight: 700, fontSize: 16 },
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                ),
                label: 'DURACIÓN',
                value: `${nights} días · ${nights - 1} noches`,
                valueStyle: { color: '#0F172A', fontWeight: 700, fontSize: 16 },
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/><path d="M12 6v6l3 3"/>
                  </svg>
                ),
                label: 'POR ASIENTO',
                value: `${formatCurrency(price)} MXN`,
                valueStyle: { color: '#F97316', fontWeight: 800, fontSize: 16 },
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                label: 'DISPONIBLES',
                value: availLabel,
                valueStyle: { color: availColor, fontWeight: 700, fontSize: 16 },
              },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                style={{
                  flex: '1 1 140px',
                  padding: '20px 24px',
                  borderRight: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {stat.icon}
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    {stat.label}
                  </span>
                </div>
                <span style={stat.valueStyle}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT: description + sidebar (2 col) ── */}
        <div
          className="max-w-7xl mx-auto px-6"
          style={{ paddingTop: 48, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}
        >
          {/* ── LEFT: description, gallery, itinerary ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* Description */}
            <section>
              <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px' }}>
                <span style={{ color: 'rgba(249,115,22,0.45)' }}>[</span>
                {' '}01{' '}
                <span style={{ color: 'rgba(249,115,22,0.45)' }}>]</span>
                {' '}Sobre el viaje
              </p>
              <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 800, color: '#0F172A', margin: '0 0 16px', lineHeight: 1.2 }}>
                {trip.title}
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.75, margin: '0 0 20px', fontSize: 15 }}>
                {trip.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginTop: 16 }}>
                {[
                  'Transporte ejecutivo redondo',
                  `${nights - 1} noches de hospedaje`,
                  'Guía certificado incluido',
                  'Seguro de viaje',
                  'Grupos de máx. 40 personas',
                  'Itinerario garantizado',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style={{ fontSize: 13, color: '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery */}
            {trip.gallery.length > 0 && (
              <section>
                <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  <span style={{ color: 'rgba(249,115,22,0.45)' }}>[</span>
                  {' '}02{' '}
                  <span style={{ color: 'rgba(249,115,22,0.45)' }}>]</span>
                  {' '}Galería
                </p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>
                  Fotos del viaje
                </h2>
                <TripGallery images={trip.gallery} title={trip.title} />
              </section>
            )}

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <section>
                <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  <span style={{ color: 'rgba(249,115,22,0.45)' }}>[</span>
                  {' '}{trip.gallery.length > 0 ? '03' : '02'}{' '}
                  <span style={{ color: 'rgba(249,115,22,0.45)' }}>]</span>
                  {' '}Itinerario
                </p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>
                  Día a día
                </h2>
                <TripItinerary itinerary={itinerary} />
              </section>
            )}
          </div>

          {/* ── RIGHT SIDEBAR (sticky, terminates here) ── */}
          <aside style={{ position: 'sticky', top: 100 }}>
            <div style={{
              background: '#fff', borderRadius: 20,
              boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
              padding: '28px 28px 24px', border: '1px solid #F1F5F9',
            }}>
              <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 12px' }}>
                Reservá ahora
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                <strong style={{ fontSize: 40, fontWeight: 900, color: '#F97316', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {formatCurrency(price)}
                </strong>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>MXN / asiento</span>
              </div>
              <div style={{ height: 1, background: '#F1F5F9', margin: '0 0 16px' }} />
              {[
                { label: 'Salida',       value: formatDate(trip.departureDate), style: {} },
                { label: 'Duración',     value: `${nights} días`,               style: {} },
                { label: 'Disponibles',  value: availLabel,                     style: { color: availColor, fontWeight: 600 } },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, ...row.style }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }} />
              <a
                href="#asientos"
                style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  padding: '14px 0', borderRadius: 999,
                  background: '#F97316', color: '#fff',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                }}
              >
                Elegir mi asiento →
              </a>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '10px 0 0' }}>
                Tus asientos quedan reservados por 15 min
              </p>
            </div>
          </aside>
        </div>

        {/* ── SEAT SELECTOR: full width, outside the 2-col grid ── */}
        <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: 48, paddingBottom: 80 }}>
          <section id="asientos">
            {/* Centered header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px' }}>
                <span style={{ color: 'rgba(249,115,22,0.45)' }}>[</span>
                {' '}{itinerary.length > 0 ? (trip.gallery.length > 0 ? '04' : '03') : (trip.gallery.length > 0 ? '03' : '02')}{' '}
                <span style={{ color: 'rgba(249,115,22,0.45)' }}>]</span>
                {' '}Selección de asientos
              </p>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.15 }}>
                Seleccioná tu asiento.
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
                Tocá un asiento libre para reservarlo. Podés elegir hasta 6 lugares.
              </p>
            </div>
            <SeatSelector
              tripId={trip.id}
              totalSeats={trip.totalSeats}
              busType={trip.busType}
              bathroomPosition={trip.bathroomPosition}
              pricePerSeat={price}
              confirmedSeats={confirmedSeats}
              reservedSeats={reservedSeats}
              pendingSeats={pendingSeats}
              lockedSeats={lockedSeats}
              minimumDeposit={trip.minimumDeposit ? trip.minimumDeposit.toNumber() : null}
              maxReservedPercent={trip.maxReservedPercent}
              currentReservedSeats={currentReservedSeats}
            />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
