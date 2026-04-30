import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'
import {
  getRailwayEnvironmentId,
  railwayGql,
  resolveRailwayService,
  restartRailwayService,
} from '@/app/lib/railway-service'
import { getAgentEnvVars } from '@/app/lib/railway-provision'

const DEFAULT_GATEWAY_PORT = 18789

type MimoRequestBody = {
  apiKey?: string
  gatewayToken?: string
  dryRun?: boolean
}

function assertString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildMimoOpenClawConfig(apiKey: string, gatewayToken: string) {
  return {
    models: {
      mode: 'merge',
      providers: {
        'xiaomi-coding': {
          baseUrl: 'https://token-plan-ams.xiaomimimo.com/v1',
          apiKey,
          headers: {
            'api-key': apiKey,
          },
          api: 'openai-completions',
          models: [
            {
              id: 'mimo-v2.5-pro',
              name: 'mimo-v2.5-pro',
              reasoning: true,
              input: ['text'],
              contextWindow: 1048576,
              maxTokens: 32000,
            },
            {
              id: 'mimo-v2.5',
              name: 'mimo-v2.5',
              reasoning: true,
              input: ['text', 'image'],
              contextWindow: 262144,
              maxTokens: 32000,
            },
          ],
        },
      },
    },
    agents: {
      defaults: {
        model: {
          primary: 'xiaomi-coding/mimo-v2.5-pro',
        },
        models: {
          'xiaomi-coding/mimo-v2.5': {},
          'xiaomi-coding/mimo-v2.5-pro': {},
        },
      },
    },
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: DEFAULT_GATEWAY_PORT,
      auth: {
        mode: 'token',
        token: gatewayToken,
      },
      trustedProxies: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10', '172.16.0.0/12', '192.168.0.0/16'],
      controlUi: {
        allowedOrigins: [
          'https://agentbot.sh',
          'https://www.agentbot.sh',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ],
        dangerouslyDisableDeviceAuth: false,
        dangerouslyAllowHostHeaderOriginFallback: false,
      },
      http: { endpoints: { chatCompletions: { enabled: true } } },
    },
    plugins: {
      allow: [],
      entries: {
        'memory-core': {
          config: {
            dreaming: {
              enabled: true,
            },
          },
        },
      },
    },
    update: {
      channel: 'stable',
      auto: {
        enabled: true,
        stableDelayHours: 6,
        stableJitterHours: 12,
        betaCheckIntervalHours: 1,
      },
    },
    meta: {
      configuredBy: 'agentbot-admin',
      lastTouchedAt: new Date().toISOString(),
    },
  }
}

async function smokeRuntime(openclawUrl: string | null) {
  if (!openclawUrl) {
    return { ok: false, error: 'No OpenClaw URL found for admin user' }
  }

  try {
    const baseUrl = openclawUrl.replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const data = await response.json().catch(() => null) as Record<string, unknown> | null

    return {
      ok: response.ok,
      status: response.status,
      running: data?.running ?? null,
      aiProvider: data?.aiProvider ?? null,
      state: data?.state ?? null,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Smoke check failed',
    }
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({})) as MimoRequestBody
  const apiKey = assertString(body.apiKey)
  const requestedGatewayToken = assertString(body.gatewayToken)
  const dryRun = body.dryRun === true

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'MiMo API key is required' }, { status: 400 })
  }

  const [user, registration, latestAgent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        plan: true,
        openclawUrl: true,
        openclawInstanceId: true,
      },
    }),
    prisma.$queryRaw<{ gateway_token: string | null }[]>`
      SELECT gateway_token FROM agent_registrations WHERE user_id = ${session.user.id} LIMIT 1
    `,
    prisma.agent.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, config: true, websocketUrl: true },
    }),
  ])

  if (!user?.openclawInstanceId && !latestAgent?.id) {
    return NextResponse.json(
      { success: false, error: 'Admin user does not have a managed OpenClaw runtime' },
      { status: 404 }
    )
  }

  const latestConfig = latestAgent?.config && typeof latestAgent.config === 'object'
    ? latestAgent.config as Record<string, unknown>
    : {}
  const runtimeServiceId = typeof latestConfig.runtimeServiceId === 'string'
    ? latestConfig.runtimeServiceId
    : null
  const gatewayToken = requestedGatewayToken || registration[0]?.gateway_token || crypto.randomUUID()
  const openclawConfig = buildMimoOpenClawConfig(apiKey, gatewayToken)

  let railwayService: Awaited<ReturnType<typeof resolveRailwayService>>
  let environmentId: string
  try {
    environmentId = getRailwayEnvironmentId()
    railwayService = await resolveRailwayService({
      agentId: user?.openclawInstanceId || latestAgent?.id,
      openclawUrl: user?.openclawUrl || latestAgent?.websocketUrl,
      serviceId: runtimeServiceId,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Railway runtime not found' },
      { status: 503 }
    )
  }

  const variables = {
    ...getAgentEnvVars(user?.id || session.user.id, user?.plan || 'solo', gatewayToken),
    OPENCLAW_GATEWAY_TOKEN: gatewayToken,
    OPENCLAW_CONFIG_JSON: JSON.stringify(openclawConfig),
  }

  if (!dryRun) {
    await railwayGql(
      `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }`,
      {
        input: {
          projectId: process.env.RAILWAY_PROJECT_ID?.trim(),
          serviceId: railwayService.id,
          environmentId,
          variables,
        },
      }
    )

    await restartRailwayService(railwayService.id, environmentId)

    if (latestAgent) {
      await prisma.agent.update({
        where: { id: latestAgent.id },
        data: {
          status: 'updating',
          config: {
            ...latestConfig,
            runtimeServiceId: railwayService.id,
            modelProvider: 'xiaomi-coding',
            primaryModel: 'xiaomi-coding/mimo-v2.5-pro',
            adminMimoConfiguredAt: new Date().toISOString(),
          },
        },
      })
    }
  }

  const smoke = dryRun
    ? { ok: true, skipped: true }
    : await smokeRuntime(user?.openclawUrl || latestAgent?.websocketUrl || null)

  return NextResponse.json({
    success: true,
    dryRun,
    service: {
      id: railwayService.id,
      name: railwayService.name,
    },
    configured: {
      provider: 'xiaomi-coding',
      primaryModel: 'xiaomi-coding/mimo-v2.5-pro',
      gatewayTokenSource: requestedGatewayToken ? 'request' : registration[0]?.gateway_token ? 'registration' : 'generated',
    },
    smoke,
  })
}
