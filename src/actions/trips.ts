'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export interface TripInput {
  title: string;
  destination: string;
  description: string;
  itinerary: { day: number; title: string }[];
  coverImage: string;
  gallery: string[];
  departureDate: string;
  returnDate: string;
  pricePerSeat: string;
  totalSeats: number;
  busType: 'SINGLE_DOOR' | 'DOUBLE_DOOR' | 'DOUBLE_DECKER';
  bathroomPosition: 'MIDDLE' | 'BACK';
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'CANCELLED';
  // Apartado settings
  minimumDeposit:       string | null; // null = apartado disabled
  depositDeadlineHours: number;
  maxReservedPercent:   number;
}

async function generateSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || `viaje-${Date.now()}`;
  const existing = await prisma.trip.findUnique({ where: { slug: base } });
  if (!existing || existing.id === excludeId) return base;
  return `${base}-${Date.now()}`;
}

export async function createTrip(data: TripInput) {
  const slug = await generateSlug(data.title);

  await prisma.trip.create({
    data: {
      slug,
      title: data.title,
      destination: data.destination,
      description: data.description,
      itinerary: data.itinerary,
      coverImage: data.coverImage,
      gallery: data.gallery,
      departureDate: data.departureDate ? new Date(data.departureDate) : new Date(),
      returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
      pricePerSeat: parseFloat(data.pricePerSeat),
      totalSeats: data.totalSeats,
      busType: data.busType,
      bathroomPosition: data.bathroomPosition,
      category: data.category || null,
      status: data.status,
      minimumDeposit:       data.minimumDeposit ? parseFloat(data.minimumDeposit) : null,
      depositDeadlineHours: data.depositDeadlineHours,
      maxReservedPercent:   data.maxReservedPercent,
    },
  });

  revalidatePath('/admin/viajes');
  redirect('/admin/viajes');
}

export async function updateTrip(id: string, data: TripInput) {
  const current = await prisma.trip.findUnique({ where: { id }, select: { slug: true } });
  const slug = (!current?.slug) ? await generateSlug(data.title, id) : current.slug;

  await prisma.trip.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      destination: data.destination,
      description: data.description,
      itinerary: data.itinerary,
      coverImage: data.coverImage,
      gallery: data.gallery,
      departureDate: data.departureDate ? new Date(data.departureDate) : new Date(),
      returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
      pricePerSeat: parseFloat(data.pricePerSeat),
      totalSeats: data.totalSeats,
      busType: data.busType,
      bathroomPosition: data.bathroomPosition,
      category: data.category || null,
      status: data.status,
      minimumDeposit:       data.minimumDeposit ? parseFloat(data.minimumDeposit) : null,
      depositDeadlineHours: data.depositDeadlineHours,
      maxReservedPercent:   data.maxReservedPercent,
    },
  });

  revalidatePath('/admin/viajes');
  revalidatePath(`/admin/viajes/${id}`);
  redirect('/admin/viajes');
}

export async function deleteTrip(id: string) {
  await prisma.trip.delete({ where: { id } });
  revalidatePath('/admin/viajes');
}
