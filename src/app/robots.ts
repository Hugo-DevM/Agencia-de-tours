import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://viajesbus.mx';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/viajes', '/viajes/'],
        disallow: ['/admin', '/cuenta', '/checkout', '/api/', '/confirmacion/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
