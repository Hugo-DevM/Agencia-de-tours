import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SearchParams { trip?: string; seats?: string; lock?: string; mode?: string; }
interface PageProps    { searchParams: Promise<SearchParams>; }

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { trip: tripId, seats: seatsParam, lock: lockId, mode: modeParam } = params;
  const mode = modeParam === 'deposit' ? 'deposit' : 'full';

  if (!tripId || !seatsParam || !lockId) redirect('/viajes');

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout?trip=${tripId}&seats=${seatsParam}&lock=${lockId}`);

  const seatNumbers = seatsParam.split(',').map(Number).filter(Boolean);
  if (!seatNumbers.length) redirect('/viajes');

  // Verify lock exists and get its expiry
  const seatLock = await prisma.seatLock.findUnique({
    where: { id: lockId },
    select: { expiresAt: true },
  });
  if (!seatLock || seatLock.expiresAt < new Date()) redirect('/viajes');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId, status: 'ACTIVE' },
    select: {
      id: true, title: true, destination: true, slug: true,
      departureDate: true, returnDate: true, pricePerSeat: true, coverImage: true,
      minimumDeposit: true,
    },
  });
  if (!trip) redirect('/viajes');

  const pricePerSeat  = trip.pricePerSeat.toNumber();
  const total         = pricePerSeat * seatNumbers.length;
  const depositAmount = trip.minimumDeposit ? trip.minimumDeposit.toNumber() * seatNumbers.length : null;
  const chargeAmount  = mode === 'deposit' && depositAmount ? depositAmount : total;

  const dep = new Date(trip.departureDate);
  const ret = new Date(trip.returnDate);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const sameMonth = dep.getMonth() === ret.getMonth() && dep.getFullYear() === ret.getFullYear();
  const dateRange = sameMonth
    ? `${dep.getDate()} – ${ret.getDate()} ${months[dep.getMonth()]} ${dep.getFullYear()}`
    : `${dep.getDate()} ${months[dep.getMonth()]} – ${ret.getDate()} ${months[ret.getMonth()]} ${ret.getFullYear()}`;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', flexDirection: 'column' }}>

      {/* ── Minimal header ── */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #F1F5F9',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#0F172A' }}>
            Agencia<span style={{ color: '#F97316' }}>Tours</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Pago seguro
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '40px 24px 80px' }}>

        {/* Progress stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {/* Step 1 — done */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Asientos</span>
          </div>
          <div style={{ flex: 1, maxWidth: 40, height: 1, background: '#CBD5E1' }} />
          {/* Step 2 — active */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0F1F4B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>2</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Pago</span>
          </div>
          <div style={{ flex: 1, maxWidth: 40, height: 1, background: '#CBD5E1' }} />
          {/* Step 3 — pending */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>3</span>
            </div>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Confirmación</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: '#0F172A', margin: '0 0 32px', lineHeight: 1.1 }}>
          Finalizá tu reservación.
        </h1>

        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

          {/* ── LEFT: payment form ── */}
          <CheckoutForm
            tripId={tripId}
            seatNumbers={seatNumbers}
            lockId={lockId}
            totalAmount={total}
            chargeAmount={chargeAmount}
            mode={mode}
            tripSlug={trip.slug}
            lockExpiresAt={seatLock.expiresAt.toISOString()}
          />

          {/* ── RIGHT: order summary ── */}
          <div style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #F1F5F9',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>
              Resumen de tu orden
            </h2>

            {/* Trip row */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 60%, #FCD34D 100%)',
              }}>
                {trip.coverImage && (
                  <Image src={trip.coverImage} alt={trip.title} width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.3 }}>{trip.title}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  {dateRange} · {trip.destination}
                </p>
              </div>
            </div>

            {/* Seat chips */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'monospace' }}>
                Asientos seleccionados
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {seatNumbers.map(n => (
                  <span key={n} style={{
                    padding: '4px 12px', borderRadius: 999,
                    background: '#0F1F4B', color: '#fff',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    Asiento {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Precio por asiento</span>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{formatCurrency(pricePerSeat)} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Asientos (×{seatNumbers.length})</span>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{formatCurrency(total)} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Cargo por servicio</span>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>$0 MXN</span>
              </div>
              {mode === 'deposit' && depositAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Saldo restante</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{formatCurrency(total - depositAmount)} MXN</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                {mode === 'deposit' ? 'Pagas ahora' : 'Total'}
              </span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F97316', letterSpacing: '-0.02em' }}>
                {formatCurrency(chargeAmount)} MXN
              </span>
            </div>

            {/* Pay button — linked to form submit */}
            <button
              form="checkout-payment-form"
              type="submit"
              style={{
                width: '100%', padding: '14px 0', borderRadius: 999, border: 'none',
                background: '#F97316', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(249,115,22,.35)',
              }}
            >
              {mode === 'deposit' ? `Pagar depósito ${formatCurrency(chargeAmount)} MXN →` : `Pagar ${formatCurrency(chargeAmount)} MXN →`}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Pago cifrado · Procesado de forma segura</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
