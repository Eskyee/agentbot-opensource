import { NextResponse } from 'next/server'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { getRailwayEnvironmentId, railwayGql, resolveRailwayService } from '@/app/lib/railway-service'

/**
 * POST /api/instance/[userId]/stop
 * Stop (suspend) a Railway service.
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
    await railwayGql(
      `mutation ServiceInstanceStop($serviceId: String!, $environmentId: String!) {
        serviceInstanceStop(serviceId: $serviceId, environmentId: $environmentId)
      }`,
      {
        serviceId: railwayService.id,
        environmentId,
      }
    )

    return NextResponse.json({ success: true, status: 'stopped' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
