import type { Metadata } from 'next';
import Link from 'next/link';
import RegistroForm from './RegistroForm';

export const metadata: Metadata = { title: 'Crear cuenta' };

const MapPinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </svg>
);

export default function RegistroPage() {
  return (
    <div className="auth">
      {/* ── Brand panel ── */}
      <div className="auth-brand dest-lagoon">
        <div className="ab-tex" />
        <Link href="/" className="logo on-dark">
          <span className="logo-mark"><MapPinIcon /></span>
          <span className="logo-word">Agencia<span className="t">Tours</span></span>
        </Link>
        <div>
          <span className="eyebrow on-dark">[ Creá tu cuenta gratis ]</span>
          <h2 className="h2" style={{ color: '#fff', marginTop: '14px', maxWidth: '14ch' }}>
            Tu próxima aventura empieza acá.
          </h2>
          <div className="ab-feature">
            <div className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18v-6a3 3 0 0 1 3-3h4v9M4 18h16M11 9h6a3 3 0 0 1 3 3v6"/>
              </svg>
            </div>
            <div>
              <div className="ft">Elegí tu asiento</div>
              <div className="fs">Mapa del autobús en tiempo real.</div>
            </div>
          </div>
          <div className="ab-feature">
            <div className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div>
              <div className="ft">Pagá seguro</div>
              <div className="fs">Tarjeta u OXXO, como prefieras.</div>
            </div>
          </div>
          <div className="ab-feature">
            <div className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div className="ft">Pase QR al instante</div>
              <div className="fs">Sin imprimir nada.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-wrap">
        <div className="auth-card">
          <Link href="/" className="logo">
            <span className="logo-mark"><MapPinIcon /></span>
            <span className="logo-word">Agencia<span className="t">Tours</span></span>
          </Link>

          <h1 className="h2" style={{ textAlign: 'center' }}>Creá tu cuenta.</h1>
          <p className="muted" style={{ textAlign: 'center', margin: '8px 0 26px' }}>
            Tardás menos de un minuto.
          </p>

          <RegistroForm />

          <p className="auth-foot">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
