'use client';

import { useState } from 'react';
import Link from 'next/link';

const MapPinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </svg>
);

const navLinks = [
  { href: '/',           label: 'Inicio' },
  { href: '/viajes',     label: 'Viajes' },
  { href: '/#como',      label: 'Cómo funciona' },
  { href: '/#testimonios', label: 'Testimonios' },
];

export function MobileDrawer({ isLoggedIn, accountHref = '/cuenta', accountLabel = 'Mi cuenta' }: { isLoggedIn: boolean; accountHref?: string; accountLabel?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn-icon nav-burger"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
      </button>

      <div className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-scrim" onClick={() => setOpen(false)} />
        <div className="drawer-panel">
          <div className="drawer-head">
            <span className="logo">
              <span className="logo-mark"><MapPinIcon /></span>
              <span className="logo-word">Agencia<span className="t">Tours</span></span>
            </span>
            <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="nav-link" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <Link href={accountHref} className="nav-link" onClick={() => setOpen(false)}>{accountLabel}</Link>
          ) : (
            <Link href="/login" className="nav-link" onClick={() => setOpen(false)}>Iniciar sesión</Link>
          )}

          <Link href="/viajes" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => setOpen(false)}>
            Ver viajes →
          </Link>
        </div>
      </div>
    </>
  );
}
