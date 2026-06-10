'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type BusType          = 'SINGLE_DOOR' | 'DOUBLE_DOOR' | 'DOUBLE_DECKER';
type BathroomPosition = 'MIDDLE' | 'BACK';

/* ── Types ────────────────────────────────────────────────── */
interface SeatSelectorProps {
  tripId: string;
  totalSeats: number;
  busType: BusType;
  bathroomPosition: BathroomPosition;
  pricePerSeat: number;
  confirmedSeats: number[];
  reservedSeats: number[];
  pendingSeats: number[];
  lockedSeats: number[];
  // Apartado
  minimumDeposit: number | null;      // null = apartado deshabilitado
  maxReservedPercent: number;
  currentReservedSeats: number;
}

interface Availability {
  confirmed: number[];
  reserved: number[];
  pending: number[];
  locked: number[];
  myLock?: { id: string; seatNumbers: number[] } | null;
  myPendingBookingId?: string | null;
}

type SeatState = 'free' | 'selected' | 'confirmed' | 'reserved' | 'pending' | 'locked';

const LOCK_TTL      = 15 * 60;
const WARN_AT       = 2 * 60;
const SEATS_PER_ROW = 4;
const SEAT_SIZE     = 44;           // px — tamaño de asiento en el selector
const SEAT_GAP      = 10;          // px — gap entre asientos dentro de un grupo
const AISLE_SIZE    = SEAT_SIZE + SEAT_GAP * 2; // pasillo con margen a cada lado para el asiento del pasillo

/* ── Layout helpers ───────────────────────────────────────── */
function buildRows(count: number, offset = 0): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += SEATS_PER_ROW) {
    rows.push(
      Array.from({ length: Math.min(SEATS_PER_ROW, count - i) }, (_, j) => offset + i + j + 1)
    );
  }
  return rows;
}

function getLowerCount(totalSeats: number): number {
  const half = Math.ceil(totalSeats / 2);
  return Math.ceil(half / SEATS_PER_ROW) * SEATS_PER_ROW;
}

function getSeatState(num: number, selected: number[], av: Availability): SeatState {
  if (av.confirmed.includes(num)) return 'confirmed';
  if (av.reserved.includes(num))  return 'reserved';
  if (av.locked.includes(num))    return 'locked';
  if (av.pending.includes(num))   return 'pending';
  if (selected.includes(num))     return 'selected';
  return 'free';
}

