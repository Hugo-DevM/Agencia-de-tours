/**
 * Auth helper for protected Server Components and Server Actions.
 * Redirects to /login if the user is not authenticated.
 */
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * Returns the user or null without redirecting.
 * Use in layouts where you want to conditionally show auth state.
 */
export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
