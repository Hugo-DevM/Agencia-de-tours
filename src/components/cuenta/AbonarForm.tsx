'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/* ── Inner payment form ───────────────────────────────────────── */
function PaymentStep({ bookingId, amount, onBack }: { bookingId: string; amount: number; onBack: () => void }) {
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
      confirmParams: {
        return_url: `${window.location.origin}/cuenta/reservaciones/${bookingId}`,
      },
    });

    if (stripeErr) {
      setError(stripeErr.message ?? 'Error al procesar el pago. Intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
        <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['card'] }} />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1, padding: '13px 0', borderRadius: 999,
            border: '1.5px solid #E2E8F0', background: '#fff',
            color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Cambiar monto
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          style={{
            flex: 2, padding: '13px 0', borderRadius: 999, border: 'none',
            background: stripe && !submitting ? '#F97316' : '#FED7AA',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: stripe && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: stripe && !submitting ? '0 4px 16px rgba(249,115,22,.35)' : 'none',
          }}
        >
          {submitting ? 'Procesando…' : `Pagar ${formatCurrency(amount)} MXN`}
        </button>
      </div>
    </form>
  );
}

/* ── Main wrapper ─────────────────────────────────────────────── */
interface Props {
  bookingId: string;
  remaining: number;
  minDeposit: number;
}

export function AbonarForm({ bookingId, remaining, minDeposit }: Props) {
  const [step,         setStep]         = useState<'amount' | 'payment'>('amount');
  const [rawAmount,    setRawAmount]    = useState(String(Math.min(remaining, minDeposit * 2)));
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const amount  = parseFloat(rawAmount) || 0;
  const isValid = amount >= minDeposit && amount <= remaining + 0.01;

  async function handleContinue() {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/checkout/add-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });
      const data = await res.json() as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? 'No se pudo iniciar el pago.');
        return;
      }
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 1: amount selector ── */
  if (step === 'amount') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'monospace', marginBottom: 8 }}>
            Monto a abonar (MXN)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#64748b' }}>$</span>
            <input
              type="number"
              value={rawAmount}
              onChange={e => setRawAmount(e.target.value)}
              min={minDeposit}
              max={remaining}
              step="0.01"
              style={{
                width: '100%', padding: '14px 16px 14px 32px', borderRadius: 12,
                border: `1.5px solid ${isValid ? '#E2E8F0' : '#FECACA'}`,
                fontSize: 18, fontWeight: 700, color: '#0F172A',
                outline: 'none', background: '#fff', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Mín: {formatCurrency(minDeposit)} MXN</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Máx (saldo): {formatCurrency(remaining)} MXN</span>
          </div>
        </div>

        {/* Quick amount buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[minDeposit, remaining / 2, remaining].map((v, i) => {
            const label = i === 0 ? 'Mínimo' : i === 1 ? 'La mitad' : 'Saldo completo';
            const val   = Math.round(v * 100) / 100;
            return (
              <button
                key={i}
                onClick={() => setRawAmount(String(val))}
                style={{
                  padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                  border: `1.5px solid ${Math.abs(amount - val) < 0.01 ? '#F97316' : '#E2E8F0'}`,
                  background: Math.abs(amount - val) < 0.01 ? '#FFF7ED' : '#fff',
                  color: Math.abs(amount - val) < 0.01 ? '#EA580C' : '#64748b',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {label} — {formatCurrency(val)}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 999, border: 'none',
            background: isValid && !loading ? '#F97316' : '#FED7AA',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: isValid && !loading ? 'pointer' : 'not-allowed',
            boxShadow: isValid && !loading ? '0 4px 16px rgba(249,115,22,.35)' : 'none',
          }}
        >
          {loading ? 'Preparando pago…' : `Continuar → ${isValid ? formatCurrency(amount) + ' MXN' : ''}`}
        </button>
      </div>
    );
  }

  /* ── Step 2: Stripe Elements ── */
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret!,
        locale: 'es-419',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#F97316',
            colorDanger:  '#DC2626',
            borderRadius: '10px',
            fontFamily:   'ui-sans-serif, system-ui, sans-serif',
          },
          rules: {
            '.Label': { fontWeight: '700', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'monospace' },
            '.Input': { border: '1.5px solid #E2E8F0', boxShadow: 'none', padding: '12px 14px', fontSize: '14px' },
            '.Input:focus': { border: '1.5px solid #F97316', boxShadow: 'none' },
          },
        },
      }}
    >
      <PaymentStep bookingId={bookingId} amount={amount} onBack={() => setStep('amount')} />
    </Elements>
  );
}
