'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  bookingId: string;
  currentStatus: string;
}

const STATUSES = [
  { value: 'PENDING',          label: 'Pendiente',       color: 'var(--info)',    bg: 'var(--info-bg)' },
  { value: 'AWAITING_PAYMENT', label: 'Pago pendiente',  color: 'var(--warning)', bg: 'var(--warning-bg)' },
  { value: 'CONFIRMED',        label: 'Confirmada',      color: 'var(--success)', bg: 'var(--success-bg)' },
  { value: 'CANCELLED',        label: 'Cancelada',       color: 'var(--danger)',  bg: 'var(--danger-bg)' },
];

export function BookingStatusChanger({ bookingId, currentStatus }: Props) {
  const [selected, setSelected] = useState(currentStatus);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (selected === currentStatus || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Error al guardar');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      {STATUSES.map(s => (
        <button
          key={s.value}
          onClick={() => { setSelected(s.value); setSuccess(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 16px',
            borderRadius: 'var(--r-md)',
            border: `1.5px solid ${selected === s.value ? s.color : 'var(--border-strong)'}`,
            background: selected === s.value ? s.bg : 'var(--surface)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-14)',
            fontWeight: selected === s.value ? 'var(--w-semibold)' : 'var(--w-regular)',
            color: selected === s.value ? s.color : 'var(--ink-muted)',
            transition: 'all var(--dur-fast) var(--ease)',
            textAlign: 'left',
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          {s.label}
          {s.value === currentStatus && (
            <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-12)', color: 'var(--ink-faint)' }}>actual</span>
          )}
        </button>
      ))}

      {error && (
        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--danger)', marginTop: 'var(--s-2)' }}>{error}</p>
      )}
      {success && (
        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--success)', marginTop: 'var(--s-2)' }}>
          ✓ Estado actualizado
        </p>
      )}

      <button
        className="btn btn-blue btn-block"
        style={{ marginTop: 'var(--s-2)' }}
        onClick={handleSave}
        disabled={saving || selected === currentStatus}
      >
        {saving ? 'Guardando…' : 'Guardar cambio'}
      </button>

      {selected !== currentStatus && (
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-subtle)', textAlign: 'center' }}>
          Cambiará de <strong>{currentStatus}</strong> a <strong>{selected}</strong>
        </p>
      )}
    </div>
  );
}
