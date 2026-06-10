// Server component — readonly bus map for admin view
import React from 'react';

type BusType = 'SINGLE_DOOR' | 'DOUBLE_DOOR' | 'DOUBLE_DECKER';

interface AdminSeatMapProps {
  totalSeats: number;
  busType: BusType;
  confirmedSeats: number[];
  reservedSeats: number[];
  pendingSeats: number[];
  lockedSeats: number[];
}

const SEATS_PER_ROW = 4;

function buildRows(count: number, offset = 0): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += SEATS_PER_ROW) {
    rows.push(Array.from({ length: Math.min(SEATS_PER_ROW, count - i) }, (_, j) => offset + i + j + 1));
  }
  return rows;
}

function getLowerCount(totalSeats: number): number {
  // Split evenly — lower floor gets half (rounded up to nearest full row)
  const half = Math.ceil(totalSeats / 2);
  return Math.ceil(half / SEATS_PER_ROW) * SEATS_PER_ROW;
}

type AdminSeatState = 'free' | 'confirmed' | 'reserved' | 'pending' | 'locked';

const STATE_CLASS: Record<AdminSeatState, string> = {
  free:      'seat seat--free',
  confirmed: 'seat seat--confirmed',
  reserved:  'seat seat--reserved',
  pending:   'seat seat--pending',
  locked:    'seat seat--locked',
};

const STATE_TITLE: Record<AdminSeatState, string> = {
  free:      'Disponible',
  confirmed: 'Confirmado',
  reserved:  'Apartado',
  pending:   'Pago pendiente',
  locked:    'Bloqueado (temp.)',
};

function DriverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
      <path d="M12 9V3M9.5 14.5l-5 3M14.5 14.5l5 3"/>
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  );
}

function SeatRowReadonly({ row, ri, getSeatState }: {
  row: number[]; ri: number;
  getSeatState: (n: number) => AdminSeatState;
}) {
  const left  = row.slice(0, 2);
  const right = row.slice(2);
  return (
    <div className="bus-row">
      <span className="row-no">{ri + 1}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}>
        <div className="seat-group">
          {left.map(num => (
            <div key={num} className={STATE_CLASS[getSeatState(num)]} title={`Asiento ${num} — ${STATE_TITLE[getSeatState(num)]}`}>
              <span className="num">{num}</span>
            </div>
          ))}
        </div>
        <div className="bus-aisle"><span>Pasillo</span></div>
        <div className="seat-group">
          {right.map(num => (
            <div key={num} className={STATE_CLASS[getSeatState(num)]} title={`Asiento ${num} — ${STATE_TITLE[getSeatState(num)]}`}>
              <span className="num">{num}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SingleBus({ rows, label, getSeatState, showSecondDoor = false, midRow = -1 }: {
  rows: number[][];
  label?: string;
  getSeatState: (n: number) => AdminSeatState;
  showSecondDoor?: boolean;
  midRow?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#fff', background: '#1E3A8A', padding: '4px 16px', borderRadius: 999,
        }}>
          {label}
        </div>
      )}
      <div className="busmap readonly">
        <div className="bus-front">
          <div className="bus-driver">
            <div className="driver-seat"><DriverIcon /></div>
            <span className="bus-cap">Conductor</span>
          </div>
          <div className="bus-door">
            <div className="door-mark"><DoorIcon /></div>
            <span className="bus-cap">Puerta</span>
          </div>
        </div>
        <div className="bus-body">
          <div className="bus-rows">
            {rows.map((row, ri) => (
              <React.Fragment key={ri}>
                {showSecondDoor && ri === midRow && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, padding: '3px 0', color: 'var(--orange-500)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderTop: '1px dashed var(--orange-200)', borderBottom: '1px dashed var(--orange-200)', margin: '2px 0' }}>
                    <DoorIcon />
                    Segunda puerta
                  </div>
                )}
                <SeatRowReadonly row={row} ri={ri} getSeatState={getSeatState} />
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="bus-back"><span>Parte trasera</span></div>
      </div>
    </div>
  );
}

export function AdminSeatMap({ totalSeats, busType, confirmedSeats, reservedSeats, pendingSeats, lockedSeats }: AdminSeatMapProps) {
  function getSeatState(num: number): AdminSeatState {
    if (confirmedSeats.includes(num)) return 'confirmed';
    if (reservedSeats.includes(num))  return 'reserved';
    if (lockedSeats.includes(num))    return 'locked';
    if (pendingSeats.includes(num))   return 'pending';
    return 'free';
  }

  const isDoubleDecker = busType === 'DOUBLE_DECKER';
  const lowerCount     = getLowerCount(totalSeats);
  const upperCount     = totalSeats - lowerCount;
  const allRows        = buildRows(totalSeats);
  const lowerRows      = isDoubleDecker ? buildRows(lowerCount, 0) : allRows;
  const upperRows      = isDoubleDecker ? buildRows(upperCount, lowerCount) : [];
  const midRow         = busType === 'DOUBLE_DOOR' ? Math.floor(allRows.length / 2) : -1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {isDoubleDecker ? (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <SingleBus rows={lowerRows} label="Planta baja" getSeatState={getSeatState} />
          <SingleBus rows={upperRows} label="Planta alta" getSeatState={getSeatState} />
        </div>
      ) : (
        <SingleBus
          rows={allRows}
          getSeatState={getSeatState}
          showSecondDoor={busType === 'DOUBLE_DOOR'}
          midRow={midRow}
        />
      )}

      {/* Legend */}
      <div className="seat-legend" style={{ marginTop: 'var(--s-5)' }}>
        {([
          ['seat--free',      'Disponible'],
          ['seat--confirmed', 'Confirmado'],
          ['seat--reserved',  'Apartado'],
          ['seat--pending',   'Pago pendiente'],
          ['seat--locked',    'Bloqueado (temp.)'],
        ] as [string, string][]).map(([cls, label]) => (
          <div key={cls} className="legend-item">
            <div className={`legend-swatch ${cls}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
