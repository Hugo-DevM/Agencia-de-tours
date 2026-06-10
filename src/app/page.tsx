import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/home/ScrollReveal';

/* ── Icons ────────────────────────────────────────────────── */
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

/* ── Featured trips data ──────────────────────────────────── */
const featuredTrips = [
  {
    id: 1,
    dest: 'Quintana Roo',
    bg: 'linear-gradient(160deg,#38BDF8 0%,#0EA5E9 38%,#FCD34D 100%)',
    loc: 'Tulum & Bacalar',
    title: 'Tulum Esencial + Laguna de Bacalar',
    dates: '15 – 18 Jul 2025 · 4 días',
    price: '$3,499',
    seats: 12,
    seatsLow: false,
  },
  {
    id: 2,
    dest: 'Guanajuato',
    bg: 'linear-gradient(160deg,#FBBF24 0%,#F97316 50%,#BE123C 100%)',
    loc: 'Guanajuato Capital',
    title: 'Guanajuato Colonial & San Miguel',
    dates: '22 – 24 Ago 2025 · 3 días',
    price: '$2,890',
    seats: 5,
    seatsLow: true,
  },
  {
    id: 3,
    dest: 'San Luis Potosí',
    bg: 'linear-gradient(160deg,#34D399 0%,#059669 50%,#064E3B 100%)',
    loc: 'Cascadas y ríos',
    title: 'Huasteca Potosina Extrema',
    dates: '5 – 9 Sep 2025 · 5 días',
    price: '$4,250',
    seats: 18,
    seatsLow: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ===== HERO ===== */}
      <section
        className="relative min-h-[90vh] flex items-end overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#FB923C 0%,#F43F5E 55%,#7C3AED 100%)' }}
      >
        {/* dot texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.45) 1px,transparent 1.4px)', backgroundSize: '22px 22px', opacity: .4, mixBlendMode: 'overlay' }}
        />
        {/* dark gradient at bottom */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg,rgba(15,31,75,.30) 0%,rgba(15,31,75,.05) 30%,rgba(15,31,75,.55) 78%,rgba(15,31,75,.86) 100%)' }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:pb-20 lg:pb-24">
          {/* eyebrow */}
          <p className="font-mono text-xs uppercase tracking-widest text-white/80 m-0">
            <span style={{ color: 'rgba(251,146,60,.7)' }}>[</span>
            {' '}Viajes en grupo por México{' '}
            <span style={{ color: 'rgba(251,146,60,.7)' }}>]</span>
          </p>

          <h1 className="text-white font-extrabold mt-4 mb-0" style={{ fontSize: 'clamp(2.4rem,6vw,4rem)', lineHeight: 1.08, maxWidth: '16ch' }}>
            Tu próxima aventura está a{' '}
            <span style={{ color: '#FB923C' }}>un clic</span>.
          </h1>

          <p className="mt-5 mb-0 text-white/90 leading-relaxed max-w-2xl" style={{ fontSize: 'clamp(1rem,2vw,1.125rem)' }}>
            Reservá tu lugar en escapadas guiadas por las mejores rutas de México. Elegís el destino, elegís tu asiento, y listo — sin filas, sin llamadas, sin complicaciones.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/viajes"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white no-underline transition-all duration-200 hover:opacity-90"
              style={{ background: '#F97316', boxShadow: '0 4px 20px rgba(249,115,22,.45)' }}
            >
              Ver viajes disponibles →
            </Link>
            <a
              href="#como"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white no-underline border border-white/30 hover:bg-white/10 transition-colors duration-200"
            >
              ¿Cómo funciona?
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-10 mt-10">
            {[
              { n: '120+', l: 'Salidas al año' },
              { n: '38',   l: 'Destinos en México' },
              { n: '4.9★', l: '2,400+ reseñas' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-white font-bold leading-none" style={{ fontSize: 'clamp(1.6rem,3vw,2rem)' }}>{s.n}</div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-white/70 mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED TRIPS ===== */}
      <section className="py-20 px-6" id="viajes" style={{ background: '#F8F9FB' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header row */}
          <div className="flex items-end justify-between flex-wrap gap-5 mb-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest m-0" style={{ color: '#F97316' }}>
                <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span>
                {' '}01{' '}
                <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
                {' '}Viajes disponibles
              </p>
              <h2 className="font-extrabold mt-3.5 mb-0" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0F172A' }}>
                Próximas salidas con lugares libres.
              </h2>
            </div>
            <Link
              href="/viajes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 no-underline hover:border-gray-500 transition-colors duration-150"
            >
              Ver todos los viajes →
            </Link>
          </div>

          {/* Cards grid */}
          <ScrollReveal className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {featuredTrips.map(trip => (
              <article
                key={trip.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image area */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', background: trip.bg }}>
                  {/* dot texture */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px,transparent 1.4px)', backgroundSize: '16px 16px', opacity: .5, mixBlendMode: 'overlay' }}
                  />
                  {/* bottom gradient */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg,transparent 40%,rgba(15,31,75,.55) 100%)' }} />

                  {/* destination badge */}
                  <span
                    className="absolute top-3 left-3 text-white font-bold uppercase z-10"
                    style={{ background: '#F97316', fontSize: 10, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999 }}
                  >
                    {trip.dest}
                  </span>

                  {/* heart button */}
                  <button
                    type="button"
                    className="absolute top-3 right-3 z-10 flex items-center justify-center cursor-pointer border-none"
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,.15)', color: '#64748b' }}
                    aria-label="Guardar viaje"
                  >
                    <HeartIcon />
                  </button>

                  {/* location */}
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-white" style={{ fontSize: 12 }}>
                    <MapPinIcon />
                    {trip.loc}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-4 gap-2.5">
                  <h3 className="font-bold m-0 leading-snug" style={{ fontSize: 15, color: '#0F172A' }}>
                    {trip.title}
                  </h3>
                  <p className="flex items-center gap-1.5 m-0" style={{ fontSize: 12, color: '#94a3b8' }}>
                    <CalendarIcon />
                    {trip.dates}
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>desde</span>
                    <strong style={{ fontSize: 24, fontWeight: 800, color: '#F97316', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {trip.price}
                    </strong>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>MXN</span>
                  </div>
                  <p
                    className="flex items-center gap-1.5 m-0"
                    style={{ fontSize: 12, fontWeight: 500, color: trip.seatsLow ? '#f59e0b' : '#10b981' }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                    {trip.seats} asientos disponibles
                  </p>
                  <Link
                    href="/viajes"
                    className="mt-auto block w-full text-center text-white font-bold no-underline transition-opacity duration-150 hover:opacity-90"
                    style={{ padding: '11px 0', borderRadius: 999, background: '#0F1F4B', fontSize: 13 }}
                  >
                    Ver detalles →
                  </Link>
                </div>
              </article>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6 border-t border-b border-gray-100" id="como" style={{ background: '#F1F5F9' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-widest m-0" style={{ color: '#F97316' }}>
            <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span>
            {' '}02{' '}
            <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
            {' '}Cómo funciona
          </p>
          <h2 className="font-extrabold mt-3.5 mb-0" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0F172A' }}>
            Reservá en tres pasos. Sin vueltas.
          </h2>

          <ScrollReveal className="grid grid-cols-3 gap-6 max-md:grid-cols-1 mt-12 text-left">
            {[
              {
                n: '01',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>,
                title: 'Elegí tu destino',
                body: 'Explorá las salidas disponibles, fechas y precios. Filtrá por destino y elegí la que va con tu plan.',
              },
              {
                n: '02',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18v-6a3 3 0 0 1 3-3h4v9M4 18h16M11 9h6a3 3 0 0 1 3 3v6M7 21v-3M17 21v-3"/></svg>,
                title: 'Seleccioná tu asiento',
                body: 'Mirá el mapa del autobús en tiempo real y elegí exactamente dónde querés sentarte. Ventana o pasillo, vos decidís.',
              },
              {
                n: '03',
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
                title: 'Pagá y listo',
                body: 'Pagás con tarjeta u OXXO de forma segura y recibís tu confirmación con código QR al instante. Nos vemos en la ruta.',
              },
            ].map(step => (
              <div key={step.n} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <span className="absolute top-6 right-6 font-mono text-xs font-semibold" style={{ color: '#F97316' }}>{step.n}</span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#EFF6FF', color: '#1E3A8A' }}>
                  {step.icon}
                </div>
                <h4 className="font-bold mb-2" style={{ fontSize: 17, color: '#0F172A' }}>{step.title}</h4>
                <p className="m-0 leading-relaxed" style={{ fontSize: 14, color: '#64748b' }}>{step.body}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-6" id="testimonios" style={{ background: '#F8F9FB' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-widest m-0" style={{ color: '#F97316' }}>
              <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span>
              {' '}03{' '}
              <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
              {' '}Lo que dicen los viajeros
            </p>
            <h2 className="font-extrabold mt-3.5 mb-0" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0F172A' }}>
              2,400 reseñas. 4.9 de promedio.
            </h2>
          </div>

          <ScrollReveal className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
            {[
              { stars: '★★★★★', q: '&ldquo;Elegir mi asiento desde el celular fue lo mejor. Llegué, subí al camión y ya tenía mi lugar junto a la ventana. Todo clarísimo.&rdquo;', initials: 'MR', color: '#1E3A8A', name: 'Mariana Reyes', trip: 'Tulum · Julio 2024' },
              { stars: '★★★★★', q: '&ldquo;Reservé para toda mi familia en cinco minutos. El mapa de asientos nos dejó sentarnos todos juntos. Repetiremos sin dudarlo.&rdquo;', initials: 'JC', color: '#F97316', name: 'Jorge Camacho', trip: 'Guanajuato · Marzo 2025' },
              { stars: '★★★★★', q: '&ldquo;Pagué con OXXO porque no tengo tarjeta y funcionó perfecto. La confirmación con QR me la pidieron al abordar. Súper organizado.&rdquo;', initials: 'AL', color: '#0F766E', name: 'Ana Lucía Torres', trip: 'Huasteca · Enero 2025' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
                <div style={{ color: '#F97316', letterSpacing: 2 }}>{t.stars}</div>
                <p className="m-0 leading-relaxed flex-1" style={{ fontSize: 15, color: '#334155' }} dangerouslySetInnerHTML={{ __html: t.q }} />
                <div className="flex items-center gap-3 mt-auto">
                  <span
                    className="flex items-center justify-center rounded-full text-white font-semibold shrink-0"
                    style={{ width: 44, height: 44, background: t.color, fontSize: 15 }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 15, color: '#0F172A' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{t.trip}</div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ===== CTA STRIP ===== */}
      <section className="py-12 px-6" style={{ background: '#F8F9FB' }}>
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-3xl px-10 py-14 overflow-hidden"
            style={{ background: '#0F1F4B' }}
          >
            {/* dot texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1.4px)', backgroundSize: '20px 20px', opacity: .5 }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-7">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest m-0" style={{ color: 'rgba(251,146,60,.8)' }}>
                  [ Próxima salida en 6 días ]
                </p>
                <h2 className="font-extrabold mt-3.5 mb-0 text-white" style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', maxWidth: '18ch' }}>
                  ¿Listo para tu próxima escapada?
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/viajes"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white no-underline hover:opacity-90 transition-opacity"
                  style={{ background: '#F97316', boxShadow: '0 4px 20px rgba(249,115,22,.4)' }}
                >
                  Ver viajes disponibles →
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white no-underline border border-white/30 hover:bg-white/10 transition-colors"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
