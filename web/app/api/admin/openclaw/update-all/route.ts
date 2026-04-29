import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'
import { DEFAULT_OPENCLAW_IMAGE, DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { deployRailwayServiceImage, getRailwayEnvironmentId, resolveRailwayService } from '@/app/lib/railway-service'

type RuntimeUser = {
  id: string
  email: string | null
  openclawInstanceId: string | null
  openclawUrl: string | null
}

type UpdateResult = {
  userId: string
  email: string | null
  instanceId: string
  status: 'ok' | 'dry-run' | 'error'
  serviceId?: string
  serviceName?: string
  image?: string
  error?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

async function assertAdmin() {
  const session = await getAuthSession()
  return Boolean(session?.user?.email && isAdminEmail(session.user.email))
}

async function updateRuntimeUser(
  user: RuntimeUser,
  environmentId: string,
  dryRun: boolean
): Promise<UpdateResult> {
  const instanceId = user.openclawInstanceId
  if (!instanceId) {
    return {
      userId: user.id,
      email: user.email,
      instanceId: 'missing',
      status: 'error',
      error: 'User has no OpenClaw instance id',
    }
  }

  try {
    const latestAgent = await prisma.agent.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, config: true, websocketUrl: true },
    })
    const config = asRecord(latestAgent?.config)
    const runtimeServiceId = typeof config.runtimeServiceId === 'string'
      ? config.runtimeServiceId
      : null

    const service = await resolveRailwayService({
      agentId: instanceId,
      openclawUrl: user.openclawUrl,
      serviceId: runtimeServiceId,
    })

    if (!dryRun) {
      await deployRailwayServiceImage({
        serviceId: service.id,
        environmentId,
        image: DEFAULT_OPENCLAW_IMAGE,
      })

      if (latestAgent) {
        await prisma.agent.update({
          where: { id: latestAgent.id },
          data: {
            status: 'updating',
            websocketUrl: latestAgent.websocketUrl || user.openclawUrl,
            config: {
              ...config,
              runtimeServiceId: service.id,
              runtimeImage: DEFAULT_OPENCLAW_IMAGE,
              runtimeVersion: DEFAULT_OPENCLAW_VERSION,
              runtimeUpdateStatus: 'ok',
              runtimeUpdatedAt: new Date().toISOString(),
            },
          },
        })
      }
    }

    return {
      userId: user.id,
      email: user.email,
      instanceId,
      status: dryRun ? 'dry-run' : 'ok',
      serviceId: service.id,
      serviceName: service.name,
      image: DEFAULT_OPENCLAW_IMAGE,
    }
  } catch (error) {
    return {
      userId: user.id,
      email: user.email,
      instanceId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Update failed',
    }
  }
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let dryRun = false
  try {
    const body = await request.json()
    dryRun = body?.dryRun === true
  } catch {
    // Empty body is fine.
  }

  let environmentId: string
  try {
    environmentId = getRailwayEnvironmentId()
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Railway is not configured' },
      { status: 503 }
    )
  }

  const users = await prisma.user.findMany({
    where: { openclawInstanceId: { not: null } },
    select: {
      id: true,
      email: true,
      openclawInstanceId: true,
      openclawUrl: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const results: UpdateResult[] = []
  const concurrency = 3

  for (let index = 0; index < users.length; index += concurrency) {
    const batch = users.slice(index, index + concurrency)
    results.push(...await Promise.all(
      batch.map((user) => updateRuntimeUser(user, environmentId, dryRun))
    ))
  }

  const ok = results.filter((result) => result.status === 'ok').length
  const dryRunCount = results.filter((result) => result.status === 'dry-run').length
  const failed = results.filter((result) => result.status === 'error').length

  return NextResponse.json({
    success: failed === 0,
    status: failed === 0 ? 'ok' : 'partial',
    dryRun,
    image: DEFAULT_OPENCLAW_IMAGE,
    openclawVersion: DEFAULT_OPENCLAW_VERSION,
    totals: {
      candidates: users.length,
      ok,
      dryRun: dryRunCount,
      failed,
    },
    results,
  })
}
