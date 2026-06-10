import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { WhatsAppButton } from '@/components/apartado/WhatsAppButton';

interface PageProps { params: Promise<{ bookingId: string }> }

export default async function ApartadoPage({ params }: PageProps) {
  const { bookingId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/apartado/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId, profileId: user.id, status: 'RESERVED' },
    include: {
      trip: {
        select: { title: true, destination: true, departureDate: true, coverImage: true, pricePerSeat: true, minimumDeposit: true },
      },
    },
  });
  if (!booking) redirect('/cuenta/reservaciones');

  const ref        = bookingId.slice(-8).toUpperCase();
  const total      = booking.totalAmount.toNumber();
  const minDep     = booking.trip.minimumDeposit ? booking.trip.minimumDeposit.toNumber() * booking.seatNumbers.length : 0;
  const expires    = booking.depositExpiresAt ? new Date(booking.depositExpiresAt) : null;

  const dep      = new Date(booking.trip.departureDate);
  const months   = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dateStr  = `${dep.getDate()} de ${months[dep.getMonth()]} ${dep.getFullYear()}`;
  const seatsStr = booking.seatNumbers.join(', ');

  const whatsappText = [
    `¡Hola! Quiero apartar mis asientos en efectivo.`,
    ``,
    `📋 Referencia: #${ref}`,
    `🚌 Viaje: ${booking.trip.title}`,
    `📍 Destino: ${booking.trip.destination}`,
    `📅 Fecha: ${dateStr}`,
    `💺 Asientos: ${seatsStr}`,
    `💰 Total del viaje: $${total.toFixed(2)} MXN`,
    `📦 Depósito mínimo: $${minDep.toFixed(2)} MXN`,
    ``,
    `Por favor confírmenme para coordinar el pago. ¡Gracias!`,
  ].join('\n');

  const whatsappPhone = process.env.WHATSAPP_PHONE ?? '';
  const whatsappUrl   = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>¡Asientos apartados!</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Tus asientos están bloqueados. Ahora coordina el pago con nosotros.
          </p>
        </div>

        {/* Booking card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F1F5F9', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Ref banner */}
          <div style={{ background: '#0F1F4B', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Referencia de apartado
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              #{ref}
            </span>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Trip info */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'monospace' }}>Viaje</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{booking.trip.title}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{booking.trip.destination} · {dateStr}</p>
            </div>

            <div style={{ height: 1, background: '#F1F5F9' }} />

            {/* Seats */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: 'monospace' }}>Asientos</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {booking.seatNumbers.map(n => (
                  <span key={n} style={{ padding: '4px 12px', borderRadius: 999, background: '#0F1F4B', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    Asiento {n}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#F1F5F9' }} />

            {/* Amounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Total del viaje</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{formatCurrency(total)} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Depósito mínimo</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>{formatCurrency(minDep)} MXN</span>
              </div>
            </div>

            {/* Expiry warning */}
            {expires && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#EA580C', margin: '0 0 2px' }}>
                    Tus asientos están bloqueados por 24 horas
                  </p>
                  <p style={{ fontSize: 11, color: '#C2410C', margin: 0 }}>
                    Si no registramos tu primer pago antes del{' '}
                    <strong>{expires.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong>,
                    los asientos se liberarán automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F1F5F9', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
            Siguiente paso: mándanos un mensaje
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
            Envíanos el mensaje de WhatsApp con los datos de tu apartado para coordinar tu primer abono.
          </p>
          {whatsappUrl ? (
            <WhatsAppButton url={whatsappUrl} />
          ) : (
            <div style={{ background: '#F8F9FB', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {whatsappText}
              </p>
            </div>
          )}
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link href="/viajes" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
            Ver más viajes
          </Link>
          <Link href="/cuenta/reservaciones" style={{ fontSize: 13, color: '#F97316', fontWeight: 600, textDecoration: 'none' }}>
            Mis reservaciones →
          </Link>
        </div>

      </div>
    </div>
  );
}
