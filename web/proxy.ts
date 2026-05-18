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

/**
 * Custom session cookies are produced by createUserSession() as
 * `crypto.randomBytes(32).toString('hex')` — exactly 64 lowercase hex chars.
 * A malformed value is never a legitimate session, so reject it at the edge
 * instead of forwarding it to server components where getAuthSession() is
 * the authoritative check. This only tightens the gate; it does not replace
 * the server-side lookup.
 */
const CUSTOM_SESSION_COOKIE_RE = /^[a-f0-9]{64}$/;

/**
 * NextAuth JWTs are dot-separated base64url segments (header.payload.signature,
 * or 5 segments for JWE). Reject obvious garbage like "x" or "foo".
 */
const NEXTAUTH_JWT_RE = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+){2,4}$/;

function looksLikeCustomSessionToken(value: string | undefined): boolean {
  return !!value && CUSTOM_SESSION_COOKIE_RE.test(value);
}

function looksLikeNextAuthToken(value: string | undefined): boolean {
  if (!value) return false;
  // NextAuth JWTs are long — 100+ chars in practice. Short strings are noise.
  if (value.length < 40) return false;
  return NEXTAUTH_JWT_RE.test(value);
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const customToken =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value;
    const hasCustomSession = looksLikeCustomSessionToken(customToken);

    const hasNextAuthSession = NEXTAUTH_SESSION_COOKIE_NAMES.some((name) =>
      looksLikeNextAuthToken(request.cookies.get(name)?.value)
    );

    if (!hasCustomSession && !hasNextAuthSession) {
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
