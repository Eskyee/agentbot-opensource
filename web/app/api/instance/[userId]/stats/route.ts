import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'

/**
 * GET /api/instance/[userId]/stats
 * Real stats from the shared OpenClaw gateway.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  // Get real health from the shared gateway
  const health = await gatewayHealthcheck()

  if (health.ok) {
    return NextResponse.json({
      userId,
      status: 'running',
      health: 'healthy',
      cpu: '0%',       // Gateway doesn't expose CPU — placeholder
      memory: '0MB',    // Gateway doesn't expose memory — placeholder
      uptime: 'active',
      messages: null,
      errors: null,
      openclawVersion: '2026.3.28',
    })
  }

  return NextResponse.json({
    userId,
    status: 'unreachable',
    health: 'unreachable',
    cpu: '0%',
    memory: '0MB',
    uptime: 'unknown',
    messages: null,
    errors: null,
  })
}

export const dynamic = 'force-dynamic'
