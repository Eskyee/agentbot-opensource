/**
 * proxy.ts — Next.js 16 edge auth guard for dashboard routes
 *
 * Uses NextAuth's getToken to verify session at the edge.
 * Dashboard routes are only accessible to authenticated users.
 *
 * ⚠️ See web/🚨 AUTH LOOP WARNING.md before modifying.
 * - Login page must NEVER auto-redirect to /dashboard (loop risk)
 * - getToken() and auth() use different verification paths
 * - Never throw during build for runtime-only env vars
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
