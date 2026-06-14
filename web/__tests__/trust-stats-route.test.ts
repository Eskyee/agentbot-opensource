/**
 * @jest-environment node
 *
 * Public trust/status stats. Verifies the response shape, that it reflects the
 * directory count + flywheel + settlement flag, and that it stays resilient when
 * the flywheel read fails (routing → null, not a 500).
 */
jest.mock('@/app/lib/prisma', () => ({ prisma: { agent: { count: jest.fn() } } }))
jest.mock('@/app/lib/gateway-flywheel', () => ({ getFlywheelStats: jest.fn() }))
jest.mock('@/app/lib/x402-settle', () => ({ isSettlementConfigured: jest.fn() }))

import { GET } from '@/app/api/trust/stats/route'
import { prisma } from '@/app/lib/prisma'
import { getFlywheelStats } from '@/app/lib/gateway-flywheel'
import { isSettlementConfigured } from '@/app/lib/x402-settle'

const agentCount = prisma.agent.count as jest.Mock
const flywheelMock = getFlywheelStats as jest.Mock
const settlementMock = isSettlementConfigured as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  agentCount.mockResolvedValue(7)
  flywheelMock.mockResolvedValue({
    totalRouted: 1000,
    overallSuccessRate: 0.97,
    estimatedUsdSaved: 12.34,
    byBucket: { low: { routed: 1, best: null }, med: { routed: 1, best: null }, high: { routed: 1, best: null } },
    topModels: [{ model: 'xiaomi/mimo-v2.5', attempts: 500, successRate: 0.98, avgLatencyMs: 120 }],
  })
  settlementMock.mockReturnValue(true)
})

describe('/api/trust/stats', () => {
  it('returns the live signal shape', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.directory.agentsListed).toBe(7)
    expect(body.routing.totalRouted).toBe(1000)
    expect(body.routing.successRate).toBeCloseTo(0.97)
    expect(body.routing.estimatedUsdSaved).toBeCloseTo(12.34)
    expect(body.routing.topModels).toHaveLength(1)
    expect(body.settlement.onChain).toBe(true)
    expect(body.status).toBe('operational')
    expect(typeof body.generatedAt).toBe('string')
  })

  it('reports settlement off when no facilitator is configured', async () => {
    settlementMock.mockReturnValue(false)
    const res = await GET()
    const body = await res.json()
    expect(body.settlement.onChain).toBe(false)
  })

  it('stays resilient when the flywheel read fails (routing → null)', async () => {
    flywheelMock.mockRejectedValue(new Error('redis down'))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.routing).toBeNull()
    expect(body.directory.agentsListed).toBe(7)
  })

  it('falls back to zero agents when the count query fails', async () => {
    agentCount.mockRejectedValue(new Error('db down'))
    const res = await GET()
    const body = await res.json()
    expect(body.directory.agentsListed).toBe(0)
  })
})
