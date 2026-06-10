import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Handles two Supabase Auth callback flows:
 *
 * 1. PKCE  (?code=xxx)       — from same device (magic links, OAuth)
 * 2. OTP   (?token_hash=xxx) — from email links (cross-device compatible)
 *
 * After verification, redirects to ?next= param or /cuenta by default.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'email' | null;
  const next = searchParams.get('next') ?? '/cuenta';

  const supabase = await createServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=auth_failed`, request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=auth_failed`, request.url));
    }
  } else {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
