import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s-12) var(--pad-x)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '42ch' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(64px,12vw,120px)',
            fontWeight: 700,
            color: 'var(--blue-100)',
            lineHeight: 1,
            margin: '0 0 var(--s-6)',
          }}>
            404
          </p>
          <h1 className="h2" style={{ marginBottom: 'var(--s-4)' }}>Página no encontrada</h1>
          <p className="muted" style={{ marginBottom: 'var(--s-8)' }}>
            La página que buscas no existe o fue movida.
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-blue">Ir al inicio</Link>
            <Link href="/viajes" className="btn btn-ghost">Ver viajes</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
