jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    agent: {
      findMany: jest.fn(),
    },
    agentMemory: {
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/app/lib/prisma'
import { GET } from '@/app/api/showcase/route'

describe('/api/showcase', () => {
  const mockedAgentFindMany = prisma.agent.findMany as jest.Mock
  const mockedMemoryFindMany = prisma.agentMemory.findMany as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('includes both active and running showcase agents', async () => {
    mockedAgentFindMany.mockResolvedValue([
      {
        id: 'agent-active',
        name: 'Atlas',
        showcaseDescription: 'Active agent',
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
      {
        id: 'agent-running',
        name: 'Nova',
        showcaseDescription: 'Running agent',
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
      },
    ])
    mockedMemoryFindMany.mockResolvedValue([
      {
        agentId: 'agent-active',
        value: JSON.stringify({ type: 'selector', expertise: 'house, garage' }),
      },
    ])

    const response = await GET()
    const body = await response.json()

    expect(mockedAgentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          showcaseOptIn: true,
          status: { in: ['active', 'running'] },
        },
      })
    )
    expect(response.status).toBe(200)
    expect(body.total).toBe(2)
    expect(body.agents[0]).toMatchObject({
      id: 'agent-active',
      personalityType: 'selector',
      expertise: 'house, garage',
    })
    expect(body.agents[1]).toMatchObject({
      id: 'agent-running',
      personalityType: 'basement',
      expertise: '',
    })
  })

  test('returns 500 payload when the database query fails', async () => {
    mockedAgentFindMany.mockRejectedValue(new Error('db offline'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to load showcase agents' })
  })
})
