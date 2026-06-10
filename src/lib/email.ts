import { Resend } from 'resend';
import { formatCurrency, formatDate } from '@/lib/utils';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'reservaciones@viajesbus.mx';

interface BookingEmailData {
  id: string;
  seatNumbers: number[];
  totalAmount: { toNumber(): number } | number;
  trip: {
    title: string;
    destination: string;
    departureDate: Date;
    returnDate: Date;
  };
  profile: {
    email: string;
    fullName: string | null;
  };
}

export async function sendBookingConfirmation(booking: BookingEmailData) {
  const resend = getResend();
  if (!resend) return;

  const total = typeof booking.totalAmount === 'object'
    ? (booking.totalAmount as { toNumber(): number }).toNumber()
    : booking.totalAmount;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:ui-sans-serif,system-ui,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
        <!-- Header -->
        <tr><td style="background:#0F1F4B;padding:32px 40px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">AgenciaTours</p>
          <p style="margin:8px 0 0;font-size:13px;color:#9DB0D4;">Tu próxima aventura está a un clic</p>
        </td></tr>
        <!-- Green check -->
        <tr><td style="padding:40px 40px 24px;text-align:center;">
          <div style="width:64px;height:64px;background:#DCFCE7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h1 style="margin:0;font-size:26px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;">¡Reservación confirmada!</h1>
          <p style="margin:8px 0 0;font-size:15px;color:#64748B;">Gracias${booking.profile.fullName ? `, ${booking.profile.fullName}` : ''}. Tu lugar está asegurado.</p>
        </td></tr>
        <!-- Details card -->
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
            <tr><td style="padding:20px 24px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;">Viaje</p>
              <p style="margin:4px 0 0;font-size:17px;font-weight:600;color:#0F172A;">${booking.trip.title}</p>
              <p style="margin:2px 0 0;font-size:14px;color:#64748B;">${booking.trip.destination}</p>
            </td></tr>
            <tr><td style="padding:16px 24px;border-bottom:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#64748B;">Salida</td>
                  <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;">${formatDate(booking.trip.departureDate)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748B;padding-top:6px;">Regreso</td>
                  <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;padding-top:6px;">${formatDate(booking.trip.returnDate)}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:16px 24px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0;font-size:13px;color:#64748B;">Asientos</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0F172A;">${booking.seatNumbers.join(', ')}</p>
            </td></tr>
            <tr><td style="padding:16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#64748B;">Total pagado</td>
                  <td align="right" style="font-size:20px;font-weight:700;color:#EA670C;">${formatCurrency(total)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <!-- Booking ID -->
        <tr><td style="padding:0 40px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">Número de reservación</p>
          <p style="margin:4px 0 0;font-family:ui-monospace,monospace;font-size:13px;color:#475569;">${booking.id}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94A3B8;">¿Dudas? Escríbenos a <a href="mailto:${FROM}" style="color:#1E3A8A;">${FROM}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: `AgenciaTours <${FROM}>`,
    to: booking.profile.email,
    subject: `✅ Reservación confirmada — ${booking.trip.title}`,
    html,
  });
}

// ─── Shared layout ────────────────────────────────────────────────────────────
function emailShell(headerBg: string, headerEmoji: string, headerTitle: string, headerSub: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:ui-sans-serif,system-ui,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
        <tr><td style="background:${headerBg};padding:32px 40px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">AgenciaTours</p>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Tu próxima aventura está a un clic</p>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:32px;">${headerEmoji}</p>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;">${headerTitle}</h1>
          <p style="margin:0;font-size:14px;color:#64748B;">${headerSub}</p>
        </td></tr>
        ${body}
        <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94A3B8;">¿Dudas? Escríbenos a <a href="mailto:${FROM}" style="color:#1E3A8A;">${FROM}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="font-size:13px;color:#64748B;padding:6px 0;">${label}</td>
    <td align="right" style="font-size:13px;font-weight:600;color:#0F172A;padding:6px 0;">${value}</td>
  </tr>`;
}

// ─── Deposit expiry warning email ─────────────────────────────────────────────
interface DepositWarningData {
  id: string;
  seatNumbers: number[];
  amountPaid:  { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  depositExpiresAt: Date | null;
  trip: { title: string; destination: string; departureDate: Date };
  profile: { email: string; fullName: string | null };
}

export async function sendDepositExpiryWarning(booking: DepositWarningData, appUrl: string) {
  const resend = getResend();
  if (!resend) return;

  const paid      = typeof booking.amountPaid  === 'object' ? booking.amountPaid.toNumber()  : booking.amountPaid;
  const total     = typeof booking.totalAmount === 'object' ? booking.totalAmount.toNumber() : booking.totalAmount;
  const remaining = total - paid;
  const ref       = booking.id.slice(-8).toUpperCase();

  const body = `
    <tr><td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #FED7AA;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#EA580C;">Referencia #${ref}</p>
          <p style="margin:4px 0 0;font-size:17px;font-weight:700;color:#0F172A;">${booking.trip.title}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748B;">${booking.trip.destination} · ${formatDate(booking.trip.departureDate)}</p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-bottom:1px solid #FED7AA;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow('Asientos', booking.seatNumbers.join(', '))}
            ${detailRow('Pagado', `${formatCurrency(paid)} MXN`)}
            ${detailRow('Saldo pendiente', `${formatCurrency(remaining)} MXN`)}
            ${booking.depositExpiresAt ? detailRow('Vence', booking.depositExpiresAt.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })) : ''}
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px;text-align:center;">
          <a href="${appUrl}/cuenta/reservaciones/${booking.id}/abonar"
             style="display:inline-block;padding:14px 32px;background:#F97316;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;box-shadow:0 4px 16px rgba(249,115,22,.35);">
            Hacer un abono ahora →
          </a>
        </td></tr>
      </table>
    </td></tr>`;

  const html = emailShell(
    '#C2410C',
    '⏰',
    'Tu apartado está por vencer',
    `Hola${booking.profile.fullName ? ` ${booking.profile.fullName}` : ''}. Tu apartado vence en menos de 2 horas. Realiza un abono para no perder tus asientos.`,
    body,
  );

  await resend.emails.send({
    from:    `AgenciaTours <${FROM}>`,
    to:      booking.profile.email,
    subject: `⏰ Tu apartado vence pronto — ${booking.trip.title}`,
    html,
  });
}

// ─── Cancelled deposit email ───────────────────────────────────────────────────
interface CancelledDepositData {
  id: string;
  seatNumbers: number[];
  trip: { title: string; destination: string; departureDate: Date };
  profile: { email: string; fullName: string | null };
}

export async function sendDepositCancelledEmail(booking: CancelledDepositData, appUrl: string) {
  const resend = getResend();
  if (!resend) return;

  const ref = booking.id.slice(-8).toUpperCase();

  const body = `
    <tr><td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #FECACA;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#DC2626;">Referencia #${ref}</p>
          <p style="margin:4px 0 0;font-size:17px;font-weight:700;color:#0F172A;">${booking.trip.title}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748B;">${booking.trip.destination} · ${formatDate(booking.trip.departureDate)}</p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-bottom:1px solid #FECACA;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow('Asientos liberados', booking.seatNumbers.join(', '))}
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 16px;font-size:13px;color:#64748B;">¿Todavía te interesa el viaje? Los asientos pueden estar disponibles.</p>
          <a href="${appUrl}/viajes"
             style="display:inline-block;padding:14px 32px;background:#0F1F4B;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;">
            Ver viajes disponibles →
          </a>
        </td></tr>
      </table>
    </td></tr>`;

  const html = emailShell(
    '#7F1D1D',
    '❌',
    'Tu apartado fue cancelado',
    `Hola${booking.profile.fullName ? ` ${booking.profile.fullName}` : ''}. Tu apartado no se pagó a tiempo y los asientos quedaron liberados.`,
    body,
  );

  await resend.emails.send({
    from:    `AgenciaTours <${FROM}>`,
    to:      booking.profile.email,
    subject: `❌ Apartado cancelado — ${booking.trip.title}`,
    html,
  });
}

// ─── Balance reminder email ───────────────────────────────────────────────────
interface BalanceReminderData {
  id: string;
  seatNumbers: number[];
  amountPaid:  { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  trip: { title: string; destination: string; departureDate: Date };
  profile: { email: string; fullName: string | null };
}

export async function sendBalanceReminderEmail(booking: BalanceReminderData, appUrl: string) {
  const resend = getResend();
  if (!resend) return;

  const paid      = typeof booking.amountPaid  === 'object' ? booking.amountPaid.toNumber()  : booking.amountPaid;
  const total     = typeof booking.totalAmount === 'object' ? booking.totalAmount.toNumber() : booking.totalAmount;
  const remaining = total - paid;
  const pct       = total > 0 ? Math.round((paid / total) * 100) : 0;
  const ref       = booking.id.slice(-8).toUpperCase();
  const daysUntil = Math.ceil((booking.trip.departureDate.getTime() - Date.now()) / 86400000);

  const body = `
    <tr><td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #BBF7D0;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#15803D;">Referencia #${ref}</p>
          <p style="margin:4px 0 0;font-size:17px;font-weight:700;color:#0F172A;">${booking.trip.title}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#64748B;">${booking.trip.destination} · Sale en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}</p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-bottom:1px solid #BBF7D0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow('Asientos', booking.seatNumbers.join(', '))}
            ${detailRow('Pagado hasta ahora', `${formatCurrency(paid)} MXN (${pct}%)`)}
            ${detailRow('Saldo restante', `${formatCurrency(remaining)} MXN`)}
            ${detailRow('Salida', formatDate(booking.trip.departureDate))}
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px;text-align:center;">
          <a href="${appUrl}/cuenta/reservaciones/${booking.id}/abonar"
             style="display:inline-block;padding:14px 32px;background:#16A34A;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;box-shadow:0 4px 16px rgba(22,163,74,.3);">
            Liquidar saldo pendiente →
          </a>
        </td></tr>
      </table>
    </td></tr>`;

  const html = emailShell(
    '#14532D',
    '🚌',
    `Tu viaje sale en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
    `Hola${booking.profile.fullName ? ` ${booking.profile.fullName}` : ''}. Te recordamos que tienes un saldo pendiente. Liquídalo antes de la salida.`,
    body,
  );

  await resend.emails.send({
    from:    `AgenciaTours <${FROM}>`,
    to:      booking.profile.email,
    subject: `🚌 Saldo pendiente — tu viaje sale en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
    html,
  });
}
