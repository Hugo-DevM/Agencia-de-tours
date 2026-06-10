'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BookingQRProps {
  data: string;
  size?: number;
}

export function BookingQR({ data, size = 220 }: BookingQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: {
        dark: '#0F1F4B',
        light: '#FFFFFF',
      },
    });
  }, [data, size]);

  return (
    <div style={{ display: 'inline-flex', padding: 8, background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
