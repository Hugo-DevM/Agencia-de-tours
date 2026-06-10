'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { translateAuthError } from '@/lib/utils/auth-errors';
import { prisma } from '@/lib/prisma';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '';

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Si ya hay un destino explícito (ej: ?next=/checkout) respetarlo
  if (next) redirect(next);

  // Si es ADMIN, ir al dashboard
  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  redirect(profile?.role === 'ADMIN' ? '/admin' : '/cuenta');
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Supabase sends confirmation email automatically.
  // Redirect to a "check your email" page.
  redirect('/registro/confirmar');
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
