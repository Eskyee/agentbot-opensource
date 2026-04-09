import { prisma } from '@/app/lib/prisma'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'
import { syncAgentToGateway } from '@/app/lib/agent-deploy'

type AgentConfig = Record<string, unknown> & {
  pendingGatewaySync?: boolean
}

export async function maybeAutoSyncManagedRuntimeForUser(userId: string): Promise<{
  attempted: boolean
  synced: boolean
  reason?: string
}> {
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
    return { attempted: false, synced: false, reason: 'no_runtime' }
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
