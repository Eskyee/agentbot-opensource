import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { invokeGatewayTool } from '@/app/lib/gateway-proxy'

/**
 * GET /api/sessions
 * Real sessions from the OpenClaw gateway.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await invokeGatewayTool('sessions_list', {
    action: 'json',
    limit: 50,
  }, session.user.id)

  if (!result.ok) {
    return NextResponse.json({
      sessions: [],
      error: result.error,
      source: 'gateway-error',
    })
  }

  const data = typeof result.result === 'string' ? JSON.parse(result.result) : result.result
  const sessions = Array.isArray(data) ? data : data?.sessions || data?.result || []

  return NextResponse.json({
    sessions: sessions.map((s: any) => ({
      key: s.sessionKey || s.key,
      agentId: s.agentId,
      status: s.status || 'active',
      messageCount: s.messageCount || s.turns || 0,
      lastActivity: s.lastActivity || s.updatedAt || null,
      createdAt: s.createdAt || null,
      model: s.model || null,
    })),
    total: sessions.length,
    source: 'gateway',
  })
}

export const dynamic = 'force-dynamic'
