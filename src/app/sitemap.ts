import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://viajesbus.mx';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await prisma.trip.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/viajes`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/login`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/registro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const tripPages: MetadataRoute.Sitemap = trips.map(t => ({
    url:             `${BASE}/viajes/${t.slug}`,
    lastModified:    t.updatedAt,
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  return [...staticPages, ...tripPages];
}
