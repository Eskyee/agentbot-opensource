/**
 * Fail-closed authorization on the money-moving escrow actions.
 *
 * Release/refund must reject anyone who is neither holding the one-time release
 * token nor signed in as the buyer who opened the hold. This locks that contract
 * at the route layer, where the auth decision actually lives.
 */
jest.mock('@/app/lib/api/rate-limit', () => ({ checkRateLimit: jest.fn().mockResolvedValue(false) }))
jest.mock('@/app/lib/getAuthSession', () => ({ getAuthSession: jest.fn() }))
jest.mock('@/app/lib/a2a-tasks', () => ({ recordCompletion: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/app/lib/x402-settle', () => ({
  settleViaFacilitator: jest.fn().mockResolvedValue({ status: 'unconfigured' }),
}))
jest.mock('@/app/lib/escrow', () => ({
  getEscrow: jest.fn(),
  toPublic: (e: Record<string, unknown>) => e,
  tokenMatches: (t: string, h: string) => t === 'goodtoken' && h === 'HASH',
  submitWork: jest.fn(),
  releaseEscrow: jest.fn(),
  refundEscrow: jest.fn(),
  disputeEscrow: jest.fn(),
  recordSettlement: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/agents/[id]/escrow/[escrowId]/route'
import { getEscrow, releaseEscrow } from '@/app/lib/escrow'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { settleViaFacilitator } from '@/app/lib/x402-settle'
import { recordCompletion } from '@/app/lib/a2a-tasks'

const getEscrowMock = getEscrow as jest.Mock
const releaseMock = releaseEscrow as jest.Mock
const sessionMock = getAuthSession as jest.Mock
const settleMock = settleViaFacilitator as jest.Mock
const recordCompletionMock = recordCompletion as jest.Mock

const FIXTURE = {
  id: 'esc1',
  payeeAgentId: 'agent1',
  payeeAddress: '0xPAYEE',
  payerAddress: '0xPAYER',
  asset: '0xASSET',
  network: 'eip155:8453',
  amount: '5000000',
  authorization: 'AUTH',
  releaseTokenHash: 'HASH',
  payerOwnerId: 'owner1',
  state: 'submitted',
}

const params = Promise.resolve({ id: 'agent1', escrowId: 'esc1' })

function req(body: Record<string, unknown>) {
  return new Request('http://test/api/agents/agent1/escrow/esc1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

beforeEach(() => {
  jest.clearAllMocks()
  getEscrowMock.mockResolvedValue({ ...FIXTURE })
  releaseMock.mockResolvedValue({ ...FIXTURE, state: 'released' })
  sessionMock.mockResolvedValue(null)
  settleMock.mockResolvedValue({ status: 'unconfigured' })
})

describe('release/refund authorization', () => {
  it('rejects release with no token and no session (403)', async () => {
    const res = await POST(req({ action: 'release' }), { params })
    expect(res.status).toBe(403)
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('rejects release with a wrong token (403)', async () => {
    const res = await POST(req({ action: 'release', releaseToken: 'badtoken' }), { params })
    expect(res.status).toBe(403)
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('rejects release from a non-owner session (403)', async () => {
    sessionMock.mockResolvedValue({ user: { id: 'someone-else' } })
    const res = await POST(req({ action: 'release' }), { params })
    expect(res.status).toBe(403)
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('allows release with the valid token, and attempts settlement', async () => {
    // loadEscrowFor reads first (submitted → firstRelease true); the response
    // re-reads to return the fresh, released record.
    getEscrowMock
      .mockResolvedValueOnce({ ...FIXTURE, state: 'submitted' })
      .mockResolvedValueOnce({ ...FIXTURE, state: 'released' })
    const res = await POST(req({ action: 'release', releaseToken: 'goodtoken' }), { params })
    expect(res.status).toBe(200)
    expect(releaseMock).toHaveBeenCalledWith('esc1', '')
    expect(settleMock).toHaveBeenCalled()
    expect(recordCompletionMock).toHaveBeenCalledWith('agent1', true)
    const body = await res.json()
    expect(body.escrow.state).toBe('released')
    expect(body.settlement.status).toBe('unconfigured')
  })

  it('allows release for the owning buyer session (no token needed)', async () => {
    sessionMock.mockResolvedValue({ user: { id: 'owner1' } })
    const res = await POST(req({ action: 'release' }), { params })
    expect(res.status).toBe(200)
    expect(releaseMock).toHaveBeenCalled()
  })

  it('records the settlement tx when the facilitator settles', async () => {
    settleMock.mockResolvedValue({ status: 'settled', txHash: '0xTX', network: 'eip155:8453' })
    const res = await POST(req({ action: 'release', releaseToken: 'goodtoken' }), { params })
    const body = await res.json()
    expect(body.settlement.txHash).toBe('0xTX')
  })

  it('scopes the escrow to the agent in the path (404 on mismatch)', async () => {
    getEscrowMock.mockResolvedValue({ ...FIXTURE, payeeAgentId: 'different-agent' })
    const res = await POST(req({ action: 'release', releaseToken: 'goodtoken' }), { params })
    expect(res.status).toBe(404)
  })
})
