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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MimoRequestBody = {
  apiKey?: string
  gatewayToken?: string
  targetRuntimeUrl?: string
  dryRun?: boolean
}

function assertString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeRuntimeUrl(value: string) {
  if (!value) return ''
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    url.pathname = ''
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function sanitizeErrorMessage(message: string) {
  return message
    .replace(/tp-[a-z0-9]+/gi, '[redacted]')
    .replace(/[a-f0-9]{40,}/gi, '[redacted]')
}

function errorResponse(code: string, error: string, status: number) {
  return NextResponse.json(
    { success: false, code, error: sanitizeErrorMessage(error) },
    { status }
  )
}

function errorCodeFor(message: string, fallback: string) {
  return /not authorized|unauthorized|forbidden/i.test(message)
    ? 'railway_not_authorized'
    : fallback
}

function runtimeErrorCodeFor(status: number, fallback: string) {
  return status === 401 || status === 403
    ? 'runtime_config_unauthorized'
    : fallback
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

async function applyRuntimeConfig(openclawUrl: string | null, gatewayToken: string, openclawConfig: ReturnType<typeof buildMimoOpenClawConfig>) {
  if (!openclawUrl) {
    return { ok: false, code: 'runtime_url_missing', error: 'No OpenClaw URL found for admin user' }
  }

  try {
    const baseUrl = openclawUrl.replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openclawConfig),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    const data = await response.json().catch(() => null) as { error?: string; message?: string } | null

    if (!response.ok) {
      const message = data?.error || data?.message || `OpenClaw config API returned ${response.status}`
      return {
        ok: false,
        code: runtimeErrorCodeFor(response.status, 'runtime_config_failed'),
        status: response.status,
        error: message,
      }
    }

    return {
      ok: true,
      code: 'runtime_config_applied',
      status: response.status,
      message: data?.message || 'Config written through OpenClaw Agentbot',
    }
  } catch (error) {
    return {
      ok: false,
      code: 'runtime_config_unreachable',
      error: error instanceof Error ? error.message : 'OpenClaw config API failed',
    }
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id || (!session.user.isAdmin && !isAdminEmail(session.user.email))) {
    return errorResponse('admin_unauthorized', 'Admin authorization failed', 403)
  }

  const body = await request.json().catch(() => ({})) as MimoRequestBody
  const apiKey = assertString(body.apiKey)
  const requestedGatewayToken = assertString(body.gatewayToken)
  const targetRuntimeUrl = normalizeRuntimeUrl(assertString(body.targetRuntimeUrl))
  const dryRun = body.dryRun === true

  if (!apiKey) {
    return errorResponse('missing_mimo_api_key', 'MiMo API key is required', 400)
  }

  if (assertString(body.targetRuntimeUrl) && !targetRuntimeUrl) {
    return errorResponse('invalid_runtime_url', 'Target runtime URL is not valid', 400)
  }

  const [user, latestAgent, targetUser, targetAgent] = await Promise.all([
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
    prisma.agent.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, config: true, websocketUrl: true },
    }),
    targetRuntimeUrl
      ? prisma.user.findFirst({
          where: { openclawUrl: { in: [targetRuntimeUrl, `${targetRuntimeUrl}/`] } },
          select: {
            id: true,
            email: true,
            plan: true,
            openclawUrl: true,
            openclawInstanceId: true,
          },
        })
      : Promise.resolve(null),
    targetRuntimeUrl
      ? prisma.agent.findFirst({
          where: { websocketUrl: { in: [targetRuntimeUrl, `${targetRuntimeUrl}/`] } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, userId: true, config: true, websocketUrl: true },
        })
      : Promise.resolve(null),
  ])

  const ownerUser = targetUser || user
  const managedAgent = targetAgent || latestAgent
  const runtimeUrl = targetRuntimeUrl || ownerUser?.openclawUrl || managedAgent?.websocketUrl || null

  if (!ownerUser?.openclawInstanceId && !managedAgent?.id && !targetRuntimeUrl) {
    return errorResponse('runtime_not_found', 'Admin user does not have a managed OpenClaw runtime', 404)
  }

  const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${ownerUser?.id || session.user.id} LIMIT 1
  `

  const latestConfig = managedAgent?.config && typeof managedAgent.config === 'object'
    ? managedAgent.config as Record<string, unknown>
    : {}
  const runtimeServiceId = typeof latestConfig.runtimeServiceId === 'string'
    ? latestConfig.runtimeServiceId
    : null
  const gatewayToken = requestedGatewayToken || registration[0]?.gateway_token || crypto.randomUUID()
  const openclawConfig = buildMimoOpenClawConfig(apiKey, gatewayToken)

  const variables = {
    ...getAgentEnvVars(ownerUser?.id || session.user.id, ownerUser?.plan || 'solo', gatewayToken),
    OPENCLAW_GATEWAY_TOKEN: gatewayToken,
    WRAPPER_ADMIN_PASSWORD: gatewayToken,
    OPENCLAW_CONFIG_JSON: JSON.stringify(openclawConfig),
  }

  let applyResult: Awaited<ReturnType<typeof applyRuntimeConfig>> | { ok: true; code: 'dry_run'; skipped: true }
  let railwayService: Awaited<ReturnType<typeof resolveRailwayService>> | null = null

  if (!dryRun) {
    applyResult = await applyRuntimeConfig(runtimeUrl, gatewayToken, openclawConfig)

    if (!applyResult.ok) {
      try {
        const environmentId = getRailwayEnvironmentId()
        railwayService = await resolveRailwayService({
          agentId: ownerUser?.openclawInstanceId || managedAgent?.id,
          openclawUrl: runtimeUrl,
          serviceId: runtimeServiceId,
        })

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

        applyResult = {
          ok: true,
          code: 'railway_env_applied',
          status: 200,
          message: 'Config written through Railway env and service restarted',
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Railway update failed'
        const fallbackCode = applyResult.code === 'runtime_config_unauthorized'
          ? 'runtime_config_unauthorized'
          : errorCodeFor(message, 'railway_update_failed')
        return errorResponse(
          fallbackCode,
          `${applyResult.error || 'OpenClaw config API failed'}; Railway fallback: ${message}`,
          502
        )
      }
    }
  } else {
    applyResult = { ok: true, code: 'dry_run', skipped: true }
  }

  if (!dryRun && managedAgent) {
    await prisma.agent.update({
      where: { id: managedAgent.id },
      data: {
        status: applyResult.code === 'railway_env_applied' ? 'updating' : 'running',
        config: {
          ...latestConfig,
          ...(railwayService?.id ? { runtimeServiceId: railwayService.id } : {}),
          modelProvider: 'xiaomi-coding',
          primaryModel: 'xiaomi-coding/mimo-v2.5-pro',
          adminMimoConfiguredAt: new Date().toISOString(),
        },
      },
    })
  }

  const smoke = dryRun
    ? { ok: true, skipped: true }
    : await smokeRuntime(runtimeUrl)

  return NextResponse.json({
    success: true,
    dryRun,
    apply: applyResult,
    service: railwayService ? {
      id: railwayService.id,
      name: railwayService.name,
    } : null,
    configured: {
      provider: 'xiaomi-coding',
      primaryModel: 'xiaomi-coding/mimo-v2.5-pro',
      gatewayTokenSource: requestedGatewayToken ? 'request' : registration[0]?.gateway_token ? 'registration' : 'generated',
      targetRuntimeUrl: runtimeUrl,
    },
    smoke,
  })
}
