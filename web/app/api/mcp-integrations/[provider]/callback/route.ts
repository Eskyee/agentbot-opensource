import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { saveMcpTokens, PROVIDERS } from '@/app/lib/mcp-integrations'
import { buildAppUrl } from '@/app/lib/app-url'

export const runtime = 'nodejs'

const STATE_COOKIE_PREFIX = 'mcp_'

function stateCookieName(provider: string) {
  return `${STATE_COOKIE_PREFIX}${provider}_state`
}

function redirectBack(provider: string, error?: string) {
  const url = new URL(buildAppUrl('/dashboard/mcp'))
  url.searchParams.set(error ? 'error' : 'connected', error || provider)
  return NextResponse.redirect(url.toString())
}

async function exchangeCode(
  provider: string,
  code: string,
  codeVerifier?: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number | undefined; meta?: Record<string, string> }> {
  const config = PROVIDERS[provider as keyof typeof PROVIDERS]
  if (!config) throw new Error('Unknown provider')

  const clientId = process.env[config.envClientId]
  const clientSecret = process.env[config.envClientSecret]
  const callbackUrl = process.env[config.envCallbackUrl]
  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error('Server not configured')
  }

  if (provider === 'github') {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    })
    if (!res.ok) throw new Error('GitHub token exchange failed')
    const data = await res.json()
    if (data.error) throw new Error(data.error_description || data.error)

    const meta: Record<string, string> = {}
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      if (userRes.ok) {
        const user = await userRes.json()
        meta.username = user.login
        meta.name = user.name || ''
      }
    } catch {}

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      meta,
    }
  }

  if (provider === 'slack') {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    })
    if (!res.ok) throw new Error('Slack token exchange failed')
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Slack OAuth failed')

    const meta: Record<string, string> = {}
    if (data.team) meta.team = data.team
    if (data.bot?.user_id) meta.botUserId = data.bot.user_id

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      meta,
    }
  }

  if (provider === 'linear') {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    })
    if (!res.ok) throw new Error('Linear token exchange failed')
    const data = await res.json()
    if (data.error) throw new Error(data.error_description || data.error)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    }
  }

  if (provider === 'notion') {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: callbackUrl }),
    })
    if (!res.ok) throw new Error('Notion token exchange failed')
    const data = await res.json()
    if (data.error) throw new Error(data.error_description || data.error)

    const meta: Record<string, string> = {}
    if (data.workspace_name) meta.workspace = data.workspace_name

    return {
      accessToken: data.access_token,
      refreshToken: undefined,
      expiresAt: undefined,
      meta,
    }
  }

  if (provider === 'jira') {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    })
    if (!res.ok) throw new Error('Jira token exchange failed')
    const data = await res.json()
    if (data.error) throw new Error(data.error_description || data.error)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    }
  }

  // Generic OAuth2 (sentry, datadog, figma)
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }),
  })
  if (!res.ok) throw new Error(`${provider} token exchange failed`)
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.redirect(buildAppUrl('/login'))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const jar = await cookies()
  const expectedState = jar.get(stateCookieName(provider))?.value
  jar.delete(stateCookieName(provider))

  if (oauthError) return redirectBack(provider, oauthError)
  if (!code || !state || state !== expectedState) {
    return redirectBack(provider, 'invalid_state')
  }

  try {
    const tokens = await exchangeCode(provider, code)
    await saveMcpTokens(session.user.id, provider as any, tokens)
    return redirectBack(provider)
  } catch (err: any) {
    console.error(`MCP ${provider} callback error:`, err)
    return redirectBack(provider, err.message || 'callback_error')
  }
}
