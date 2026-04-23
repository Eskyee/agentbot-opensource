import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { getRailwayEnvironmentId, resolveRailwayService, restartRailwayService } from '@/app/lib/railway-service'

/**
 * POST /api/instance/[userId]/reset-memory
 * Wipe workspace and restart. Agent starts fresh like new.
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
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 503 })
  }

  try {
    // Clear agent memories from DB
    await prisma.agentMemory.deleteMany({
      where: { userId },
    })

    // Restart the container (workspace is ephemeral on Railway, so it resets on restart)
    await restartRailwayService(railwayService.id, environmentId)

    return NextResponse.json({ success: true, status: 'reset' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
