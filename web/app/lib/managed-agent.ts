import { prisma } from '@/app/lib/prisma'

function normalizeManagedAgentStatus(status?: string): string {
  if (!status) return 'running'
  if (status === 'active') return 'running'
  return status
}

function getManagedAgentName(agentType?: string): string {
  return agentType === 'business' ? 'OpenClaw Agent' : 'Agentbot Agent'
}

export async function persistManagedAgent(params: {
  userId: string
  agentId: string
  url?: string
  aiProvider?: string
  plan?: string
  agentType?: string
  status?: string
}) {
  const normalizedStatus = normalizeManagedAgentStatus(params.status)
  const managedAgentUrl = params.url?.replace(/\/$/, '')
  const payloadConfig = {
    managed: true,
    provisionSource: 'api/provision/job',
    agentType: params.agentType || 'creative',
    plan: params.plan || 'solo',
    aiProvider: params.aiProvider || 'openrouter',
    openclawUrl: managedAgentUrl || null,
  }

  await Promise.all([
    prisma.user.update({
      where: { id: params.userId },
      data: {
        openclawUrl: managedAgentUrl,
        openclawInstanceId: params.agentId,
      },
    }),
    prisma.agent.upsert({
      where: { id: params.agentId },
      update: {
        name: getManagedAgentName(params.agentType),
        model: params.aiProvider || 'openrouter',
        status: normalizedStatus,
        websocketUrl: managedAgentUrl,
        tier: params.plan || 'solo',
        config: payloadConfig,
      },
      create: {
        id: params.agentId,
        userId: params.userId,
        name: getManagedAgentName(params.agentType),
        model: params.aiProvider || 'openrouter',
        status: normalizedStatus,
        websocketUrl: managedAgentUrl,
        tier: params.plan || 'solo',
        config: payloadConfig,
      },
    }),
  ])
}
