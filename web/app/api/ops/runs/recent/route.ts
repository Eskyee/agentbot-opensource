import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * GET /api/ops/runs/recent
 *
 * Returns recent executions formatted for the audit trail.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 200) : 50

    const logs = await prisma.execution_logs.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        agent_id: true,
        workflow_id: true,
        execution_type: true,
        success: true,
        error_message: true,
        duration_ms: true,
        created_at: true,
      },
    })

    const entries = logs.map((log) => ({
      id: log.id,
      timestamp: (log.created_at || new Date()).toISOString(),
      agentId: log.agent_id || 'system',
      workflowId: log.workflow_id || null,
      executionType: log.execution_type,
      status: log.success ? 'ok' : 'error',
      errorMessage: log.error_message || null,
      durationMs: log.duration_ms ?? 0,
    }))

    return NextResponse.json({
      entries,
      total: entries.length,
      limit,
    })
  } catch (error) {
    console.error('Runs recent error:', error)
    return NextResponse.json({ entries: [], total: 0, limit: 50 })
  }
}
