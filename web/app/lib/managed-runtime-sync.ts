import { prisma } from '@/app/lib/prisma'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'
import { syncAgentToGateway } from '@/app/lib/agent-deploy'

type AgentConfig = Record<string, unknown> & {
  pendingGatewaySync?: boolean
  runtimeUrl?: string
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return String(url).trim().replace(/\/$/, '')
}

function extractInstanceIdFromRuntimeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const host = new URL(url).host
    const match = host.match(/^agentbot-agent-([a-z0-9]+)-production\.up\.railway\.app$/i)
    return match?.[1] || null
  } catch {
    return null
  }
}

async function maybeAutoLinkManagedRuntimeForUser(userId: string): Promise<{
  linked: boolean
  reason?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true, openclawInstanceId: true },
  })

  const hasLinkedRuntime = Boolean(user?.openclawUrl && user?.openclawInstanceId)
  if (hasLinkedRuntime) {
    return { linked: false, reason: 'already_linked' }
  }

  const latestAgent = await prisma.agent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, websocketUrl: true, config: true },
  })

  if (!latestAgent) {
    return { linked: false, reason: 'no_agent' }
  }

  const config = (latestAgent.config as AgentConfig | null) || {}
  const runtimeUrl = normalizeUrl(latestAgent.websocketUrl || config.runtimeUrl || null)
  const runtimeInstanceId =
    extractInstanceIdFromRuntimeUrl(runtimeUrl) ||
    (/^[a-f0-9]{16}$/i.test(latestAgent.id) ? latestAgent.id : null)

  if (!runtimeUrl && !runtimeInstanceId) {
    return { linked: false, reason: 'no_runtime_data' }
  }

  if (runtimeInstanceId) {
    const ownedByOtherUser = await prisma.user.findFirst({
      where: {
        openclawInstanceId: runtimeInstanceId,
        id: { not: userId },
      },
      select: { id: true },
    })
    if (ownedByOtherUser) {
      return { linked: false, reason: 'instance_owned_elsewhere' }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(runtimeUrl ? { openclawUrl: runtimeUrl } : {}),
      ...(runtimeInstanceId ? { openclawInstanceId: runtimeInstanceId } : {}),
    },
  })

  return { linked: true }
}

export async function maybeAutoSyncManagedRuntimeForUser(userId: string): Promise<{
  attempted: boolean
  synced: boolean
  reason?: string
}> {
  const linkResult = await maybeAutoLinkManagedRuntimeForUser(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      openclawUrl: true,
      openclawInstanceId: true,
    },
  })

  const runtimeUrl = user?.openclawUrl?.replace(/\/$/, '')
  const runtimeId = user?.openclawInstanceId

  if (!runtimeUrl || !runtimeId) {
    return {
      attempted: false,
      synced: false,
      reason: linkResult.linked ? 'runtime_linked_retry' : (linkResult.reason || 'no_runtime'),
    }
  }

  const agent = await prisma.agent.findFirst({
    where: { id: runtimeId, userId },
    select: {
      id: true,
      status: true,
      websocketUrl: true,
      config: true,
    },
  })

  if (!agent) {
    return { attempted: false, synced: false, reason: 'agent_not_found' }
  }

  const config = (agent.config as AgentConfig | null) || {}
  if (!config.pendingGatewaySync) {
    return { attempted: false, synced: false, reason: 'not_pending' }
  }

  const health = await gatewayHealthcheck(runtimeUrl)
  if (!health.ok) {
    return { attempted: true, synced: false, reason: 'runtime_unhealthy' }
  }

  const result = await syncAgentToGateway(agent.id)
  if (!result.success) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: 'error',
        websocketUrl: runtimeUrl,
        config: {
          ...config,
          lastSyncError: result.error || 'Gateway sync failed',
        },
      },
    })

    return { attempted: true, synced: false, reason: 'sync_failed' }
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      status: 'running',
      websocketUrl: runtimeUrl,
      config: {
        ...config,
        pendingGatewaySync: false,
        deployedAt: result.deployedAt || new Date().toISOString(),
        lastSyncError: null,
        deployedSkills: result.details?.skillsDeployed || 0,
        deployedMemories: result.details?.memoriesDeployed || 0,
        deployedFiles: result.details?.filesDeployed || 0,
      },
    },
  })

  return { attempted: true, synced: true }
}
