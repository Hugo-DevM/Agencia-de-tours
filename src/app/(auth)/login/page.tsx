import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Iniciar sesión' };

const MapPinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/>
    <circle cx="12" cy="10" r="2.4"/>
  </svg>
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Si ya tiene sesión, redirigir según rol
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    redirect(next || (profile?.role === 'ADMIN' ? '/admin' : '/cuenta'));
  }

  return (
    <div className="auth">
      {/* ── Brand panel ── */}
      <div className="auth-brand dest-sunset">
        <div className="ab-tex" />
        <Link href="/" className="logo on-dark">
          <span className="logo-mark"><MapPinIcon /></span>
          <span className="logo-word">Agencia<span className="t">Tours</span></span>
        </Link>
        <div>
          <p className="ab-quote">
            &ldquo;Elegí mi asiento desde el celular y todo fue clarísimo. Así da gusto viajar.&rdquo;
          </p>
          <div className="ab-who">
            <span className="av">MR</span>
            <div>
              <div style={{ fontWeight: 600 }}>Mariana Reyes</div>
              <div className="mono" style={{ fontSize: '12px', color: 'rgba(255,255,255,.75)' }}>
                Viajó a Tulum · 4.9 ★
              </div>
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

          <h1 className="h2" style={{ textAlign: 'center' }}>Iniciá sesión.</h1>
          <p className="muted" style={{ textAlign: 'center', margin: '8px 0 28px' }}>
            Bienvenido de vuelta. Continuá tu próxima aventura.
          </p>

          {error === 'auth_failed' && (
            <div className="badge badge-red" style={{ width: '100%', marginBottom: '16px', padding: '12px 14px', borderRadius: 'var(--r-md)', justifyContent: 'flex-start' }}>
              El enlace de acceso expiró o ya fue usado. Intentá de nuevo.
            </div>
          )}

          <LoginForm next={next} />

          <p className="auth-foot">
            ¿No tenés cuenta?{' '}
            <Link href="/registro">Registrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
