'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BookingQRProps {
  data: string;
}

export function BookingQR({ data }: BookingQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width: 220,
      margin: 2,
      color: {
        dark: '#0F1F4B',
        light: '#FFFFFF',
      },
    });
  }, [data]);

  return (
    <div style={{ display: 'inline-flex', padding: 12, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
