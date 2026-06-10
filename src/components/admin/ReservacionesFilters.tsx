'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState, useRef, useEffect } from 'react';

interface Trip { id: string; title: string }

interface Props {
  trips: Trip[];
  currentEstado: string;
  currentViaje: string;
  currentQ: string;
}

const STATUS_OPTIONS = [
  { value: '',                 label: 'Todos los estados', dot: '#CBD5E1' },
  { value: 'PENDING',          label: 'Pendiente',          dot: '#60a5fa' },
  { value: 'AWAITING_PAYMENT', label: 'Pago pendiente',     dot: '#f59e0b' },
  { value: 'RESERVED',         label: 'Apartado',           dot: '#f97316' },
  { value: 'CONFIRMED',        label: 'Confirmada',         dot: '#22c55e' },
  { value: 'CANCELLED',        label: 'Cancelada',          dot: '#f87171' },
];

interface DropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string; dot?: string }[];
  onChange: (v: string) => void;
  minWidth?: number;
}

function CustomSelect({ label, value, options, onChange, minWidth = 180 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="filter-group" ref={ref} style={{ position: 'relative' }}>
      <label className="filter-label">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: 38, minWidth, padding: '0 32px 0 12px',
          borderRadius: 'var(--r-md)', border: `1.5px solid ${open ? 'var(--blue-600)' : 'var(--border-strong)'}`,
          background: 'var(--surface-raised)', color: 'var(--ink)',
          fontSize: 'var(--fs-13)', fontFamily: 'var(--font-sans)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: open ? '0 0 0 3px rgba(30,58,138,0.10)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          position: 'relative', whiteSpace: 'nowrap',
        }}
      >
        {selected.dot && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected.dot, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected.label}
        </span>
        {/* Chevron */}
        <svg
          style={{ position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.2s', color: '#94a3b8', flexShrink: 0 }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: minWidth, overflow: 'hidden', padding: '4px 0',
        }}>
          {options.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', border: 'none', cursor: 'pointer',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? 'var(--blue-700, #1d4ed8)' : 'var(--ink)',
                  fontSize: 'var(--fs-13)', fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left', whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {opt.dot && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />
                )}
                {opt.label}
                {isActive && (
                  <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReservacionesFilters({ trips, currentEstado, currentViaje, currentQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('pagina');
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [router, pathname, searchParams]);

  const tripOptions = [
    { value: '', label: 'Todos los viajes' },
    ...trips.map(t => ({ value: t.id, label: t.title })),
  ];

  return (
    <div className="admin-filters">
      {/* Search */}
      <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
        <label className="filter-label">Buscar cliente</label>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            className="filter-select"
            style={{ paddingLeft: 34 }}
            placeholder="Nombre o email…"
            defaultValue={currentQ}
            onChange={e => update('q', e.target.value)}
          />
        </div>
      </div>

      {/* Status */}
      <CustomSelect
        label="Estado"
        value={currentEstado}
        options={STATUS_OPTIONS}
        onChange={v => update('estado', v)}
        minWidth={190}
      />

      {/* Trip */}
      <CustomSelect
        label="Viaje"
        value={currentViaje}
        options={tripOptions}
        onChange={v => update('viaje', v)}
        minWidth={200}
      />
    </div>
  );
}
