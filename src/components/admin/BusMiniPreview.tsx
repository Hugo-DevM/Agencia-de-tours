'use client';

import React from 'react';

type BusType = 'SINGLE_DOOR' | 'DOUBLE_DOOR' | 'DOUBLE_DECKER';
type BathroomPosition = 'MIDDLE' | 'BACK';

interface BusMiniPreviewProps {
  totalSeats: number;
  busType: BusType;
  bathroomPosition?: BathroomPosition;
}

const SEATS_PER_ROW = 4;
const BATHROOM_W = 'calc(2 * var(--seat) + var(--gap))';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

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

/* ─── iconos ──────────────────────────────────────────────────────────────── */

function DoorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  );
}

/* ─── bloques especiales ──────────────────────────────────────────────────── */

/** Bloque de baño — siempre ancho de 2 asientos */
function BathroomBlock() {
  return (
    <div style={{
      width: BATHROOM_W, height: 'var(--seat)', flexShrink: 0,
      borderRadius: 11, background: '#EFF6FF', border: '2px dashed #60A5FA',
      color: '#2563EB', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4 3 4 3 4 5v2a1 1 0 0 0 1 1h5zm0 0h6m-6 0v12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6m-6 4h6"/>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Baño
      </span>
    </div>
  );
}

/** Bloque de puerta lateral — mismo ancho de 2 asientos */
function SideDoorBlock() {
  return (
    <div style={{
      width: BATHROOM_W, height: 'var(--seat)', flexShrink: 0,
      borderRadius: 11, background: '#FFF7ED', border: '2px dashed #FB923C',
      color: '#EA580C', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
    }}>
      <DoorIcon />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Puerta
      </span>
    </div>
  );
}

/* ─── filas ───────────────────────────────────────────────────────────────── */

function Seat({ n }: { n: number }) {
  return <div className="seat seat--free"><span className="num">{n}</span></div>;
}

/** Fila estándar de 4 asientos. rowNum explícito o calculado desde el asiento. */
function SeatRow({ row, rowNum: rowNumProp }: { row: number[]; rowNum?: number }) {
  const left   = row.slice(0, 2);
  const right  = row.slice(2);
  const rowNum = rowNumProp ?? (row[0] ? Math.ceil(row[0] / SEATS_PER_ROW) : '');
  return (
    <div className="bus-row">
      <div className="row-no">{rowNum}</div>
      <div className="seat-group">
        {left.map(n => <Seat key={n} n={n} />)}
      </div>
      <div className="bus-aisle" />
      <div className="seat-group">
        {right.map(n => <Seat key={n} n={n} />)}
      </div>
    </div>
  );
}

/**
 * Fila con 2 asientos a la izquierda y un bloque en la derecha (baño o puerta).
 * Siempre recibe rowNum explícito para que nunca quede vacío.
 */
function SeatRowWithRightBlock({
  leftSeats,
  right,
  rowNum,
}: {
  leftSeats: number[];
  right: React.ReactNode;
  rowNum: number;
}) {
  return (
    <div className="bus-row">
      <div className="row-no">{rowNum}</div>
      <div className="seat-group">
        {leftSeats.map(n => <Seat key={n} n={n} />)}
        {leftSeats.length < 2 && <div className="seat seat--empty" />}
      </div>
      <div className="bus-aisle" />
      <div className="seat-group">
        {right}
      </div>
    </div>
  );
}

/**
 * Última fila con asientos incompletos + baño.
 *
 * remainder 3 → [L1][L2] | [47 en pasillo] | [Baño══]
 * remainder 2 → [L1][L2] | pasillo          | [Baño══]
 * remainder 1 → [L1][--] | pasillo          | [Baño══]
 */
function LastRowWithBathroom({ row }: { row: number[] }) {
  const left     = row.slice(0, 2);
  const aisleNum = row[2]; // asiento impar → va en el pasillo
  const rowNum   = row[0] ? Math.ceil(row[0] / SEATS_PER_ROW) : '';

  return (
    <div className="bus-row">
      <div className="row-no">{rowNum}</div>
      <div className="seat-group">
        {left.map(n => <Seat key={n} n={n} />)}
        {left.length < 2 && <div className="seat seat--empty" />}
      </div>

      {/* Si hay asiento impar, va en el pasillo — mismo contenedor .bus-aisle */}
      {aisleNum !== undefined ? (
        <div className="bus-aisle">
          <Seat n={aisleNum} />
        </div>
      ) : (
        <div className="bus-aisle" />
      )}

      <div className="seat-group">
        <BathroomBlock />
      </div>
    </div>
  );
}

/* ─── secciones de asientos ───────────────────────────────────────────────── */

/**
 * Baño AL FINAL.
 * Todas las filas completas, y al final:
 *   - Si el total NO es divisible por 4 → última fila: asientos restantes + baño inline
 *   - Si el total ES divisible por 4 → fila extra: [L1][L2] | baño (siempre 2 asientos reales a la izq)
 */
function BackBathroomSection({
  totalSeats,
  offset = 0,
}: {
  totalSeats: number;
  offset?: number;
}) {
  const remainder = totalSeats % SEATS_PER_ROW;
  const fullCount = totalSeats - remainder;

  if (remainder === 0) {
    const beforeLast  = fullCount - 2;
    const firstRows   = buildRows(beforeLast, offset);
    const lastLeft    = [offset + beforeLast + 1, offset + beforeLast + 2];
    const bathroomRow = firstRows.length + 1;

    return (
      <>
        {firstRows.map((row, ri) => <SeatRow key={ri} row={row} />)}
        <SeatRowWithRightBlock leftSeats={lastLeft} right={<BathroomBlock />} rowNum={bathroomRow} />
      </>
    );
  }

  // Hay asientos parciales → última fila tiene los restantes + baño inline
  const fullRows   = buildRows(fullCount, offset);
  const partialRow = buildRows(totalSeats, offset).at(-1)!;

  return (
    <>
      {fullRows.map((row, ri) => <SeatRow key={ri} row={row} />)}
      <LastRowWithBathroom row={partialRow} />
    </>
  );
}

/**
 * Baño A LA MITAD.
 *
 * Divide los asientos en 3 grupos:
 *  1. firstCount  → filas completas antes del baño
 *  2. 2 asientos  → lado izquierdo de la fila del baño (siempre reales)
 *  3. restCount   → filas después del baño (completas o con parcial final)
 *
 * Total: firstCount + 2 + restCount = totalSeats ✓
 */
function MiddleBathroomSection({
  totalSeats,
  busType,
  offset = 0,
}: {
  totalSeats: number;
  busType: BusType;
  offset?: number;
}) {
  const totalRows  = Math.ceil(totalSeats / SEATS_PER_ROW);
  const midAfter   = Math.floor(totalRows / 2);

  // Cuántos asientos consumen las filas especiales (baño + puerta lateral si aplica)
  const specialSeats = busType === 'DOUBLE_DOOR' ? 4 : 2;
  const firstCount   = Math.min(midAfter * SEATS_PER_ROW, totalSeats - specialSeats);

  // Fila del baño: asientos (firstCount+1) y (firstCount+2) a la izquierda
  const bathroomLeft = [offset + firstCount + 1, offset + firstCount + 2];

  // Fila de la puerta lateral (solo DOUBLE_DOOR): asientos (firstCount+3) y (firstCount+4)
  const doorLeft = busType === 'DOUBLE_DOOR'
    ? [offset + firstCount + 3, offset + firstCount + 4]
    : [];

  const restCount  = totalSeats - firstCount - specialSeats;
  const restOffset = offset + firstCount + specialSeats;

  const firstRows = buildRows(firstCount, offset);
  const restRows  = buildRows(restCount, restOffset);

  const restRemainder = restCount % SEATS_PER_ROW;
  const restFull      = restRows.slice(0, restRemainder > 0 ? -1 : restRows.length);
  const restPartial   = restRemainder > 0 ? restRows.at(-1)! : null;

  // Números de fila visuales (contiguos, sin saltos)
  const specialRowCount = busType === 'DOUBLE_DOOR' ? 2 : 1;
  const bathroomRowNum  = firstRows.length + 1;
  const doorRowNum      = firstRows.length + 2;
  const restStart       = firstRows.length + specialRowCount; // primera fila del resto

  return (
    <>
      {firstRows.map((row, ri) => <SeatRow key={`f${ri}`} row={row} rowNum={ri + 1} />)}

      {/* Fila del baño */}
      <SeatRowWithRightBlock leftSeats={bathroomLeft} right={<BathroomBlock />} rowNum={bathroomRowNum} />

      {/* DOUBLE_DOOR: puerta lateral justo debajo del baño */}
      {busType === 'DOUBLE_DOOR' && (
        <SeatRowWithRightBlock leftSeats={doorLeft} right={<SideDoorBlock />} rowNum={doorRowNum} />
      )}

      {restRemainder === 1 && restFull.length > 0 ? (
        // Fusionamos última fila completa + asiento sobrante → [a][b] | [c=pasillo] | [d][e]
        <>
          {restFull.slice(0, -1).map((row, ri) => (
            <SeatRow key={`r${ri}`} row={row} rowNum={restStart + 1 + ri} />
          ))}
          {(() => {
            const combined  = [...restFull[restFull.length - 1], restPartial![0]];
            const fusedRowNum = restStart + restFull.length;
            return (
              <div className="bus-row">
                <div className="row-no">{fusedRowNum}</div>
                <div className="seat-group">
                  <Seat n={combined[0]} />
                  <Seat n={combined[1]} />
                </div>
                <div className="bus-aisle">
                  <Seat n={combined[2]} />
                </div>
                <div className="seat-group">
                  <Seat n={combined[3]} />
                  <Seat n={combined[4]} />
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <>
          {restFull.map((row, ri) => (
            <SeatRow key={`r${ri}`} row={row} rowNum={restStart + 1 + ri} />
          ))}
          {restPartial && (
            <SeatRow row={restPartial} rowNum={restStart + restFull.length + 1} />
          )}
        </>
      )}
    </>
  );
}

/* ─── etiqueta de sección ─────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4px 0', margin: '4px 0', fontSize: 9,
      fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)',
    }}>
      {children}
    </div>
  );
}

/* ─── componente principal ────────────────────────────────────────────────── */

export default function BusMiniPreview({
  totalSeats,
  busType,
  bathroomPosition = 'BACK',
}: BusMiniPreviewProps) {

  const frontSection = (
    <div className="bus-front">
      <div className="bus-driver">
        <div className="driver-seat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          </svg>
        </div>
        <span className="bus-cap">Chofer</span>
      </div>
      <div className="bus-door">
        <div className="door-mark"><DoorIcon /></div>
        <span className="bus-cap">Puerta</span>
      </div>
    </div>
  );

  /* ── DOBLE PLANTA ───────────────────────────────────────────────────────── */
  if (busType === 'DOUBLE_DECKER') {
    const lowerCount = getLowerCount(totalSeats);
    const upperCount = totalSeats - lowerCount;

    return (
      <div className="busmap readonly">
        <SectionLabel>Planta baja</SectionLabel>
        {frontSection}
        <div className="bus-body">
          <div className="bus-rows">
            {bathroomPosition === 'MIDDLE'
              ? <MiddleBathroomSection totalSeats={lowerCount} busType={busType} offset={0} />
              : <BackBathroomSection totalSeats={lowerCount} offset={0} />
            }
          </div>
        </div>

        <SectionLabel>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginRight: 4, verticalAlign: 'middle' }}>
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
          Escaleras · Planta alta
        </SectionLabel>

        <div className="bus-body">
          <div className="bus-rows">
            {buildRows(upperCount, lowerCount).map((row, ri) => (
              <SeatRow key={ri} row={row} />
            ))}
          </div>
        </div>
        <div className="bus-back"><span>Parte trasera</span></div>
      </div>
    );
  }

  /* ── 1 PUERTA y 2 PUERTAS ───────────────────────────────────────────────── */
  return (
    <div className="busmap readonly">
      {frontSection}
      <div className="bus-body">
        <div className="bus-rows">
          {bathroomPosition === 'MIDDLE'
            ? <MiddleBathroomSection totalSeats={totalSeats} busType={busType} offset={0} />
            : <BackBathroomSection totalSeats={totalSeats} offset={0} />
          }
        </div>
      </div>
      <div className="bus-back"><span>Parte trasera</span></div>
    </div>
  );
}
