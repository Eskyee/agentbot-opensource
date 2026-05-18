import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

/**
 * POST /api/ops/runs/log
 *
 * Logs agent executions to execution_logs.
 * Auth: Bearer token matching INTERNAL_API_KEY env var, OR bridge secret.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const internalKey = process.env.INTERNAL_API_KEY
    const bridgeSecret = process.env.BRIDGE_SECRET

    const isInternal = internalKey && token === internalKey
    const isBridge = bridgeSecret && token === bridgeSecret

    if (!isInternal && !isBridge) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, agentId, workflowId, executionType, success, errorMessage, durationMs } = body

    if (!userId || !executionType) {
      return NextResponse.json(
        { error: 'userId and executionType are required' },
        { status: 400 }
      )
    }

    if (typeof success !== 'boolean') {
      return NextResponse.json(
        { error: 'success must be a boolean' },
        { status: 400 }
      )
    }

    const log = await prisma.execution_logs.create({
      data: {
        user_id: String(userId),
        agent_id: agentId ? String(agentId) : null,
        workflow_id: workflowId ? String(workflowId) : null,
        execution_type: String(executionType),
        success,
        error_message: errorMessage ? String(errorMessage) : null,
        duration_ms: durationMs != null ? Number(durationMs) : null,
      },
    })

    return NextResponse.json({
      ok: true,
      id: log.id,
      executionType: log.execution_type,
      success: log.success,
      createdAt: log.created_at,
    })
  } catch (error) {
    console.error('Runs log error:', error)
    return NextResponse.json({ error: 'Failed to log execution' }, { status: 500 })
  }
}
