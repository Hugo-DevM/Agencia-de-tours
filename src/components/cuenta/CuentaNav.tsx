'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/cuenta/reservaciones', label: 'Reservaciones' },
  { href: '/cuenta/favoritos',     label: 'Favoritos' },
  { href: '/cuenta/perfil',        label: 'Datos personales' },
];

export function CuentaTabs() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
      {tabs.map(t => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: '12px 16px',
              fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? '#0F172A' : '#64748b',
              textDecoration: 'none',
              borderBottom: active ? '2px solid #F97316' : '2px solid transparent',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
