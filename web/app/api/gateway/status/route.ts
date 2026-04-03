import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { invokeGatewayTool, gatewayHealthcheck } from '@/app/lib/gateway-proxy'

/**
 * GET /api/gateway/status
 * Real-time gateway status: health, sessions, channels, cron, heartbeat.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Fetch everything in parallel
  const [health, sessions, crons] = await Promise.all([
    gatewayHealthcheck(),
    invokeGatewayTool('sessions_list', { action: 'json', limit: 20 }, userId),
    invokeGatewayTool('cron', { action: 'list', includeDisabled: true }, userId),
  ])

  // Parse sessions
  let sessionList: any[] = []
  if (sessions.ok && sessions.result) {
    const data = typeof sessions.result === 'string' ? JSON.parse(sessions.result) : sessions.result
    sessionList = Array.isArray(data) ? data : data?.sessions || data?.result || []
  }

  // Parse cron jobs
  let cronList: any[] = []
  if (crons.ok && crons.result) {
    const data = typeof crons.result === 'string' ? JSON.parse(crons.result) : crons.result
    cronList = Array.isArray(data) ? data : data?.jobs || data?.result || []
  }

  const sessionsAvailable = sessions.ok
  const cronAvailable = crons.ok

  return NextResponse.json({
    health: health.ok ? 'healthy' : 'unreachable',
    healthDetail: health,
    sessions: {
      available: sessionsAvailable,
      total: sessionList.length,
      active: sessionList.filter((s: any) => s.status === 'active' || s.lastActivity).length,
      list: sessionList.slice(0, 10),
      error: sessions.ok ? null : sessions.error || 'unavailable',
    },
    cron: {
      available: cronAvailable,
      total: cronList.length,
      enabled: cronList.filter((c: any) => c.enabled !== false).length,
      jobs: cronList.slice(0, 10),
      error: crons.ok ? null : crons.error || 'unavailable',
    },
  })
}

export const dynamic = 'force-dynamic'
