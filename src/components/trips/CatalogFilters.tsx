'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useRef, useEffect } from 'react';

interface CatalogFiltersProps {
  destinations: string[];
  currentDestination: string;
  currentOrder: string;
  currentPrecioMax: string;
}

const MAX_PRICE    = 10000;
const DEFAULT_MAX  = 5000;

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function DestinationSelect({ destinations, value, onChange }: {
  destinations: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [{ value: '', label: 'Todos los destinos' }, ...destinations.map(d => ({ value: d, label: d }))];
  const selected = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-[42px] flex items-center gap-2 px-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer transition-all duration-150"
        style={{ boxShadow: open ? '0 0 0 3px rgba(15,31,75,0.08)' : 'none', borderColor: open ? '#0F1F4B' : '' }}
      >
        <span style={{ color: value ? '#F97316' : '#94a3b8' }}>
          <PinIcon />
        </span>
        <span className="flex-1 text-left truncate font-medium" style={{ color: value ? '#0F172A' : '#94a3b8' }}>
          {selected.label}
        </span>
        <span style={{ color: '#94a3b8' }}><ChevronIcon open={open} /></span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 bg-white border border-gray-100 rounded-xl overflow-hidden py-1"
          style={{ top: 'calc(100% + 6px)', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {options.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-100"
                style={{
                  background: isActive ? '#FFF7ED' : 'transparent',
                  color: isActive ? '#C2410C' : '#374151',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: isActive ? '#F97316' : '#CBD5E1', flexShrink: 0 }}><PinIcon /></span>
                {opt.label}
                {isActive && (
                  <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

export function CatalogFilters({
  destinations,
  currentDestination,
  currentPrecioMax,
}: CatalogFiltersProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [destino,   setDestino]   = useState(currentDestination);
  const [precioMax, setPrecioMax] = useState(
    currentPrecioMax ? Number(currentPrecioMax) : DEFAULT_MAX
  );

  const pct = Math.round((precioMax / MAX_PRICE) * 100);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (destino) params.set('destino', destino); else params.delete('destino');
    if (precioMax < MAX_PRICE) params.set('precioMax', String(precioMax));
    else params.delete('precioMax');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, destino, precioMax]);

  return (
    <div className="bg-white rounded-2xl shadow-lg px-6 py-5 flex items-end gap-5 flex-wrap">

      {/* Destino */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
          Destino
        </label>
        <DestinationSelect
          destinations={destinations}
          value={destino}
          onChange={setDestino}
        />
      </div>

      <div className="w-px h-12 bg-gray-100 shrink-0" />

      {/* Precio máximo */}
      <div className="flex flex-col gap-1.5 flex-[1.4] min-w-[180px]">
        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
          Precio máximo ·{' '}
          <span className="text-orange-500 font-semibold not-italic">
            ${precioMax.toLocaleString('es-MX')} MXN
          </span>
        </label>
        <div className="pt-2 pb-1">
          <input
            type="range"
            min={500}
            max={MAX_PRICE}
            step={100}
            value={precioMax}
            onChange={e => setPrecioMax(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </div>

      {/* Buscar */}
      <button
        type="button"
        onClick={handleSearch}
        className="h-[42px] px-7 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all duration-150 shrink-0 whitespace-nowrap hover:opacity-90 active:scale-95"
        style={{ background: '#0F1F4B' }}
      >
        Buscar →
      </button>
    </div>
  );
}
