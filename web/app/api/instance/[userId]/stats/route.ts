import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { getOwnedOpenClawUser } from '@/app/api/instance/_runtime'
import { probeOpenClawRuntime } from '@/app/lib/openclaw-runtime-probe'

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

  const runtimeUrl = user.openclawUrl || `https://agentbot-agent-${userId}YOUR_SERVICE_URL`
  const runtime = await probeOpenClawRuntime(runtimeUrl)
  const status = runtime.status === 'healthy' ? 'running' : runtime.status
  const health = runtime.status === 'running' || runtime.status === 'healthy'
    ? 'healthy'
    : runtime.status

  return NextResponse.json({
    userId,
    status,
    health,
    cpu: '0%',
    memory: '0MB',
    uptime: runtime.uptime || (status === 'running' ? 'active' : 'unknown'),
    messages: null,
    errors: null,
    openclawVersion: runtime.openclawVersion || DEFAULT_OPENCLAW_VERSION,
    statusReason: runtime.reason || null,
    probeChecks: runtime.checks || [],
    telemetry: {
      resourceMetricsAvailable: false,
      lifecycleMetricsAvailable: false,
      messageMetricsAvailable: false,
    },
  })
}

