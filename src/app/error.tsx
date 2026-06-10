'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: '#F4F6FA',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FEE2E2', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>
          Algo salió mal
        </h1>
        <p style={{ color: '#64748B', marginBottom: 32, lineHeight: 1.6 }}>
          Ocurrió un error inesperado. Puedes intentar recargar la página.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px', borderRadius: 999, border: 'none',
              background: '#1E3A8A', color: '#fff', cursor: 'pointer',
              fontWeight: 600, fontSize: 15,
            }}
          >
            Reintentar
          </button>
          <Link
            href="/"
            style={{
              padding: '12px 24px', borderRadius: 999,
              border: '1.5px solid #CBD5E1', color: '#0F172A',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
