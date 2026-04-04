jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    agent: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/gateway-proxy', () => ({
  gatewayHealthcheck: jest.fn(),
}))

jest.mock('@/app/lib/agent-deploy', () => ({
  syncAgentToGateway: jest.fn(),
}))

import { prisma } from '@/app/lib/prisma'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'
import { syncAgentToGateway } from '@/app/lib/agent-deploy'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'

describe('maybeAutoSyncManagedRuntimeForUser', () => {
  const mockedPrisma = prisma as unknown as {
    user: { findUnique: jest.Mock }
    agent: { findFirst: jest.Mock; update: jest.Mock }
  }
  const mockedGatewayHealthcheck = gatewayHealthcheck as jest.Mock
  const mockedSync = syncAgentToGateway as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('syncs a pending managed runtime once it becomes healthy', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      openclawUrl: 'https://runtime.example.com',
      openclawInstanceId: 'agent-1',
    })
    mockedPrisma.agent.findFirst.mockResolvedValue({
      id: 'agent-1',
      status: 'deploying',
      websocketUrl: null,
      config: { pendingGatewaySync: true },
    })
    mockedGatewayHealthcheck.mockResolvedValue({ ok: true, status: 'healthy' })
    mockedSync.mockResolvedValue({
      success: true,
      deployedAt: '2026-04-04T12:00:00.000Z',
      details: {
        skillsDeployed: 2,
        memoriesDeployed: 1,
        filesDeployed: 0,
      },
    })

    const result = await maybeAutoSyncManagedRuntimeForUser('user-1')

    expect(mockedSync).toHaveBeenCalledWith('agent-1')
    expect(mockedPrisma.agent.update).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: expect.objectContaining({
        status: 'running',
        websocketUrl: 'https://runtime.example.com',
      }),
    })
    expect(result).toEqual({ attempted: true, synced: true })
  })

  test('does nothing when the runtime is not pending sync', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      openclawUrl: 'https://runtime.example.com',
      openclawInstanceId: 'agent-1',
    })
    mockedPrisma.agent.findFirst.mockResolvedValue({
      id: 'agent-1',
      status: 'running',
      websocketUrl: 'https://runtime.example.com',
      config: { pendingGatewaySync: false },
    })

    const result = await maybeAutoSyncManagedRuntimeForUser('user-1')

    expect(mockedGatewayHealthcheck).not.toHaveBeenCalled()
    expect(mockedSync).not.toHaveBeenCalled()
    expect(result).toEqual({ attempted: false, synced: false, reason: 'not_pending' })
  })
})
