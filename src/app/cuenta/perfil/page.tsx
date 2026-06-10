import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';

export default async function PerfilPage() {
  const user = await getAuthenticatedUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, phone: true, createdAt: true },
  });

  return (
    <div className="cuenta-content">
      <div className="cuenta-page-head">
        <h1 className="h3">Mi perfil</h1>
      </div>

      <div className="form-card" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
          <div>
            <p className="booking-detail-label">Nombre completo</p>
            <p className="booking-detail-val">{profile?.fullName ?? '—'}</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div>
            <p className="booking-detail-label">Correo electrónico</p>
            <p className="booking-detail-val">{profile?.email}</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div>
            <p className="booking-detail-label">Teléfono</p>
            <p className="booking-detail-val">{profile?.phone ?? '—'}</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div>
            <p className="booking-detail-label">Miembro desde</p>
            <p className="booking-detail-val">
              {profile?.createdAt
                ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(profile.createdAt)
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
