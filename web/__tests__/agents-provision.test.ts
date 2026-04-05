jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agent: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/app/lib/trial-utils', () => ({
  isTrialActive: jest.fn(),
}))

jest.mock('@/app/lib/railway-provision', () => ({
  provisionOnRailway: jest.fn(),
  isRailwayConfigured: jest.fn(),
}))

jest.mock('@/app/lib/agent-deploy', () => ({
  deployAgentToGateway: jest.fn(),
  fetchAgentDataForDeployment: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { isTrialActive } from '@/app/lib/trial-utils'
import { provisionOnRailway, isRailwayConfigured } from '@/app/lib/railway-provision'
import { POST } from '@/app/api/agents/provision/route'

describe('/api/agents/provision', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedTrialActive = isTrialActive as jest.Mock
  const mockedProvisionOnRailway = provisionOnRailway as jest.Mock
  const mockedRailwayConfigured = isRailwayConfigured as jest.Mock
  const mockedPrisma = prisma as unknown as {
    user: { findUnique: jest.Mock; update: jest.Mock }
    agent: { count: jest.Mock; create: jest.Mock; update: jest.Mock }
    $transaction: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    mockedTrialActive.mockReturnValue(false)
    mockedPrisma.agent.count.mockResolvedValue(0)
    mockedPrisma.agent.create.mockResolvedValue({
      id: 'agent-1',
      userId: 'user-1',
      name: 'Atlas',
      model: 'claude-opus-4-6',
      status: 'provisioning',
      websocketUrl: null,
      config: { managedRuntime: true, runtimePlan: 'collective' },
      createdAt: new Date('2026-04-04T00:00:00.000Z'),
    })
    mockedPrisma.user.update.mockResolvedValue({})
    mockedPrisma.agent.update.mockResolvedValue({})
    mockedPrisma.$transaction.mockImplementation(async (ops: Array<Promise<unknown>>) => Promise.all(ops))
  })

  test('provisions a Railway runtime when the user has no existing OpenClaw deployment', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      plan: 'collective',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      openclawUrl: null,
      openclawInstanceId: null,
    })
    mockedRailwayConfigured.mockReturnValue(true)
    mockedProvisionOnRailway.mockResolvedValue({
      agentId: 'agent-1',
      url: 'https://agentbot-agent-agent-1.up.railway.app',
      serviceId: 'svc_123',
      status: 'deploying',
    })

    const request = new NextRequest('http://localhost/api/agents/provision', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Atlas',
        config: { tier: 'collective' },
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(mockedProvisionOnRailway).toHaveBeenCalledWith('agent-1', 'collective')
    expect(mockedPrisma.$transaction).toHaveBeenCalled()
    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      success: true,
      agent: {
        id: 'agent-1',
        status: 'deploying',
        websocketUrl: 'https://agentbot-agent-agent-1.up.railway.app',
        runtime: {
          instanceId: 'agent-1',
          url: 'https://agentbot-agent-agent-1.up.railway.app',
          serviceId: 'svc_123',
        },
      },
    })
  })
})
