import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

// Map execution_type to a human-readable action name
function mapAction(executionType: string): string {
  const map: Record<string, string> = {
    chat: 'agent.chat',
    tool: 'tool.execute',
    workflow: 'workflow.run',
    provision: 'agent.provision',
    deploy: 'agent.deploy',
    scheduled: 'task.scheduled',
    webhook: 'intake.webhook',
    cron: 'task.cron',
    intake: 'intake.signed',
  }
  return map[executionType] || executionType
}

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await prisma.execution_logs.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        agent_id: true,
        execution_type: true,
        success: true,
        duration_ms: true,
        created_at: true,
      },
    })

    const entries = logs.map((log) => ({
      timestamp: (log.created_at || new Date()).toISOString(),
      agent: log.agent_id || 'system',
      action: mapAction(log.execution_type),
      status: log.success ? 'ok' : 'error',
      duration_ms: log.duration_ms ?? 0,
    }))

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Audit tail error:', error)
    return NextResponse.json({ entries: [] })
  }
}
