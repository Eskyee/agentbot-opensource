/**
 * Escrow state machine — money logic, so it gets the most coverage.
 * Runs against the in-memory fallback (no Redis env in test), which is the same
 * code path the durable store wraps. Each test uses unique agent/owner ids to
 * stay isolated from the shared module-level maps.
 */
import {
  createEscrow,
  getEscrow,
  submitWork,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  recordSettlement,
  listEscrowsByPayee,
  listEscrowsByPayerOwner,
  tokenMatches,
  hashToken,
  toPublic,
  type CreateEscrowInput,
} from '@/app/lib/escrow'

let seq = 0
function input(over: Partial<CreateEscrowInput> = {}): CreateEscrowInput {
  seq += 1
  return {
    payeeAgentId: `agent-${seq}`,
    payerAddress: '0xPAYER000000000000000000000000000000000001',
    payeeAddress: '0xPAYEE000000000000000000000000000000000002',
    amount: '5000000',
    asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    network: 'eip155:8453',
    milestone: 'Master a 3-track EP',
    authorization: 'BASE64_AUTH',
    ...over,
  }
}

describe('createEscrow', () => {
  it('opens in funded state and returns a one-time release token', async () => {
    const { escrow, releaseToken } = await createEscrow(input())
    expect(escrow.state).toBe('funded')
    expect(releaseToken).toHaveLength(48) // 24 random bytes hex
    expect(escrow.releaseTokenHash).toBe(hashToken(releaseToken))
  })

  it('persists and is retrievable by id', async () => {
    const { escrow } = await createEscrow(input())
    const got = await getEscrow(escrow.id)
    expect(got?.id).toBe(escrow.id)
    expect(got?.milestone).toBe('Master a 3-track EP')
  })
})

describe('tokenMatches', () => {
  it('accepts the right token and rejects the wrong one', async () => {
    const { escrow, releaseToken } = await createEscrow(input())
    expect(tokenMatches(releaseToken, escrow.releaseTokenHash)).toBe(true)
    expect(tokenMatches('deadbeef', escrow.releaseTokenHash)).toBe(false)
    expect(tokenMatches('', escrow.releaseTokenHash)).toBe(false)
  })
})

describe('toPublic', () => {
  it('strips the authorization blob and token hash', async () => {
    const { escrow } = await createEscrow(input())
    const pub = toPublic(escrow) as Record<string, unknown>
    expect(pub.authorization).toBeUndefined()
    expect(pub.releaseTokenHash).toBeUndefined()
    expect(pub.id).toBe(escrow.id)
    expect(pub.amount).toBe('5000000')
  })
})

describe('transitions', () => {
  it('funded → submitted → released', async () => {
    const { escrow } = await createEscrow(input())
    const sub = await submitWork(escrow.id, 'ipfs://delivery')
    expect('state' in sub && sub.state).toBe('submitted')
    const rel = await releaseEscrow(escrow.id, 'Approved')
    expect('state' in rel && rel.state).toBe('released')
    expect('resolution' in rel && rel.resolution).toBe('Approved')
  })

  it('funded → refunded directly', async () => {
    const { escrow } = await createEscrow(input())
    const ref = await refundEscrow(escrow.id, 'Out of scope')
    expect('state' in ref && ref.state).toBe('refunded')
  })

  it('release is idempotent', async () => {
    const { escrow } = await createEscrow(input())
    await releaseEscrow(escrow.id)
    const again = await releaseEscrow(escrow.id)
    expect('state' in again && again.state).toBe('released')
  })

  it('cannot refund after release', async () => {
    const { escrow } = await createEscrow(input())
    await releaseEscrow(escrow.id)
    const ref = await refundEscrow(escrow.id)
    expect('error' in ref).toBe(true)
  })

  it('cannot release after refund', async () => {
    const { escrow } = await createEscrow(input())
    await refundEscrow(escrow.id)
    const rel = await releaseEscrow(escrow.id)
    expect('error' in rel).toBe(true)
  })

  it('dispute is non-terminal and can still resolve', async () => {
    const { escrow } = await createEscrow(input())
    const d = await disputeEscrow(escrow.id, 'stems missing')
    expect('state' in d && d.state).toBe('disputed')
    const rel = await releaseEscrow(escrow.id)
    expect('state' in rel && rel.state).toBe('released')
  })

  it('returns an error for an unknown escrow', async () => {
    const r = await submitWork('esc-does-not-exist', 'x')
    expect('error' in r).toBe(true)
  })
})

describe('recordSettlement', () => {
  it('attaches a settlement tx hash', async () => {
    const { escrow } = await createEscrow(input())
    await releaseEscrow(escrow.id)
    await recordSettlement(escrow.id, '0xTXHASH')
    const got = await getEscrow(escrow.id)
    expect(got?.settlementTx).toBe('0xTXHASH')
    expect(got?.settledAt).toBeTruthy()
  })
})

describe('indexes', () => {
  it('lists escrows by payee agent', async () => {
    const agentId = `payee-${Date.now()}`
    await createEscrow(input({ payeeAgentId: agentId }))
    await createEscrow(input({ payeeAgentId: agentId }))
    const list = await listEscrowsByPayee(agentId)
    expect(list).toHaveLength(2)
    // public projection — no secrets
    expect((list[0] as Record<string, unknown>).authorization).toBeUndefined()
  })

  it('lists escrows by payer owner only when tagged', async () => {
    const ownerId = `owner-${Date.now()}`
    await createEscrow(input({ payerOwnerId: ownerId }))
    const anon = await createEscrow(input()) // no owner
    const list = await listEscrowsByPayerOwner(ownerId)
    expect(list).toHaveLength(1)
    expect(list.find((e) => e.id === anon.escrow.id)).toBeUndefined()
  })
})
