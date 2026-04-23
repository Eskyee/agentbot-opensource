import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getOrCreateUserGatewayToken } from '@/app/lib/token-manager'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'
import { probeOpenClawRuntime } from '@/app/lib/openclaw-runtime-probe'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await maybeAutoSyncManagedRuntimeForUser(session.user.id).catch(() => {})

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openclawUrl: true, openclawInstanceId: true },
  })

  let effectiveOpenclawUrl = user?.openclawUrl || null
  let effectiveOpenclawInstanceId = user?.openclawInstanceId || null

  if (!effectiveOpenclawInstanceId) {
    const latestAgent = await prisma.agent.findFirst({
      where: { userId: session.user.id },
      select: { id: true, websocketUrl: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null)

    const looksLikeManagedRuntime = latestAgent?.id && (
      /^[a-f0-9]{16}$/i.test(latestAgent.id) ||
      String(latestAgent.websocketUrl || '').includes('agentbot-agent-')
    )

    if (looksLikeManagedRuntime) {
      effectiveOpenclawInstanceId = latestAgent.id
      effectiveOpenclawUrl = latestAgent.websocketUrl || null
    }
  }

  if (effectiveOpenclawUrl && effectiveOpenclawInstanceId) {
    const runtime = await probeOpenClawRuntime(effectiveOpenclawUrl)
    if (runtime.reason?.includes('Application not found')) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            openclawUrl: null,
            openclawInstanceId: null,
          },
        }),
        prisma.agent.updateMany({
          where: { id: effectiveOpenclawInstanceId, userId: session.user.id },
          data: {
            status: 'error',
            websocketUrl: null,
            config: {
              runtimeError: `Railway application missing for stale runtime id ${effectiveOpenclawInstanceId}`,
              runtimeMissingAt: new Date().toISOString(),
            },
          },
        }),
      ])

      return NextResponse.json({
        openclawUrl: null,
        openclawInstanceId: null,
        gatewayToken: null,
      })
    }
  }

  // Get the user's own gateway token (unique per agent)
  const tokenResult = await getOrCreateUserGatewayToken(session.user.id)
  const userGatewayToken = tokenResult?.token || null

  return NextResponse.json({
    openclawUrl: effectiveOpenclawUrl,
    openclawInstanceId: effectiveOpenclawInstanceId,
    gatewayToken: userGatewayToken,
  })
}

export const dynamic = 'force-dynamic'
