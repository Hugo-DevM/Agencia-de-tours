import { QRVerifier } from '@/components/admin/QRVerifier';

export const metadata = { title: 'Verificar boletos' };

export default function VerificarPage() {
  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Abordaje</div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            Verificar boletos
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content" style={{ paddingTop: 'var(--s-6)' }}>
        <QRVerifier />
      </div>
    </>
  );
}
