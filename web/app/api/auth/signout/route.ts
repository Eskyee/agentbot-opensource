import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { clearSessionCookies, getSessionTokenFromCookies } from '@/app/lib/session';

export async function POST(req: NextRequest) {
  const sessionToken = getSessionTokenFromCookies(req.cookies);

  if (sessionToken) {
    try {
      await prisma.session.deleteMany({ where: { sessionToken } });
    } catch (error) {
      console.error('Signout error:', error);
    }
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  // Clear NextAuth cookies to prevent stale JWT sessions
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set('next-auth.session-token', '', cookieOpts);
  response.cookies.set('__Secure-next-auth.session-token', '', cookieOpts);
  response.cookies.set('next-auth.callback-url', '', { ...cookieOpts, httpOnly: false });
  response.cookies.set('__Secure-next-auth.callback-url', '', { ...cookieOpts, httpOnly: false });
  response.cookies.set('next-auth.csrf-token', '', cookieOpts);
  response.cookies.set('__Host-next-auth.csrf-token', '', cookieOpts);
  return response;
}
