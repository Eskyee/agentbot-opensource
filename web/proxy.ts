/**
 * proxy.ts — Next.js 16 edge auth guard for dashboard routes
 *
 * Checks the custom auth cookie (agentbot-session) set by /api/auth/login.
 * Dashboard routes are only accessible to authenticated users.
 */
import { NextRequest, NextResponse } from 'next/server';
import { LEGACY_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/app/lib/session';

const NEXTAUTH_SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const hasCustomSessionCookie =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value;
    const hasNextAuthSessionCookie = NEXTAUTH_SESSION_COOKIE_NAMES.some(
      (name) => !!request.cookies.get(name)?.value
    )

    if (!hasCustomSessionCookie && !hasNextAuthSessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
