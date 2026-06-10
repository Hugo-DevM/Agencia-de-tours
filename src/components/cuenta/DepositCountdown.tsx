'use client';

import { useEffect, useState } from 'react';

interface Props {
  expiresAt: string; // ISO string
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

export function DepositCountdown({ expiresAt }: Props) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecs(diff);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (secs === null) return null;

  if (secs === 0) {
    return (
      <span style={{ color: '#DC2626', fontWeight: 700 }}>Vencido</span>
    );
  }

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const isWarn = secs < 2 * 3600; // menos de 2h

  return (
    <span style={{
      fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
      color: isWarn ? '#DC2626' : '#EA580C',
    }}>
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </span>
  );
}
