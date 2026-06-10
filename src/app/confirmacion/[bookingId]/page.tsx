import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { formatCurrency } from '@/lib/utils';
import { ConfirmationPoller } from '@/components/checkout/ConfirmationPoller';

interface PageProps {
  params:       Promise<{ bookingId: string }>;
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>;
}

export default async function ConfirmacionPage({ params, searchParams }: PageProps) {
  const { bookingId }                        = await params;
  const { redirect_status, payment_intent }  = await searchParams;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, profileId: user.id },
    include: {
      trip: {
        select: {
          title: true, destination: true, slug: true,
          departureDate: true, returnDate: true, pricePerSeat: true,
        },
      },
    },
  });
  if (!booking) notFound();

  const stripeSuccess = redirect_status === 'succeeded';

  // Fetch actual charged amount and mode from Stripe PI (available in return URL)
  let chargedAmount: number | null = null;
  let isDepositPayment = booking.status === 'RESERVED';

  if (payment_intent && stripeSuccess) {
    try {
      const pi    = await stripe.paymentIntents.retrieve(payment_intent);
      chargedAmount    = pi.amount / 100;
      if (pi.metadata?.mode === 'deposit') isDepositPayment = true;
    } catch { /* ignore — fall back to DB values */ }
  }

  const paidAmount  = chargedAmount ?? booking.amountPaid.toNumber();
  const totalAmount = booking.totalAmount.toNumber();
  const remaining   = totalAmount - (booking.amountPaid.toNumber() + (chargedAmount ?? 0));

  const isFullyPaid = booking.status === 'CONFIRMED' || (stripeSuccess && !isDepositPayment);
  const isConfirmed = isFullyPaid || (stripeSuccess && isDepositPayment) || booking.status === 'RESERVED';
  const isCancelled = booking.status === 'CANCELLED' && !stripeSuccess;
  const isPending   = !isConfirmed && !isCancelled;

  // Short folio like AT-2025-A3F9
  const folio = `AT-${new Date(booking.createdAt).getFullYear()}-${booking.id.slice(-4).toUpperCase()}`;

  // QR code URL (public booking validation link)
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agenciatours.mx';
  const qrData   = encodeURIComponent(`${appUrl}/validar/${bookingId}`);
  const qrSrc    = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=96x96&ecc=M&margin=4`;

  // Format departure date + time
  const dep = new Date(booking.trip.departureDate);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const depFormatted = `${dep.getDate()} ${months[dep.getMonth()]} ${dep.getFullYear()} · ${dep.getHours().toString().padStart(2,'0')}:${dep.getMinutes().toString().padStart(2,'0')}`;

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
        <Link href="/cuenta" style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', textDecoration: 'none' }}>
          Mi cuenta
        </Link>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* ── CONFIRMED ── */}
          {isConfirmed && (
            <>
              {/* Big green checkmark */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>

              {/* Eyebrow */}
              <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px', textAlign: 'center' }}>
                <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span>
                {' '}Reservación #{folio}{' '}
                <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
              </p>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 16px', textAlign: 'center', lineHeight: 1.1 }}>
                {isDepositPayment ? '¡Asiento apartado!' : '¡Reservación confirmada!'}
              </h1>

              {/* Subtitle */}
              <p style={{ fontSize: 16, color: '#475569', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
                {isDepositPayment
                  ? 'Tu depósito fue recibido. Recuerda liquidar el saldo restante antes de la fecha límite.'
                  : 'Tu lugar está apartado. Prepará la maleta — nos vemos en la ruta.'}
              </p>

              {/* Email notice */}
              {user.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, padding: '10px 18px', borderRadius: 999, background: '#fff', border: '1px solid #E2E8F0' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    Enviamos la confirmación a{' '}
                    <strong style={{ color: '#0F172A' }}>{user.email}</strong>
                  </span>
                </div>
              )}

              {/* Detail card */}
              <div style={{ width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9', overflow: 'hidden', marginBottom: 32 }}>

                {/* Rows */}
                {[
                  {
                    label: 'Viaje',
                    value: <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{booking.trip.title}</span>,
                  },
                  {
                    label: 'Fecha de salida',
                    value: <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{depFormatted}</span>,
                  },
                  {
                    label: 'Asientos',
                    value: (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {booking.seatNumbers.map(n => (
                          <span key={n} style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#0F1F4B', color: '#fff',
                            fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {n}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  {
                    label: isDepositPayment ? 'Depósito pagado' : 'Total pagado',
                    value: (
                      <span style={{ fontWeight: 900, fontSize: 18, color: '#F97316', letterSpacing: '-0.02em' }}>
                        {formatCurrency(paidAmount)} MXN
                      </span>
                    ),
                  },
                  ...(isDepositPayment ? [{
                    label: 'Saldo restante',
                    value: (
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#64748b' }}>
                        {formatCurrency(Math.max(0, remaining))} MXN
                      </span>
                    ),
                  }] : []),
                ].map((row, i, arr) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', gap: 12 }}>
                      <span style={{ fontSize: 14, color: '#64748b' }}>{row.label}</span>
                      {row.value}
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: '#F8FAFC', margin: '0 24px' }} />}
                  </div>
                ))}

                {/* Boarding pass — only for fully paid bookings */}
                {isFullyPaid ? (
                  <div style={{ margin: '0 16px 16px', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image src={qrSrc} alt="QR de abordaje" width={80} height={80} unoptimized />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', margin: '0 0 6px' }}>Tu pase de abordaje</p>
                      <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px', lineHeight: 1.5 }}>
                        Mostrá este código QR al subir al autobús. También lo encontrás en tu correo y en Mi cuenta.
                      </p>
                      <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', margin: 0 }}>
                        FOLIO · {folio}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ margin: '0 16px 16px', borderRadius: 14, background: '#FFF7ED', border: '1px solid #FED7AA', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#C2410C', margin: '0 0 2px' }}>Pase de abordaje pendiente</p>
                      <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                        Tu QR estará disponible una vez que liquides el saldo restante.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  href="/cuenta/reservaciones"
                  style={{
                    padding: '13px 28px', borderRadius: 999,
                    background: '#F97316', color: '#fff',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(249,115,22,.35)',
                  }}
                >
                  Ver mis reservaciones →
                </Link>
                <Link
                  href="/viajes"
                  style={{
                    padding: '13px 28px', borderRadius: 999,
                    border: '1.5px solid #CBD5E1', color: '#0F172A',
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    background: '#fff',
                  }}
                >
                  Explorar más viajes
                </Link>
              </div>
            </>
          )}

          {/* ── PENDING (OXXO / processing) ── */}
          {isPending && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px', textAlign: 'center' }}>
                <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span> Pago pendiente <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 12px', textAlign: 'center' }}>
                Pago en proceso
              </h1>
              <p style={{ fontSize: 15, color: '#475569', textAlign: 'center', margin: '0 0 32px' }}>
                Confirmaremos tu reservación cuando se acredite el pago.
              </p>
              <ConfirmationPoller bookingId={bookingId} />
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <Link href="/cuenta/reservaciones" style={{ padding: '13px 28px', borderRadius: 999, background: '#F97316', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Ver mis reservaciones
                </Link>
              </div>
            </>
          )}

          {/* ── CANCELLED ── */}
          {isCancelled && (
            <>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#dc2626', textTransform: 'uppercase', margin: '0 0 12px', textAlign: 'center' }}>
                [ Pago no completado ]
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 12px', textAlign: 'center' }}>
                Pago cancelado
              </h1>
              <p style={{ fontSize: 15, color: '#475569', textAlign: 'center', margin: '0 0 32px' }}>
                No se realizó ningún cargo. Puedes intentarlo de nuevo.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href={`/viajes/${booking.trip.slug}#asientos`} style={{ padding: '13px 28px', borderRadius: 999, background: '#F97316', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Volver a intentarlo
                </Link>
                <Link href="/viajes" style={{ padding: '13px 28px', borderRadius: 999, border: '1.5px solid #CBD5E1', color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: '#fff' }}>
                  Ver más viajes
                </Link>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
