import Link from 'next/link';

const MapPinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </svg>
);

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <span className="logo on-dark">
              <span className="logo-mark"><MapPinIcon /></span>
              <span className="logo-word">Agencia<span className="t">Tours</span></span>
            </span>
            <p className="muted" style={{ color: 'var(--on-dark-muted)', marginTop: '16px', maxWidth: '34ch' }}>
              Viajes en grupo por México, con la libertad de elegir tu propio asiento. Reservá en minutos.
            </p>
          </div>

          <div>
            <h5>Navegación</h5>
            <Link href="/">Inicio</Link>
            <Link href="/viajes">Viajes</Link>
            <Link href="/cuenta">Mi cuenta</Link>
            <Link href="/login">Iniciar sesión</Link>
          </div>

          <div>
            <h5>Contacto</h5>
            <a href="mailto:hola@agenciatours.mx">hola@agenciatours.mx</a>
            <a href="tel:+525512345678">+52 55 1234 5678</a>
            <span style={{ display: 'block', padding: '5px 0', fontSize: 'var(--fs-15)' }}>CDMX, México</span>
          </div>

          <div>
            <h5>Síguenos</h5>
            <div className="footer-social">
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="3.6"/>
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h-3a4 4 0 0 0-4 4v3H5v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/>
                </svg>
              </a>
              <a href="#" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4c.5 2.5 2 4 4.5 4.3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="mono" style={{ fontSize: '12px', color: 'var(--on-dark-muted)' }}>
          © 2025 AgenciaTours · Hecho en México
        </span>
        <span className="mono" style={{ fontSize: '12px', color: 'var(--on-dark-muted)' }}>
          Términos · Privacidad
        </span>
      </div>
    </footer>
  );
}
