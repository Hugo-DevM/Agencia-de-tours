'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function toggleFavorite(
  tripId: string
): Promise<{ favorited: boolean } | { error: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const existing = await prisma.favorite.findUnique({
    where: { profileId_tripId: { profileId: user.id, tripId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath('/cuenta/favoritos');
    revalidatePath('/viajes');
    return { favorited: false };
  } else {
    await prisma.favorite.create({ data: { profileId: user.id, tripId } });
    revalidatePath('/cuenta/favoritos');
    revalidatePath('/viajes');
    return { favorited: true };
  }
}
