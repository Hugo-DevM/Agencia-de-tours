import Link from 'next/link';

export default function ConfirmarPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--canvas)',
      padding: 'var(--s-6)',
    }}>
      <div className="card card-pad" style={{
        width: 'min(420px, 100%)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-4)',
        padding: 'var(--s-12) var(--s-8)',
      }}>
        {/* Icono */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'var(--blue-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--s-2)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--blue-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <h1 className="h3">Revisá tu correo</h1>

        <p className="muted" style={{ maxWidth: '30ch', margin: '0 auto' }}>
          Te enviamos un enlace de confirmación. Hacé clic en él para activar tu cuenta.
        </p>

        <p className="subtle" style={{ fontSize: 'var(--fs-13)' }}>
          Si no lo ves, revisá tu carpeta de spam.
        </p>

        <Link
          href="/login"
          className="btn btn-blue"
          style={{ marginTop: 'var(--s-2)' }}
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
