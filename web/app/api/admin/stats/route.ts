import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys';
import { prisma } from '@/app/lib/prisma';


function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    // Use ADMIN_EMAILS env var — role field is not exposed in JWT/session
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const BACKEND_API_URL = getBackendApiUrl();
    const INTERNAL_API_KEY = getInternalApiKey();

    let backendStatus = 'DOWN'
    let instances: any[] = []
    let instanceCount = 0
    
    // Check backend health
    try {
      const healthRes = await fetch(`${BACKEND_API_URL}/health`, { signal: AbortSignal.timeout(5000) })
      if (healthRes.ok) backendStatus = 'OK'
    } catch {}

    // Get agents from our database as the source of truth
    const [prismaUserCount, prismaAgentCount, runningAgents, activeAgents] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'running' } }),
      prisma.agent.count({ where: { status: { in: ['running', 'active'] } } }),
    ])

    // Build instance list from database agents
    const dbAgents = await prisma.agent.findMany({
      select: { id: true, name: true, status: true, model: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    instances = dbAgents.map(a => ({
      agentId: a.id,
      name: a.name,
      status: a.status,
      model: a.model,
      createdAt: a.createdAt,
      source: 'database',
    }))
    instanceCount = runningAgents

    // Build activity feed
    const activities: Array<{type: string; message: string; timestamp: string; status?: string}> = []
    for (const agent of dbAgents.slice(0, 5)) {
      activities.push({
        type: 'agent_created',
        message: `Agent "${agent.name}" (${agent.status})`,
        timestamp: agent.createdAt.toISOString(),
        status: agent.status,
      })
    }
    const recentExecs = await prisma.execution_logs.findMany({
      take: 5, orderBy: { created_at: 'desc' },
      select: { execution_type: true, success: true, duration_ms: true, created_at: true },
    }).catch(() => [])
    for (const exec of recentExecs) {
      activities.push({
        type: 'execution',
        message: `${exec.execution_type} ${exec.success ? 'ok' : 'error'} (${exec.duration_ms || 0}ms)`,
        timestamp: exec.created_at?.toISOString() || new Date().toISOString(),
        status: exec.success ? 'ok' : 'error',
      })
    }
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      instances,
      count: instanceCount,
      userBase: prismaUserCount,
      totalAgents: prismaAgentCount,
      backendStatus,
      timestamp: new Date().toISOString(),
      activities: [],
    })
  } catch (error: any) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform stats', instances: [], count: 0 },
      { status: 500 }
    )
  }
}
