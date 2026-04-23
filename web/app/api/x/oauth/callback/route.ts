import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { saveXAccount } from '@/app/lib/xApi'
import { buildAppUrl } from '@/app/lib/app-url'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'x_oauth_state'
const VERIFIER_COOKIE = 'x_oauth_verifier'
const TOKEN_URL = 'https://api.x.com/2/oauth2/token'
const ME_URL = 'https://api.x.com/2/users/me'

function redirectBack(error?: string) {
  const url = new URL(buildAppUrl('/settings?tab=integrations'))
  url.searchParams.set(error ? 'x_error' : 'x_connected', error || '1')
  return NextResponse.redirect(url.toString())
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.redirect(buildAppUrl('/login'))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const jar = await cookies()
  const expectedState = jar.get(STATE_COOKIE)?.value
  const verifier = jar.get(VERIFIER_COOKIE)?.value
  jar.delete(STATE_COOKIE)
  jar.delete(VERIFIER_COOKIE)

  if (oauthError) return redirectBack(oauthError)
  if (!code || !state || !verifier || state !== expectedState) {
    return redirectBack('invalid_state')
  }

  const clientId = process.env.X_API_CLIENT_ID
  const clientSecret = process.env.X_API_CLIENT_SECRET
  const callbackUrl = process.env.X_API_CALLBACK_URL
  if (!clientId || !clientSecret || !callbackUrl) {
    return redirectBack('server_misconfigured')
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        code_verifier: verifier,
        client_id: clientId,
      }),
    })

    if (!tokenRes.ok) {
      console.error('X token exchange failed:', tokenRes.status, await tokenRes.text())
      return redirectBack('token_exchange_failed')
    }

    const tokenPayload = await tokenRes.json()
    const accessToken = tokenPayload?.access_token as string | undefined
    const refreshToken = (tokenPayload?.refresh_token as string | undefined) || null
    const scope = typeof tokenPayload?.scope === 'string' ? tokenPayload.scope.split(' ') : []
    if (!accessToken) return redirectBack('no_access_token')

    let username: string | null = null
    let accountId: string | null = null
    try {
      const meRes = await fetch(ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (meRes.ok) {
        const me = await meRes.json()
        username = me?.data?.username || null
        accountId = me?.data?.id || null
      }
    } catch (err) {
      console.error('X /users/me lookup failed:', err)
    }

    await saveXAccount(session.user.id, {
      accessToken,
      refreshToken,
      username,
      accountId,
      scopes: scope,
    })

    return redirectBack()
  } catch (err) {
    console.error('X OAuth callback error:', err)
    return redirectBack('callback_error')
  }
}
