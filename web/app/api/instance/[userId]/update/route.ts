import { NextResponse } from 'next/server'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { DEFAULT_OPENCLAW_IMAGE, DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { deployRailwayServiceImage, getRailwayEnvironmentId, resolveRailwayService } from '@/app/lib/railway-service'


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
    await deployRailwayServiceImage({
      serviceId: railwayService.id,
      environmentId,
      image: DEFAULT_OPENCLAW_IMAGE,
    })

    return NextResponse.json({
      success: true,
      status: 'updating',
      image: DEFAULT_OPENCLAW_IMAGE,
      openclawVersion: DEFAULT_OPENCLAW_VERSION,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deploy new image'
    return NextResponse.json(
      { success: false, status: 'error', error: message, image: DEFAULT_OPENCLAW_IMAGE },
      { status: 500 }
    )
  }
}

