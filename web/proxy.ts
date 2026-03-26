/**
 * proxy.ts — Next.js 16 edge auth guard for dashboard routes
 *
 * Checks the custom auth cookie (agentbot-session) set by /api/auth/login.
 * Dashboard routes are only accessible to authenticated users.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionToken = request.cookies.get('agentbot-session')?.value;

    if (!sessionToken) {
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
