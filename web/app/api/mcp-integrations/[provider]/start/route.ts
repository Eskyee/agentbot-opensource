import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { buildOAuthStartUrl } from '@/app/lib/mcp-integrations'

export const runtime = 'nodejs'

const STATE_COOKIE_PREFIX = 'mcp_'

function stateCookieName(provider: string) {
  return `${STATE_COOKIE_PREFIX}${provider}_state`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider } = await params
  const validProviders = ['slack', 'github', 'linear', 'sentry', 'datadog', 'notion', 'jira', 'figma']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const state = randomBytes(24).toString('hex')
  const jar = await cookies()
  jar.set(stateCookieName(provider), state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })

  const url = buildOAuthStartUrl(provider as any, state)
  if (!url) {
    return NextResponse.json(
      { error: `${provider} OAuth not configured on server. Set the required env vars.` },
      { status: 500 },
    )
  }

  return NextResponse.json({ url })
}
