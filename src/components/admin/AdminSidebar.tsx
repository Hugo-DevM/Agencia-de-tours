'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/actions/auth';

interface AdminSidebarProps {
  profile: {
    fullName: string | null;
    email: string;
  };
}

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={`ai${isActive ? ' active' : ''}`}>
      {children}
    </Link>
  );
}

export default function AdminSidebar({ profile }: AdminSidebarProps) {
  const initials = getInitials(profile.fullName, profile.email);

  return (
    <aside className="admin-side">
      {/* Logo */}
      <div style={{ padding: '18px 16px 12px' }}>
        <Link href="/admin" className="logo on-dark" style={{ textDecoration: 'none' }}>
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
              <circle cx="12" cy="10" r="2.4"/>
            </svg>
          </div>
          <span className="logo-word">
            Agencia<span className="t">Tours</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="admin-nav">
        <div className="group-label">Operación</div>

        <NavLink href="/admin" exact>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>
          </svg>
          Dashboard
        </NavLink>

        <NavLink href="/admin/viajes">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 20-6-3V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7"/>
          </svg>
          Viajes
        </NavLink>

        <NavLink href="/admin/reservaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 1 2-2 2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
            <path d="M7 17v2M17 17v2"/>
          </svg>
          Reservaciones
        </NavLink>

        <div className="group-label" style={{ marginTop: 'var(--s-4)' }}>Ajustes</div>

        <NavLink href="/admin/configuracion">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Configuración
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="admin-side-foot">
        <div className="admin-user">
          <div
            className="avatar"
            style={{
              background: 'var(--blue-600)',
              width: 36,
              height: 36,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="info">
            <div className="nm">{profile.fullName ?? profile.email}</div>
            <div className="em">{profile.email}</div>
          </div>
        </div>

        <form action={signOut} style={{ marginTop: 8 }}>
          <button
            type="submit"
            className="ai"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
