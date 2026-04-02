import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-agentbot.session-token'
    : 'agentbot-session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
}

export async function createUserSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex')
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  })
  return sessionToken
}

export function attachSessionCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions)
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE }
