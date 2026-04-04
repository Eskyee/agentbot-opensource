import { NextRequest, NextResponse } from 'next/server'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { getOwnedOpenClawUser } from '@/app/api/instance/_runtime'

/**
 * GET /api/instance/[userId]/stats
 * Real stats from the shared OpenClaw gateway.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const owned = await getOwnedOpenClawUser(userId)
  if ('error' in owned) {
    return owned.error
  }
  const { user } = owned

  // Check the user's actual OpenClaw instance first, not just the shared gateway.
  const health = await gatewayHealthcheck(user.openclawUrl || undefined)

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
      openclawVersion: DEFAULT_OPENCLAW_VERSION,
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
