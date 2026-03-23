import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get('agentbot-session')?.value;

  if (sessionToken) {
    try {
      await prisma.session.deleteMany({ where: { sessionToken } });
    } catch (error) {
      console.error('Signout error:', error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('agentbot-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
