/**
 * Next.js 16 Proxy (formerly middleware) — runs before every matched request.
 *
 * Responsibilities:
 *  1. Refresh Supabase auth session (prevents stale JWTs)
 *  2. Redirect unauthenticated users away from /admin and /cuenta routes
 *  3. Redirect authenticated users away from /login and /registro
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  // ── Refresh Supabase session ────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens to both request and response so that
          // Server Components AND the browser both see the fresh token.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() triggers token refresh if the access token is near expiry.
  const { data: { user } } = await supabase.auth.getUser();

  // ── Auth guards ──────────────────────────────────────────────────────────

  // Protected: /admin/** → requires authenticated + ADMIN role
  // Role check is done inside the admin layout (server-side Prisma query).
  // Here we only gate unauthenticated users.
  if (pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected: /cuenta/** → requires authenticated customer
  if (pathname.startsWith('/cuenta') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected: /checkout → requires authenticated customer
  if (pathname === '/checkout' && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', '/checkout');
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/registro
  if ((pathname === '/login' || pathname === '/registro') && user) {
    return NextResponse.redirect(new URL('/cuenta', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
