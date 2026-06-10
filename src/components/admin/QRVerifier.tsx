'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';

type VerifyResult = {
  valid: boolean;
  status: string;
  passengerName: string;
  email: string;
  tripTitle: string;
  destination: string;
  departureDate: string;
  seats: string;
  bookingId: string;
  isPast: boolean;
  error?: string;
};

export function QRVerifier() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);

  const [result,    setResult]    = useState<VerifyResult | null>(null);
  const [scanning,  setScanning]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [manualId,  setManualId]  = useState('');
  const [cameraOn,  setCameraOn]  = useState(false);

  const verify = useCallback(async (bookingId: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/verify-qr?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json() as VerifyResult;
      setResult(data);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const extractBookingId = useCallback((raw: string): string | null => {
    // URL format: https://domain.com/validar/BOOKING_ID
    const match = raw.match(/\/validar\/([a-z0-9]+)/i);
    if (match) return match[1];
    // Plain booking ID (cuid2 format)
    if (/^[a-z0-9]{20,}$/i.test(raw.trim())) return raw.trim();
    return null;
  }, []);

  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code?.data) {
      const id = extractBookingId(code.data);
      if (id) {
        setScanning(false);
        stopCamera();
        verify(id);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [extractBookingId, verify]);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }, [tick]);

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setScanning(false);
  }

  useEffect(() => () => stopCamera(), []);

  function handleReset() {
    setResult(null);
    setError(null);
    setManualId('');
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractBookingId(manualId) ?? manualId.trim();
    if (id) verify(id);
  }

  const isValid = result?.valid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)', maxWidth: 520, margin: '0 auto' }}>

      {/* Result card */}
      {result && (
        <div style={{
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          border: `2px solid ${isValid ? '#16a34a' : '#DC2626'}`,
          boxShadow: isValid ? '0 0 0 4px rgba(22,163,74,.12)' : '0 0 0 4px rgba(220,38,38,.1)',
        }}>
          {/* Header */}
          <div style={{
            background: isValid ? '#DCFCE7' : '#FEE2E2',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: isValid ? '#16a34a' : '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isValid ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              )}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: isValid ? '#15803D' : '#B91C1C', margin: 0 }}>
                {isValid ? 'Boleto válido' : result.error ? 'Error' : 'Boleto inválido'}
              </p>
              <p style={{ fontSize: 13, color: isValid ? '#166534' : '#991B1B', margin: '2px 0 0' }}>
                {result.error ?? (isValid ? 'Pasajero autorizado para abordar' : `Estado: ${result.status}`)}
              </p>
            </div>
          </div>

          {/* Details */}
          {!result.error && (
            <div className="form-card" style={{ borderRadius: 0, border: 'none' }}>
              {[
                { label: 'Pasajero',  value: result.passengerName },
                { label: 'Correo',    value: result.email },
                { label: 'Viaje',     value: result.tripTitle },
                { label: 'Destino',   value: result.destination },
                { label: 'Salida',    value: result.departureDate },
                { label: 'Asientos',  value: result.seats, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? 'var(--blue-600, #2563eb)' : 'var(--ink)', textAlign: 'right', maxWidth: 260 }}>
                    {value}
                  </span>
                </div>
              ))}

              {result.isPast && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600 }}>
                  ⚠️ Este viaje ya fue realizado
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scan again / Reset */}
      {result && (
        <button
          onClick={handleReset}
          className="btn btn-ghost btn-block"
          style={{ textAlign: 'center' }}
        >
          Escanear otro boleto
        </button>
      )}

      {!result && (
        <>
          {/* Camera viewfinder */}
          <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', background: '#0F172A', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Overlay when camera is off */}
              {!cameraOn && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
                    Cámara inactiva
                  </p>
                </div>
              )}

              {/* Scanning frame */}
              {scanning && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 200, height: 200, position: 'relative' }}>
                    {/* Corner marks */}
                    {[
                      { top: 0,    left: 0,    borderTop: '3px solid #F97316', borderLeft: '3px solid #F97316' },
                      { top: 0,    right: 0,   borderTop: '3px solid #F97316', borderRight: '3px solid #F97316' },
                      { bottom: 0, left: 0,    borderBottom: '3px solid #F97316', borderLeft: '3px solid #F97316' },
                      { bottom: 0, right: 0,   borderBottom: '3px solid #F97316', borderRight: '3px solid #F97316' },
                    ].map((s, i) => (
                      <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
                    ))}
                    {/* Scan line animation */}
                    <div style={{
                      position: 'absolute', left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, transparent, #F97316, transparent)',
                      animation: 'scanline 1.8s ease-in-out infinite',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div style={{ padding: 'var(--s-4)', display: 'flex', gap: 10 }}>
              {!cameraOn ? (
                <button onClick={startCamera} className="btn btn-primary btn-block" style={{ textAlign: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  Activar cámara
                </button>
              ) : (
                <button onClick={stopCamera} className="btn btn-ghost btn-block" style={{ textAlign: 'center' }}>
                  Detener cámara
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-muted)', fontSize: 14 }}>
              Verificando boleto…
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Manual input */}
          <div className="form-card">
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)', margin: '0 0 var(--s-3)', letterSpacing: '0.04em' }}>
              O ingresa el ID manualmente
            </p>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10 }}>
              <input
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="ID de reservación o URL del QR"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid var(--border)', fontSize: 13,
                  fontFamily: 'var(--font-mono)', outline: 'none',
                  color: 'var(--ink)',
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={!manualId.trim() || loading}>
                Verificar
              </button>
            </form>
          </div>
        </>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 10px; }
          50%  { top: 180px; }
          100% { top: 10px; }
        }
      `}</style>
    </div>
  );
}
