import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import {
  connectAgentToGitlawb,
  disconnectAgentFromGitlawb,
  listGitlawbAgentsForUser,
} from '@/app/lib/gitlawb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agents = await listGitlawbAgentsForUser(session.user.id)
  return NextResponse.json({ agents })
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const agentId = typeof body?.agentId === 'string' ? body.agentId : ''
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
  }

  try {
    const gitlawb = await connectAgentToGitlawb(session.user.id, agentId)
    return NextResponse.json({
      success: true,
      message: 'Agent connected to Gitlawb. Identity ready for repo and ref workflows.',
      gitlawb,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect agent to Gitlawb' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const agentId = typeof body?.agentId === 'string' ? body.agentId : ''
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
  }

  try {
    const gitlawb = await disconnectAgentFromGitlawb(session.user.id, agentId)
    return NextResponse.json({
      success: true,
      message: 'Agent disconnected from Gitlawb.',
      gitlawb,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect agent from Gitlawb' },
      { status: 500 }
    )
  }
}
