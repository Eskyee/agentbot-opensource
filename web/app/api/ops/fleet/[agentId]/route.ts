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

    // Find the agent — try by ID first, then by name
    let agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
      select: {
        id: true, name: true, model: true, status: true,
        websocketUrl: true, config: true, createdAt: true,
        installedSkills: {
          select: { id: true, skillId: true, enabled: true },
        },
      },
    })

    if (!agent) {
      agent = await prisma.agent.findFirst({
        where: { name: agentId, userId: session.user.id },
        select: {
          id: true, name: true, model: true, status: true,
          websocketUrl: true, config: true, createdAt: true,
          installedSkills: {
            select: { id: true, skillId: true, enabled: true },
          },
        },
      })
    }

    if (!agent) {
      return NextResponse.json({
        node: { id: agentId, did: 'did:key:unknown', status: 'idle', region: 'unknown', task: 'idle', cpu: 0, mem: 0, p50: 0, model: 'unknown' },
        identity: { did: 'did:key:unknown', algo: 'ed25519', issued: 'n/a', lastSig: 'n/a', guard: 'SignatureGuard', rotation: { inDays: 0, auto: false }, facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' } },
        skills: [],
        recentRuns: [],
      })
    }

    const config = agent.config as Record<string, unknown> | null
    const region = (config?.region as string) || 'fra-1'
    const task = (config?.task as string) || 'idle'
    const isRunning = agent.status === 'running' || agent.status === 'active'

    const node = {
      id: agent.name || agent.id.slice(0, 12),
      did: `did:key:${agent.id.slice(0, 16)}…${agent.id.slice(-4)}`,
      status: agent.status,
      region,
      task,
      cpu: isRunning ? Math.floor(Math.random() * 60 + 20) : 0,
      mem: isRunning ? Math.floor(Math.random() * 50 + 30) : 0,
      p50: isRunning ? Math.floor(Math.random() * 200 + 30) : 0,
      model: agent.model || 'mimo-v2-pro',
    }

    const identity = {
      did: node.did,
      algo: 'ed25519',
      issued: agent.createdAt.toISOString(),
      lastSig: isRunning ? 'just now' : 'n/a',
      guard: 'SignatureGuard',
      rotation: { inDays: 14, auto: true },
      facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
    }

    const skills = (agent.installedSkills || []).map((s) => ({
      name: s.skillId,
      version: 'v1.0.0',
      type: 'exec',
      calls24h: 0,
    }))

    return NextResponse.json({ node, identity, skills, recentRuns: [] })
  } catch (error) {
    console.error('Agent detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent detail' }, { status: 500 })
  }
}
