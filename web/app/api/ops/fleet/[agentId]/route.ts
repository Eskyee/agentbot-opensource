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

    // Fetch real container metrics for this agent
    const latestMetrics = await prisma.container_metrics.findFirst({
      where: { container_name: agent.name ?? '' },
      orderBy: { sampled_at: 'desc' },
      select: { cpu_percent: true, mem_percent: true },
    })

    // Fetch recent execution logs
    const recentRuns = await prisma.execution_logs.findMany({
      where: { agent_id: agent.id },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        execution_type: true,
        success: true,
        duration_ms: true,
        created_at: true,
      },
    })

    // Fetch cost data from model_metrics
    const costResult = await prisma.model_metrics.aggregate({
      where: { agent_id: parseInt(agent.id, 10) || undefined },
      _sum: { cost_usdc: true },
      _count: { id: true },
    })

    const cpu = latestMetrics ? Number(latestMetrics.cpu_percent ?? 0) : 0
    const mem = latestMetrics ? Number(latestMetrics.mem_percent ?? 0) : 0

    const node = {
      id: agent.name || agent.id.slice(0, 12),
      did: `did:key:${agent.id.slice(0, 16)}…${agent.id.slice(-4)}`,
      status: agent.status,
      region,
      task,
      cpu,
      mem,
      p50: 0,
      model: agent.model || 'mimo-v2-pro',
    }

    const identity = {
      did: node.did,
      algo: 'ed25519',
      issued: agent.createdAt.toISOString(),
      lastSig: isRunning ? 'just now' : 'n/a',
      guard: 'SignatureGuard',
      rotation: { inDays: 14, auto: true },
      facts: { count: costResult._count.id, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
      totalCostUsdc: costResult._sum.cost_usdc ? Number(costResult._sum.cost_usdc) : 0,
    }

    const skills = (agent.installedSkills || []).map((s) => ({
      name: s.skillId,
      version: 'v1.0.0',
      type: 'exec',
      calls24h: 0,
    }))

    const mappedRuns = recentRuns.map((r) => ({
      id: r.id,
      action: r.execution_type,
      status: r.success ? 'ok' : 'error',
      duration_ms: r.duration_ms ?? 0,
      timestamp: (r.created_at || new Date()).toISOString(),
    }))

    return NextResponse.json({ node, identity, skills, recentRuns: mappedRuns })
  } catch (error) {
    console.error('Agent detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent detail' }, { status: 500 })
  }
}
