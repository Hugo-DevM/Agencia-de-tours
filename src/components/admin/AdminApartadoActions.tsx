'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Props {
  bookingId:  string;
  remaining:  number;
  expiresAt:  string | null;
}

export function AdminApartadoActions({ bookingId, remaining, expiresAt }: Props) {
  const router = useRouter();

  // Cash payment form
  const [cashAmount, setCashAmount]   = useState(String(Math.round(remaining * 100) / 100));
  const [cashNotes,  setCashNotes]    = useState('');
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError,   setCashError]   = useState<string | null>(null);
  const [cashDone,    setCashDone]    = useState(false);

  // Extend deposit
  const [extHours,    setExtHours]    = useState(24);
  const [extLoading,  setExtLoading]  = useState(false);
  const [extError,    setExtError]    = useState<string | null>(null);
  const [extDone,     setExtDone]     = useState(false);

  // Cancel
  const [cancelConf,    setCancelConf]    = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError,   setCancelError]   = useState<string | null>(null);

  async function handleRecordCash(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0) { setCashError('Ingresa un monto válido.'); return; }
    if (amount > remaining + 0.01) { setCashError(`No puede exceder el saldo ($${remaining.toFixed(2)} MXN).`); return; }
    setCashLoading(true);
    setCashError(null);
    try {
      const res  = await fetch(`/api/admin/bookings/${bookingId}/record-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes: cashNotes || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setCashError(data.error ?? 'Error al registrar.'); return; }
      setCashDone(true);
      router.refresh();
    } catch {
      setCashError('Error de red. Intenta de nuevo.');
    } finally {
      setCashLoading(false);
    }
  }

  async function handleExtend() {
    setExtLoading(true);
    setExtError(null);
    setExtDone(false);
    try {
      const res  = await fetch(`/api/admin/bookings/${bookingId}/extend-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: extHours }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setExtError(data.error ?? 'Error al extender.'); return; }
      setExtDone(true);
      router.refresh();
    } catch {
      setExtError('Error de red.');
    } finally {
      setExtLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res  = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setCancelError(data.error ?? 'Error al cancelar.'); return; }
      router.refresh();
    } catch {
      setCancelError('Error de red.');
    } finally {
      setCancelLoading(false);
      setCancelConf(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

      {/* ── Record cash payment ── */}
      <div className="form-card" style={{ borderLeft: '3px solid #16a34a' }}>
        <h4 className="h4" style={{ marginBottom: 'var(--s-4)', color: '#15803d' }}>
          Registrar abono en efectivo
        </h4>

        {cashDone ? (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#DCFCE7', color: '#15803d', fontSize: 14, fontWeight: 600 }}>
            ✓ Abono registrado correctamente
          </div>
        ) : (
          <form onSubmit={handleRecordCash} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label className="label">Monto recibido (MXN)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>$</span>
                <input
                  type="number"
                  className="input"
                  style={{ paddingLeft: 28 }}
                  value={cashAmount}
                  min={0.01}
                  max={remaining}
                  step="0.01"
                  onChange={e => setCashAmount(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {[remaining / 2, remaining].map((v, i) => {
                  const val = Math.round(v * 100) / 100;
                  const label = i === 0 ? 'La mitad' : 'Saldo completo';
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashAmount(String(val))}
                      style={{
                        padding: '4px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        border: `1.5px solid ${Math.abs(parseFloat(cashAmount) - val) < 0.01 ? '#16a34a' : 'var(--border)'}`,
                        background: Math.abs(parseFloat(cashAmount) - val) < 0.01 ? '#DCFCE7' : 'var(--surface)',
                        color: Math.abs(parseFloat(cashAmount) - val) < 0.01 ? '#15803d' : 'var(--ink-muted)',
                      }}
                    >
                      {label} — {formatCurrency(val)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="label">Notas (opcional)</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Pagó en la oficina el lunes"
                value={cashNotes}
                onChange={e => setCashNotes(e.target.value)}
              />
            </div>

            {cashError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#991B1B', fontSize: 13 }}>
                {cashError}
              </div>
            )}

            <button
              type="submit"
              disabled={cashLoading}
              style={{
                padding: '12px 0', borderRadius: 999, border: 'none', fontSize: 14, fontWeight: 700,
                background: cashLoading ? '#BBF7D0' : '#16a34a',
                color: '#fff', cursor: cashLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {cashLoading ? 'Registrando…' : 'Confirmar abono en efectivo'}
            </button>
          </form>
        )}
      </div>

      {/* ── Extend deposit deadline ── */}
      <div className="form-card" style={{ borderLeft: '3px solid #F97316' }}>
        <h4 className="h4" style={{ marginBottom: 'var(--s-4)', color: '#ea580c' }}>
          Extender plazo de apartado
        </h4>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12 }}>
          {expiresAt
            ? `Vence: ${new Date(expiresAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'Sin fecha de vencimiento configurada'}
        </p>

        {extDone && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF7ED', color: '#c2410c', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            ✓ Plazo extendido correctamente
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[24, 48, 72].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setExtHours(h)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${extHours === h ? '#F97316' : 'var(--border)'}`,
                  background: extHours === h ? '#FFF7ED' : 'var(--surface)',
                  color: extHours === h ? '#ea580c' : 'var(--ink-muted)',
                }}
              >
                {h}h
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={extLoading}
            onClick={handleExtend}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 700,
              background: extLoading ? '#FED7AA' : '#F97316',
              color: '#fff', cursor: extLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {extLoading ? 'Extendiendo…' : `+${extHours}h`}
          </button>
        </div>
        {extError && (
          <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{extError}</p>
        )}
      </div>

      {/* ── Cancel booking ── */}
      <div className="form-card" style={{ borderLeft: '3px solid #dc2626' }}>
        <h4 className="h4" style={{ marginBottom: 'var(--s-2)', color: '#dc2626' }}>
          Cancelar apartado
        </h4>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12 }}>
          Al cancelar, los asientos quedarán disponibles nuevamente. Esta acción no se puede deshacer.
        </p>

        {cancelError && (
          <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{cancelError}</p>
        )}

        {cancelConf ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setCancelConf(false)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              No, mantener
            </button>
            <button
              type="button"
              disabled={cancelLoading}
              onClick={handleCancel}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 700,
                background: cancelLoading ? '#FECACA' : '#dc2626',
                color: '#fff', cursor: cancelLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {cancelLoading ? 'Cancelando…' : 'Sí, cancelar'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCancelConf(true)}
            style={{ padding: '10px 20px', borderRadius: 999, border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar apartado →
          </button>
        )}
      </div>
    </div>
  );
}
