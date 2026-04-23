import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import { getAuthSession } from '@/app/lib/getAuthSession'


const X_AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize'
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
const STATE_COOKIE = 'x_oauth_state'
const VERIFIER_COOKIE = 'x_oauth_verifier'

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.X_API_CLIENT_ID
  const callbackUrl = process.env.X_API_CALLBACK_URL
  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'X OAuth not configured on server' }, { status: 500 })
  }

  const state = base64url(randomBytes(24))
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const jar = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  }
  jar.set(STATE_COOKIE, state, cookieOpts)
  jar.set(VERIFIER_COOKIE, verifier, cookieOpts)

  return NextResponse.redirect(`${X_AUTHORIZE_URL}?${params.toString()}`)
}
