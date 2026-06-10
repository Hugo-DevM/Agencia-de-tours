'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  tripId: string;
  seatNumbers: number[];
  lockId: string;
  totalAmount: number;
  chargeAmount: number;
  mode: 'full' | 'deposit';
  tripSlug: string;
  lockExpiresAt: string;
}

/* ── Inner form ───────────────────────────────────────────── */
function PaymentForm({ bookingId, totalAmount }: { bookingId: string; totalAmount: number }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/confirmacion/${bookingId}` },
    });

    if (stripeErr) {
      setError(stripeErr.message ?? 'Error al procesar el pago. Intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form id="checkout-payment-form" onSubmit={handleSubmit}>
      {/* Stripe PaymentElement — renders Tarjeta / OXXO tabs + fields */}
      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #F1F5F9',
        padding: '28px',
      }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'oxxo'],
          }}
        />
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12, marginTop: 16,
          background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
        Al pagar aceptás los términos y la política de cancelación de AgenciaTours.
      </p>

      {/* Hidden submit — the visible button is in the summary card (form="checkout-payment-form") */}
      <button type="submit" disabled={!stripe || submitting} style={{ display: 'none' }} aria-hidden />
    </form>
  );
}

/* ── Lock countdown hook ──────────────────────────────────── */
function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => {
        const next = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
        if (next === 0) clearInterval(id);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

/* ── Expired overlay ──────────────────────────────────────── */
function ExpiredOverlay({ tripSlug }: { tripSlug: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24,
        padding: '40px 36px', maxWidth: 400, width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FEF2F2', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>
          Tu reserva expiró
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 }}>
          Los 15 minutos para completar tu pago se agotaron y tus asientos fueron liberados. Vuelve al catálogo para seleccionarlos de nuevo.
        </p>
        <a
          href={`/viajes/${tripSlug}#asientos`}
          style={{
            display: 'block', padding: '14px 0', borderRadius: 999,
            background: '#F97316', color: '#fff',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(249,115,22,.3)',
          }}
        >
          Volver a seleccionar asientos
        </a>
      </div>
    </div>
  );
}

/* ── Outer wrapper ────────────────────────────────────────── */
export function CheckoutForm({ tripId, seatNumbers, lockId, totalAmount, chargeAmount, mode, tripSlug, lockExpiresAt }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId,    setBookingId]    = useState<string | null>(null);
  const [initError,    setInitError]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const calledRef = useRef(false);
  const secondsLeft = useCountdown(lockExpiresAt);
  const expired = secondsLeft === 0;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    async function init() {
      try {
        const res  = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId, seatNumbers, lockId, mode }),
        });
        const data = await res.json() as { clientSecret?: string; bookingId?: string; error?: string };

        if (!res.ok || !data.clientSecret) {
          setInitError(data.error ?? 'No se pudo iniciar el pago. Vuelve al catálogo.');
          return;
        }
        setClientSecret(data.clientSecret);
        setBookingId(data.bookingId!);
      } catch {
        setInitError('Error de red. Intenta recargar la página.');
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Countdown skeleton */}
        <div style={{ height: 44, borderRadius: 12, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #F1F5F9',
          padding: '28px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {[80, 120, 56].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 10, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #F1F5F9',
        padding: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {initError}
        </div>
        <a
          href={`/viajes/${tripSlug}#asientos`}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '12px 0', borderRadius: 999,
            border: '1.5px solid #CBD5E1', color: '#0F172A',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}
        >
          ← Volver a seleccionar asientos
        </a>
      </div>
    );
  }

  const isUrgent = secondsLeft <= 120; // last 2 min → red

  return (
    <>
      {expired && <ExpiredOverlay tripSlug={tripSlug} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Countdown banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 12,
          background: isUrgent ? '#FEF2F2' : '#FFF7ED',
          border: `1px solid ${isUrgent ? '#FECACA' : '#FED7AA'}`,
          transition: 'background 0.4s, border-color 0.4s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isUrgent ? '#DC2626' : '#EA580C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: isUrgent ? '#991B1B' : '#9A3412' }}>
              Tus asientos están reservados por
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 16, fontWeight: 800,
            color: isUrgent ? '#DC2626' : '#EA580C',
            letterSpacing: '0.05em',
            minWidth: 52, textAlign: 'right',
          }}>
            {mm}:{ss}
          </span>
        </div>

        {/* Payment form */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret!,
            locale: 'es-419',
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0F1F4B',
                colorDanger: '#DC2626',
                borderRadius: '10px',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                spacingUnit: '5px',
                colorBackground: '#ffffff',
              },
              rules: {
                '.Label': { fontWeight: '700', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'monospace' },
                '.Input': { border: '1.5px solid #E2E8F0', boxShadow: 'none', padding: '12px 14px', fontSize: '14px' },
                '.Input:focus': { border: '1.5px solid #0F1F4B', boxShadow: 'none' },
                '.Tab': { border: '1.5px solid #E2E8F0', borderRadius: '12px' },
                '.Tab--selected': { border: '1.5px solid #0F1F4B', boxShadow: 'none' },
                '.Tab:hover': { border: '1.5px solid #94a3b8' },
                '.Select': { border: '1.5px solid #E2E8F0', boxShadow: 'none', padding: '12px 14px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0F172A' },
                '.Select:focus': { border: '1.5px solid #0F1F4B', boxShadow: 'none', outline: 'none' },
              },
            },
          }}
        >
          <PaymentForm bookingId={bookingId!} totalAmount={totalAmount} />
        </Elements>
      </div>
    </>
  );
}
