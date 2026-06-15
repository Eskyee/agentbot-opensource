import { NextResponse } from 'next/server'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { getRailwayEnvironmentId, resolveRailwayService, restartRailwayService } from '@/app/lib/railway-service'

/**
 * POST /api/instance/[userId]/restart
 * Restart a user's OpenClaw gateway on Railway.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!OPENCLAW_CONTROLS_ENABLED) {
    return controlsDisabledResponse()
  }

  const { userId } = await params
  const owned = await getOwnedOpenClawUser(userId)
  if ('error' in owned) {
    return owned.error
  }
  const { user } = owned
  let environmentId: string
  let railwayService: Awaited<ReturnType<typeof resolveRailwayService>>
  try {
    environmentId = getRailwayEnvironmentId()
    railwayService = await resolveRailwayService({
      agentId: user.openclawInstanceId,
      openclawUrl: user.openclawUrl,
      serviceId: user.runtimeServiceId,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 503 })
  }

  try {
    await restartRailwayService(railwayService.id, environmentId)

    return NextResponse.json({ success: true, status: 'restarting' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
