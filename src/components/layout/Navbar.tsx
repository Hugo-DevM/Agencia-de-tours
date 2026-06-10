import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { MobileDrawer } from './MobileDrawer';

const MapPinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </svg>
);

const navLinks = [
  { href: '/',             label: 'Inicio' },
  { href: '/viajes',       label: 'Viajes' },
  { href: '/#como',        label: 'Cómo funciona' },
  { href: '/#testimonios', label: 'Testimonios' },
];

export async function Navbar() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let isAdmin = false;
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    isAdmin = profile?.role === 'ADMIN';
  }

  const accountHref = isAdmin ? '/admin' : '/cuenta';

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo" aria-label="AgenciaTours inicio">
            <span className="logo-mark"><MapPinIcon /></span>
            <span className="logo-word">Agencia<span className="t">Tours</span></span>
          </Link>

          <nav className="nav-links" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            {isLoggedIn ? (
              <Link href={accountHref} className="nav-link desktop-only">
                {isAdmin ? 'Administración' : 'Mi cuenta'}
              </Link>
            ) : (
              <Link href="/login" className="nav-link desktop-only">
                Iniciar sesión
              </Link>
            )}
            <Link href="/viajes" className="btn btn-primary btn-sm desktop-only">
              Ver viajes <span className="arrow">→</span>
            </Link>
            <MobileDrawer isLoggedIn={isLoggedIn} accountHref={accountHref} accountLabel={isAdmin ? 'Administración' : 'Mi cuenta'} />
          </div>
        </div>
      </header>
    </>
  );
}
