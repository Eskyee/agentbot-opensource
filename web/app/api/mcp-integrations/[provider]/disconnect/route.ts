import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { disconnectMcp } from '@/app/lib/mcp-integrations'

export const runtime = 'nodejs'

export async function POST(
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

  await disconnectMcp(session.user.id, provider as any)
  return NextResponse.json({ ok: true })
}
