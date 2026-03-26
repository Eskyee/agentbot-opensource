/**
 * proxy.ts — Next.js 16 edge auth guard for dashboard routes
 *
 * Uses NextAuth's getToken to verify session at the edge.
 * Dashboard routes are only accessible to authenticated users.
 *
 * ⚠️ LOOP BREAKER (2026-03-26):
 * If getToken() fails but the session cookie is valid (e.g. NEXTAUTH_SECRET
 * mismatch between web frontend and core API), we set a cookie to prevent
 * infinite /dashboard → /login → /dashboard redirects. The login page must
 * NEVER auto-redirect back to /dashboard when session is present — only show
 * a manual link. This broke on 2026-03-25 when NEXTAUTH_SECRET was throwing
 * during Vercel build, causing getToken() to always return null while the
 * core API's session endpoint still returned valid user data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Loop breaker: if we already tried to redirect and the cookie is
      // still present, don't redirect again — let the request through
      // or show an error. This prevents infinite loops when secrets
      // are misaligned between web frontend and core API.
      const alreadyRedirected = request.cookies.get('auth_redirect_attempt');
      if (alreadyRedirected) {
        // Clear the cookie and redirect to login with error flag
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'SessionExpired');
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth_redirect_attempt');
        return response;
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('auth_redirect_attempt', '1', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 10, // Expire after 10 seconds — enough to break the loop
        path: '/',
      });
      return response;
    }

    // Token valid — clear any stale redirect cookie
    if (request.cookies.get('auth_redirect_attempt')) {
      const response = NextResponse.next();
      response.cookies.delete('auth_redirect_attempt');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
