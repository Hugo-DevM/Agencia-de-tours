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

/* ── Outer wrapper ────────────────────────────────────────── */
export function CheckoutForm({ tripId, seatNumbers, lockId, totalAmount, chargeAmount, mode, tripSlug }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId,    setBookingId]    = useState<string | null>(null);
  const [initError,    setInitError]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const calledRef = useRef(false);

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

  return (
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
  );
}
