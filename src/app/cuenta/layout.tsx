import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import { CuentaTabs } from '@/components/cuenta/CuentaNav';
import { signOut } from '@/actions/auth';

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, createdAt: true, role: true },
  });

  if (profile?.role === 'ADMIN') redirect('/admin');

  const displayName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : (profile?.email?.split('@')[0] ?? 'Viajero');

  const initials = (profile?.fullName ?? profile?.email ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const memberYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <>
      <Navbar />

      {/* ── Dark header ── */}
      <div style={{ background: 'linear-gradient(150deg, #0F1F4B 0%, #0f2357 70%, #162050 100%)', paddingBottom: 0 }}>
        <div className="max-w-7xl mx-auto px-6 pt-7 pb-6">
          {/* Eyebrow */}
          <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#F97316', textTransform: 'uppercase', margin: '0 0 12px' }}>
            <span style={{ color: 'rgba(249,115,22,.45)' }}>[</span>
            {' '}Mi cuenta{' '}
            <span style={{ color: 'rgba(249,115,22,.45)' }}>]</span>
          </p>

          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: '#1E3A8A', border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.3rem,3vw,1.8rem)', margin: 0, lineHeight: 1.1 }}>
                Hola, {displayName}.
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.email} · Miembro desde {memberYear}
              </p>
            </div>

            {/* Sign out */}
            <form action={signOut} style={{ flexShrink: 0 }}>
              <button
                type="submit"
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.65)', borderRadius: 999,
                  padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div className="max-w-7xl mx-auto px-6">
          <CuentaTabs />
        </div>
      </div>

      {/* ── Page content ── */}
      <main style={{ background: '#F8F9FB', minHeight: '60vh' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>

      <Footer />
    </>
  );
}
