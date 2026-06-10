import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Validar boleto — AgenciaTours' };

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function ValidarPage({ params }: Props) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip:    { select: { title: true, destination: true, departureDate: true, returnDate: true } },
      profile: { select: { fullName: true, email: true } },
    },
  });

  const isValid = booking?.status === 'CONFIRMED';
  const isPast  = booking ? booking.trip.departureDate < new Date() : false;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isValid ? '#f0fdf4' : '#fef2f2',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '40px 32px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 4px 32px rgba(0,0,0,.10)',
        textAlign: 'center',
      }}>

        {!booking ? (
          <>
            <div style={{ fontSize: 64 }}>❌</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#B91C1C', margin: '16px 0 8px' }}>
              Boleto inválido
            </h1>
            <p style={{ color: '#6B7280', fontSize: 15 }}>
              No se encontró ninguna reservación con este código.
            </p>
          </>
        ) : !isValid ? (
          <>
            <div style={{ fontSize: 64 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#B45309', margin: '16px 0 8px' }}>
              Reservación {booking.status === 'CANCELLED' ? 'cancelada' : 'no confirmada'}
            </h1>
            <p style={{ color: '#6B7280', fontSize: 15 }}>
              Este boleto no está activo. Estado: <strong>{booking.status}</strong>
            </p>
          </>
        ) : (
          <>
            {/* Valid badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#DCFCE7',
              color: '#15803D',
              borderRadius: 999,
              padding: '8px 20px',
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 20 }}>✅</span> BOLETO VÁLIDO
            </div>

            {/* Trip info */}
            <div style={{
              background: '#F9FAFB',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'left',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9CA3AF', margin: '0 0 4px' }}>
                {booking.trip.destination}
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                {booking.trip.title}
              </h2>

              <Row label="Pasajero"  value={booking.profile.fullName ?? booking.profile.email} />
              <Row label="Salida"    value={formatDate(booking.trip.departureDate)} />
              <Row label="Regreso"   value={formatDate(booking.trip.returnDate)} />
              <Row
                label="Asientos"
                value={booking.seatNumbers.join(', ')}
                highlight
              />
            </div>

            {/* Ref */}
            <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
              Ref: {booking.id}
            </p>

            {isPast && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#B45309', background: '#FEF3C7', borderRadius: 8, padding: '8px 12px' }}>
                ⚠️ Este viaje ya fue realizado
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <span style={{
        fontSize: 14,
        fontWeight: highlight ? 700 : 500,
        color: highlight ? '#1D4ED8' : '#111827',
      }}>{value}</span>
    </div>
  );
}