/* ── Styles ───────────────────────────────────────────────── */
const SEAT_STYLE: Record<SeatState, React.CSSProperties> = {
  free:      { background: '#22c55e', color: '#fff', cursor: 'pointer' },
  selected:  { background: '#3b82f6', color: '#fff', cursor: 'pointer', boxShadow: '0 0 0 3px rgba(59,130,246,0.35)' },
  confirmed: { background: '#94a3b8', color: '#fff', cursor: 'not-allowed' },
  reserved:  { background: '#a855f7', color: '#fff', cursor: 'not-allowed' },
  pending:   { background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' },
  locked:    { background: '#fb923c', color: '#fff', cursor: 'not-allowed' },
};

const STATE_LABEL: Record<SeatState, string> = {
  free:      'Disponible',
  selected:  'Seleccionado',
  confirmed: 'Vendido',
  reserved:  'Apartado',
  pending:   'Pago pendiente',
  locked:    'Reservado temporalmente',
};

/* ── Seat button ──────────────────────────────────────────── */
function SeatBtn({ num, selected, av, lockId, toggleSeat }: {
  num: number;
  selected: number[];
  av: Availability;
  lockId: string | null;
  toggleSeat: (n: number) => void;
}) {
  const state      = getSeatState(num, selected, av);
  const isDisabled = state === 'confirmed' || state === 'reserved' || state === 'pending' || state === 'locked' || (!!lockId && state !== 'selected');
  return (
    <button
      onClick={() => toggleSeat(num)}
      disabled={isDisabled}
      title={`Asiento ${num} — ${STATE_LABEL[state]}`}
      aria-label={`Asiento ${num}, ${STATE_LABEL[state]}`}
      aria-pressed={state === 'selected'}
      style={{
        width: SEAT_SIZE, height: SEAT_SIZE, borderRadius: 10, border: 'none',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.1s, box-shadow 0.1s',
        ...SEAT_STYLE[state],
      }}
    >
      {state === 'selected' ? <CheckIcon /> : num}
    </button>
  );
}

/* ── Bloques especiales (no interactivos) ─────────────────── */
const BLOCK_W = SEAT_SIZE * 2 + SEAT_GAP; // ancho de 2 asientos

function BathroomCell() {
  return (
    <div style={{
      width: BLOCK_W, height: SEAT_SIZE, flexShrink: 0,
      borderRadius: 10, background: '#EFF6FF', border: '2px dashed #60A5FA',
      color: '#2563EB', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4 3 4 3 4 5v2a1 1 0 0 0 1 1h5zm0 0h6m-6 0v12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6m-6 4h6"/>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Baño</span>
    </div>
  );
}

function SideDoorCell() {
  return (
    <div style={{
      width: BLOCK_W, height: SEAT_SIZE, flexShrink: 0,
      borderRadius: 10, background: '#FFF7ED', border: '2px dashed #FB923C',
      color: '#EA580C', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Puerta</span>
    </div>
  );
}

/* ── Filas interactivas ───────────────────────────────────── */
function RowNum({ n }: { n: number | string }) {
  return (
    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, width: 20, textAlign: 'right', marginRight: 6, flexShrink: 0 }}>
      {n}
    </span>
  );
}

function Aisle({ seat }: { seat?: React.ReactNode }) {
  return (
    <div style={{
      width: AISLE_SIZE, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {seat ?? null}
    </div>
  );
}

/** Fila estándar de hasta 4 asientos */
function SeatRowInteractive({ row, rowNum, selected, av, lockId, toggleSeat }: {
  row: number[]; rowNum: number;
  selected: number[]; av: Availability;
  lockId: string | null; toggleSeat: (n: number) => void;
}) {
  const left  = row.slice(0, 2);
  const right = row.slice(2);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <RowNum n={rowNum} />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        {left.map(n => <SeatBtn key={n} num={n} selected={selected} av={av} lockId={lockId} toggleSeat={toggleSeat} />)}
      </div>
      <Aisle />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        {right.map(n => <SeatBtn key={n} num={n} selected={selected} av={av} lockId={lockId} toggleSeat={toggleSeat} />)}
      </div>
    </div>
  );
}

/** Fila con 2 asientos reales izquierda + bloque especial derecha */
function SeatRowWithBlock({ leftSeats, right, rowNum, selected, av, lockId, toggleSeat }: {
  leftSeats: number[]; right: React.ReactNode; rowNum: number;
  selected: number[]; av: Availability;
  lockId: string | null; toggleSeat: (n: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <RowNum n={rowNum} />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        {leftSeats.map(n => <SeatBtn key={n} num={n} selected={selected} av={av} lockId={lockId} toggleSeat={toggleSeat} />)}
        {leftSeats.length < 2 && <div style={{ width: SEAT_SIZE, height: SEAT_SIZE, flexShrink: 0 }} />}
      </div>
      <Aisle />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        {right}
      </div>
    </div>
  );
}

/**
 * Última fila con asientos incompletos + baño.
 * remainder 3 → [L1][L2] | [aisleNum] | [Baño]
 * remainder 2 → [L1][L2] | pasillo     | [Baño]
 * remainder 1 → [L1][--] | pasillo     | [Baño]
 */
function LastRowWithBathroomInteractive({ row, rowNum, selected, av, lockId, toggleSeat }: {
  row: number[]; rowNum: number;
  selected: number[]; av: Availability;
  lockId: string | null; toggleSeat: (n: number) => void;
}) {
  const left     = row.slice(0, 2);
  const aisleNum = row[2];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <RowNum n={rowNum} />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        {left.map(n => <SeatBtn key={n} num={n} selected={selected} av={av} lockId={lockId} toggleSeat={toggleSeat} />)}
        {left.length < 2 && <div style={{ width: SEAT_SIZE, height: SEAT_SIZE, flexShrink: 0 }} />}
      </div>
      <Aisle seat={aisleNum !== undefined
        ? <SeatBtn num={aisleNum} selected={selected} av={av} lockId={lockId} toggleSeat={toggleSeat} />
        : undefined}
      />
      <div style={{ display: 'flex', gap: SEAT_GAP }}>
        <BathroomCell />
      </div>
    </div>
  );
}

/* ── Secciones de layout ──────────────────────────────────── */

function BackSection({ totalSeats, offset = 0, selected, av, lockId, toggleSeat }: {
  totalSeats: number; offset?: number;
  selected: number[]; av: Availability;
  lockId: string | null; toggleSeat: (n: number) => void;
}) {
  const remainder = totalSeats % SEATS_PER_ROW;
  const fullCount = totalSeats - remainder;

  const shared = { selected, av, lockId, toggleSeat };

  if (remainder === 0) {
    const beforeLast = fullCount - 2;
    const firstRows  = buildRows(beforeLast, offset);
    const lastLeft   = [offset + beforeLast + 1, offset + beforeLast + 2];
    const bathroomRowNum = firstRows.length + 1;

    return (
      <>
        {firstRows.map((row, ri) => (
          <SeatRowInteractive key={ri} row={row} rowNum={ri + 1} {...shared} />
        ))}
        <SeatRowWithBlock leftSeats={lastLeft} right={<BathroomCell />} rowNum={bathroomRowNum} {...shared} />
      </>
    );
  }

  const fullRows   = buildRows(fullCount, offset);
  const partialRow = buildRows(totalSeats, offset).at(-1)!;
  const partialRowNum = fullRows.length + 1;

  return (
    <>
      {fullRows.map((row, ri) => (
        <SeatRowInteractive key={ri} row={row} rowNum={ri + 1} {...shared} />
      ))}
      <LastRowWithBathroomInteractive row={partialRow} rowNum={partialRowNum} {...shared} />
    </>
  );
}

function MiddleSection({ totalSeats, busType, offset = 0, selected, av, lockId, toggleSeat }: {
  totalSeats: number; busType: BusType; offset?: number;
  selected: number[]; av: Availability;
  lockId: string | null; toggleSeat: (n: number) => void;
}) {
  const shared = { selected, av, lockId, toggleSeat };

  const totalRows    = Math.ceil(totalSeats / SEATS_PER_ROW);
  const midAfter     = Math.floor(totalRows / 2);
  const specialSeats = busType === 'DOUBLE_DOOR' ? 4 : 2;
  const firstCount   = Math.min(midAfter * SEATS_PER_ROW, totalSeats - specialSeats);

  const bathroomLeft = [offset + firstCount + 1, offset + firstCount + 2];
  const doorLeft     = busType === 'DOUBLE_DOOR'
    ? [offset + firstCount + 3, offset + firstCount + 4]
    : [];

  const restCount  = totalSeats - firstCount - specialSeats;
  const restOffset = offset + firstCount + specialSeats;

  const firstRows = buildRows(firstCount, offset);
  const restRows  = buildRows(restCount, restOffset);

  const restRemainder   = restCount % SEATS_PER_ROW;
  const restFull        = restRows.slice(0, restRemainder > 0 ? -1 : restRows.length);
  const restPartial     = restRemainder > 0 ? restRows.at(-1)! : null;
  const specialRowCount = busType === 'DOUBLE_DOOR' ? 2 : 1;
  const bathroomRowNum  = firstRows.length + 1;
  const doorRowNum      = firstRows.length + 2;
  const restStart       = firstRows.length + specialRowCount;

  return (
    <>
      {firstRows.map((row, ri) => (
        <SeatRowInteractive key={`f${ri}`} row={row} rowNum={ri + 1} {...shared} />
      ))}

      <SeatRowWithBlock leftSeats={bathroomLeft} right={<BathroomCell />} rowNum={bathroomRowNum} {...shared} />

      {busType === 'DOUBLE_DOOR' && (
        <SeatRowWithBlock leftSeats={doorLeft} right={<SideDoorCell />} rowNum={doorRowNum} {...shared} />
      )}

      {restRemainder === 1 && restFull.length > 0 ? (
        <>
          {restFull.slice(0, -1).map((row, ri) => (
            <SeatRowInteractive key={`r${ri}`} row={row} rowNum={restStart + 1 + ri} {...shared} />
          ))}
          {(() => {
            const combined    = [...restFull[restFull.length - 1], restPartial![0]];
            const fusedRowNum = restStart + restFull.length;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <RowNum n={fusedRowNum} />
                <div style={{ display: 'flex', gap: SEAT_GAP }}>
                  <SeatBtn num={combined[0]} {...shared} />
                  <SeatBtn num={combined[1]} {...shared} />
                </div>
                <Aisle seat={<SeatBtn num={combined[2]} {...shared} />} />
                <div style={{ display: 'flex', gap: SEAT_GAP }}>
                  <SeatBtn num={combined[3]} {...shared} />
                  <SeatBtn num={combined[4]} {...shared} />
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <>
          {restFull.map((row, ri) => (
            <SeatRowInteractive key={`r${ri}`} row={row} rowNum={restStart + 1 + ri} {...shared} />
          ))}
          {restPartial && (
            <SeatRowInteractive row={restPartial} rowNum={restStart + restFull.length + 1} {...shared} />
          )}
        </>
      )}
    </>
  );
}

/* ── Icons ────────────────────────────────────────────────── */
function SteeringIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
      <path d="M12 9V3M9.5 14.5l-5 3M14.5 14.5l5 3"/>
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="2" width="18" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  );
}
function BusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6v6M16 6v6M2 12h20M4 18h1m14 0h1M2 6h20v12H2z" />
      <circle cx="7" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="18" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  );
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ── Main component ───────────────────────────────────────── */
export function SeatSelector({
  tripId,
  totalSeats,
  busType,
  bathroomPosition,
  pricePerSeat,
  confirmedSeats: initConfirmed,
  reservedSeats:  initReserved,
  pendingSeats:   initPending,
  lockedSeats:    initLocked,
  minimumDeposit,
  maxReservedPercent,
  currentReservedSeats,
}: SeatSelectorProps) {
  const router = useRouter();

  const [av, setAv] = useState<Availability>({
    confirmed: initConfirmed,
    reserved:  initReserved,
    pending:   initPending,
    locked:    initLocked,
  });

  const [selected,  setSelected]  = useState<number[]>([]);
  const [lockId,    setLockId]    = useState<string | null>(null);
  const [locking,   setLocking]   = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Apartado state
  type PayMode = 'full' | 'deposit';
  type DepMethod = 'online' | 'cash';
  const maxReservedSeats  = Math.floor(totalSeats * (maxReservedPercent / 100));
  const depositAvailable  = minimumDeposit !== null && currentReservedSeats < maxReservedSeats;
  const [payMode,    setPayMode]    = useState<PayMode>('full');
  const [depMethod,  setDepMethod]  = useState<DepMethod>('cash');
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError,   setCashError]   = useState<string | null>(null);
  const countdownRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatingToCheckout = useRef(false);

  const isDoubleDecker = busType === 'DOUBLE_DECKER';
  const lowerCount     = getLowerCount(totalSeats);
  const upperCount     = totalSeats - lowerCount;

  /* ── Realtime ───────────────────────────────────────────── */
  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/seats/${tripId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as Availability;
        setAv({ confirmed: data.confirmed, reserved: data.reserved ?? [], pending: data.pending, locked: data.locked });
      }
    } catch { /* ignore */ }
  }, [tripId]);

  // On mount: release any stale lock / pending booking left from a previous checkout attempt
  useEffect(() => {
    async function releaseStale() {
      try {
        const res = await fetch(`/api/seats/${tripId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json() as Availability;
        setAv({ confirmed: data.confirmed, reserved: data.reserved ?? [], pending: data.pending, locked: data.locked });

        const hasStale = data.myLock || data.myPendingBookingId;
        if (hasStale) {
          await fetch('/api/seats/release-stale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId }),
          });
          // Re-fetch so availability reflects the cleanup
          await fetchAvailability();
        }
      } catch { /* ignore */ }
    }
    releaseStale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_locks', filter: `trip_id=eq.${tripId}` }, () => fetchAvailability())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings',   filter: `trip_id=eq.${tripId}` }, () => fetchAvailability())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, fetchAvailability]);

  /* ── Countdown ──────────────────────────────────────────── */
  function startCountdown() {
    setCountdown(LOCK_TTL);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          handleExpire();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
  }

  const releaseLock = useCallback(async (id: string) => {
    try {
      await fetch('/api/seats/lock', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId: id }),
      });
    } catch { /* ignore */ }
  }, []);

  function handleExpire() {
    if (lockId) releaseLock(lockId);
    setLockId(null);
    setSelected([]);
    setLockError('Tu reserva temporal expiró. Vuelve a seleccionar tus asientos.');
    fetchAvailability();
  }

  useEffect(() => {
    return () => {
      stopCountdown();
      if (lockId && !navigatingToCheckout.current) releaseLock(lockId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockId]);

  /* ── Seat toggle ────────────────────────────────────────── */
  function toggleSeat(num: number) {
    if (lockId) return;
    const state = getSeatState(num, selected, av);
    if (state === 'confirmed' || state === 'reserved' || state === 'pending' || state === 'locked') return;
    setLockError(null);
    if (state === 'selected') {
      setSelected(s => s.filter(n => n !== num));
    } else {
      if (selected.length >= 6) return;
      setSelected(s => [...s, num].sort((a, b) => a - b));
    }
  }

  /* ── Lock seats (shared step) ───────────────────────────── */
  async function lockSeats(): Promise<string | null> {
    const res = await fetch('/api/seats/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, seatNumbers: selected }),
    });
    if (res.status === 401) {
      router.push(`/login?next=/viajes/${encodeURIComponent(tripId)}`);
      return null;
    }
    const data = await res.json() as {
      ok: boolean; lockId?: string; conflict?: number[]; error?: string;
    };
    if (!data.ok) {
      if (data.conflict?.length) {
        setLockError(`Los asientos ${data.conflict.join(', ')} ya no están disponibles. Elige otros.`);
        setSelected(s => s.filter(n => !data.conflict!.includes(n)));
        fetchAvailability();
      } else {
        setLockError(data.error ?? 'No se pudo reservar. Intenta de nuevo.');
      }
      return null;
    }
    return data.lockId!;
  }

  /* ── Continuar (pago completo o depósito online) ─────────── */
  async function handleLockAndContinue() {
    if (!selected.length || locking) return;
    setLocking(true);
    setLockError(null);
    try {
      const lid = await lockSeats();
      if (!lid) return;
      setLockId(lid);
      startCountdown();
      navigatingToCheckout.current = true;
      const mode = payMode === 'deposit' && depositAvailable ? 'deposit' : 'full';
      router.push(`/checkout?trip=${tripId}&seats=${selected.join(',')}&lock=${lid}&mode=${mode}`);
    } catch {
      setLockError('Error de red. Intenta de nuevo.');
    } finally {
      setLocking(false);
    }
  }

  /* ── Apartar en efectivo ─────────────────────────────────── */
  async function handleCashReserve() {
    if (!selected.length || cashLoading) return;
    setCashLoading(true);
    setCashError(null);
    try {
      const lid = await lockSeats();
      if (!lid) return;
      const res = await fetch('/api/checkout/reserve-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, seatNumbers: selected, lockId: lid }),
      });
      const data = await res.json() as { ok?: boolean; bookingId?: string; error?: string };
      if (!res.ok || !data.bookingId) {
        setCashError(data.error ?? 'No se pudo crear el apartado. Intenta de nuevo.');
        return;
      }
      navigatingToCheckout.current = true;
      router.push(`/apartado/${data.bookingId}`);
    } catch {
      setCashError('Error de red. Intenta de nuevo.');
    } finally {
      setCashLoading(false);
    }
  }

  const total       = selected.length * pricePerSeat;
  const depositTotal = minimumDeposit ? minimumDeposit * selected.length : 0;
  const isWarn      = countdown !== null && countdown <= WARN_AT;
  const canContinue  = selected.length > 0 && !lockId && !locking && !cashLoading;

  /* ── Props compartidos para filas ──────────────────────── */
  const rowProps = { selected, av, lockId, toggleSeat };

  /* ── Renderizado del bus ─────────────────────────────────── */
  function renderFloor(seats: number, offset: number) {
    return bathroomPosition === 'MIDDLE'
      ? <MiddleSection totalSeats={seats} busType={busType} offset={offset} {...rowProps} />
      : <BackSection   totalSeats={seats} offset={offset} {...rowProps} />;
  }

  return (
    <div>
      {/* Countdown banner */}
      {countdown !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12, marginBottom: 16,
          background: isWarn ? '#FEF3C7' : '#ECFDF5',
          border: `1px solid ${isWarn ? '#FCD34D' : '#6EE7B7'}`,
          color: isWarn ? '#92400E' : '#065F46',
          fontSize: 14, fontWeight: 500,
        }}>
          <ClockIcon />
          Tus asientos están reservados por <strong style={{ marginLeft: 4 }}>{formatCountdown(countdown)}</strong>
          {isWarn && ' — ¡Completa el pago pronto!'}
        </div>
      )}

      {/* Error banner */}
      {lockError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12, marginBottom: 16,
          background: '#FEF2F2', border: '1px solid #FECACA',
          color: '#991B1B', fontSize: 14,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {lockError}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── BUS CARD ── */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px 24px 28px', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, color: '#0F172A', fontWeight: 600, fontSize: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <BusIcon />
            </div>
            Autobús ejecutivo · {totalSeats} asientos
          </div>

          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'nowrap', alignItems: 'flex-start' }}>

              {isDoubleDecker ? (
                /* Doble planta */
                <>
                  {[
                    { seats: lowerCount, offset: 0,          label: 'Planta baja' },
                    { seats: upperCount, offset: lowerCount,  label: 'Planta alta' },
                  ].map(({ seats, offset, label }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: '#1E3A8A', padding: '4px 16px', borderRadius: 999 }}>
                        {label}
                      </div>
                      <BusFrame>
                        {label === 'Planta baja'
                          ? renderFloor(seats, offset)
                          /* Planta alta: siempre filas normales, sin baño */
                          : buildRows(seats, offset).map((row, ri) => (
                              <SeatRowInteractive key={ri} row={row} rowNum={ri + 1} {...rowProps} />
                            ))
                        }
                      </BusFrame>
                    </div>
                  ))}
                </>
              ) : (
                /* Un piso */
                <BusFrame>
                  {renderFloor(totalSeats, 0)}
                </BusFrame>
              )}

            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            {([
              { state: 'free'      as SeatState, label: 'Disponible' },
              { state: 'selected'  as SeatState, label: 'Tu selección' },
              { state: 'locked'    as SeatState, label: 'Reservado (temp.)' },
              { state: 'reserved'  as SeatState, label: 'Apartado' },
              { state: 'confirmed' as SeatState, label: 'Vendido' },
            ]).map(({ state, label }) => (
              <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, ...SEAT_STYLE[state], boxShadow: 'none', cursor: 'default' }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUMMARY CARD ── */}
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '24px', border: '1px solid #F1F5F9',
          position: 'sticky', top: 100,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Tu selección</h3>

          {/* Seats */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: 'monospace' }}>
              Asientos seleccionados
            </p>
            {selected.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Ningún asiento seleccionado todavía
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.map(n => (
                  <span key={n} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#EFF6FF', color: '#2563EB',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: '#F1F5F9', margin: '0 0 16px' }} />

          {/* Precio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Precio por asiento</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{formatCurrency(pricePerSeat)} MXN</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Asientos (×{selected.length})</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{formatCurrency(total)} MXN</span>
          </div>

          <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }} />

          {/* ── Modo de pago ── */}
          {depositAvailable && selected.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'monospace' }}>
                ¿Cómo quieres pagar?
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['full', 'deposit'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPayMode(m)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                      background: payMode === m ? '#0F1F4B' : '#F1F5F9',
                      color:      payMode === m ? '#fff'     : '#64748b',
                    }}
                  >
                    {m === 'full' ? 'Pagar completo' : 'Apartar'}
                  </button>
                ))}
              </div>

              {payMode === 'deposit' && (
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Depósito mínimo</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>
                      {formatCurrency(depositTotal)} MXN
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Saldo restante</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                      {formatCurrency(total - depositTotal)} MXN
                    </span>
                  </div>
                  {/* Método de pago del depósito */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['cash', 'online'] as const).map(dm => (
                      <button
                        key={dm}
                        onClick={() => setDepMethod(dm)}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 10,
                          border: `1.5px solid ${depMethod === dm ? '#25D366' : '#E2E8F0'}`,
                          background: depMethod === dm ? '#DCFCE7' : '#fff',
                          color: depMethod === dm ? '#15803D' : '#64748b',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {dm === 'cash' ? '💬 Efectivo' : '💳 Online'}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {depMethod === 'cash'
                      ? 'Tu asiento queda bloqueado y te enviamos los datos por WhatsApp.'
                      : 'Paga el depósito con tarjeta ahora y el resto cuando puedas.'}
                  </p>
                </div>
              )}
              <div style={{ height: 1, background: '#F1F5F9', marginBottom: 16 }} />
            </>
          )}

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              {payMode === 'deposit' && depositAvailable ? 'Pagas ahora' : 'Total'}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#F97316', letterSpacing: '-0.02em' }}>
              {formatCurrency(payMode === 'deposit' && depositAvailable ? depositTotal : total)}{' '}
              <span style={{ fontSize: 14, fontWeight: 600 }}>MXN</span>
            </span>
          </div>

          {/* CTA */}
          {payMode === 'deposit' && depositAvailable && depMethod === 'cash' ? (
            <>
              <button
                onClick={handleCashReserve}
                disabled={!canContinue}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
                  background: canContinue ? '#25D366' : '#BBF7D0',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: canContinue ? '0 4px 16px rgba(37,211,102,0.35)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                {cashLoading ? 'Apartando…' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Apartar por WhatsApp
                  </>
                )}
              </button>
              {cashError && (
                <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', margin: '8px 0 0' }}>{cashError}</p>
              )}
            </>
          ) : (
            <button
              onClick={handleLockAndContinue}
              disabled={!canContinue}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
                background: canContinue ? '#F97316' : '#FED7AA',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: canContinue ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                boxShadow: canContinue ? '0 4px 16px rgba(249,115,22,0.35)' : 'none',
              }}
            >
              {locking ? 'Reservando…' : 'Continuar →'}
            </button>
          )}

          {!canContinue && !lockId && (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '10px 0 0' }}>
              Elegí al menos un asiento para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Marco visual del autobús ─────────────────────────────── */
function BusFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: 28, padding: '20px 32px 28px', minWidth: 340 }}>
      {/* Conductor + Puerta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SteeringIcon />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Conductor</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E2E8F0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DoorIcon />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Puerta</span>
        </div>
      </div>
      {/* Filas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SEAT_GAP }}>
        {children}
      </div>
      {/* Trasera */}
      <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#CBD5E1' }}>
        Parte trasera
      </div>
    </div>
  );
}
