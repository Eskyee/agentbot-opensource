/**
 * proxy.ts — Next.js 16 edge auth guard for dashboard routes
 *
 * Checks BOTH auth systems:
 *   1. Custom `agentbot-session` cookie (set by /api/auth/login & /api/auth/google/callback)
 *   2. NextAuth JWT (set by NextAuth providers)
 *
 * If either cookie exists, the user is let through.
 * Full session validation happens server-side in getAuthSession().
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check custom session cookie first (primary auth path)
    const customSession = request.cookies.get('agentbot-session')?.value;
    if (customSession) {
      return NextResponse.next();
    }

    // Fall back to NextAuth JWT
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
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
