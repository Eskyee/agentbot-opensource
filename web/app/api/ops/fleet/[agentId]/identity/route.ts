import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params

  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
      select: { id: true, name: true, status: true, createdAt: true },
    })

    if (!agent) {
      return NextResponse.json({
        did: 'did:key:unknown',
        algo: 'ed25519',
        issued: 'n/a',
        lastSig: 'n/a',
        guard: 'SignatureGuard',
        rotation: { inDays: 0, auto: false },
        facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
      })
    }

    const isRunning = agent.status === 'running' || agent.status === 'active'

    return NextResponse.json({
      did: `did:key:${agent.id.slice(0, 16)}…${agent.id.slice(-4)}`,
      algo: 'ed25519',
      issued: agent.createdAt.toISOString(),
      lastSig: isRunning ? 'just now' : 'n/a',
      guard: 'SignatureGuard',
      rotation: { inDays: 14, auto: true },
      facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
    })
  } catch (error) {
    console.error('Agent identity error:', error)
    return NextResponse.json({ error: 'Failed to fetch identity' }, { status: 500 })
  }
}
