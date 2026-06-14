/**
 * @jest-environment node
 *
 * x402 settlement lib. Verifies the fail-closed contract: no facilitator
 * configured → never reports settled; configured → settles via mocked /settle.
 * Runs in the node env so native fetch/Response are present without undici.
 */
import { settleViaFacilitator, verifyViaFacilitator, isSettlementConfigured } from '@/app/lib/x402-settle'

const REQ = {
  payTo: '0xPAYEE000000000000000000000000000000000002',
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  network: 'eip155:8453',
  amount: 5_000_000n,
}

function authHeader(): string {
  return Buffer.from(JSON.stringify({ x402Version: 1, scheme: 'exact' }), 'utf-8').toString('base64')
}

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  jest.restoreAllMocks()
})

describe('isSettlementConfigured', () => {
  it('is false without a facilitator url', () => {
    delete process.env.X402_FACILITATOR_URL
    expect(isSettlementConfigured()).toBe(false)
  })
  it('is true with a facilitator url', () => {
    process.env.X402_FACILITATOR_URL = 'https://fac.test'
    expect(isSettlementConfigured()).toBe(true)
  })
})

describe('settleViaFacilitator — fail closed', () => {
  it('returns unconfigured when no facilitator is set (never settled)', async () => {
    delete process.env.X402_FACILITATOR_URL
    const r = await settleViaFacilitator(authHeader(), REQ)
    expect(r.status).toBe('unconfigured')
  })

  it('returns failed on malformed authorization', async () => {
    process.env.X402_FACILITATOR_URL = 'https://fac.test'
    const r = await settleViaFacilitator('!!!not-base64!!!', REQ)
    expect(r.status).toBe('failed')
  })
})

describe('settleViaFacilitator — with mocked facilitator', () => {
  beforeEach(() => {
    process.env.X402_FACILITATOR_URL = 'https://fac.test'
  })

  it('returns settled with the tx hash on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, transaction: '0xTX', payer: '0xPAYER' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const r = await settleViaFacilitator(authHeader(), REQ)
    expect(r.status).toBe('settled')
    if (r.status === 'settled') {
      expect(r.txHash).toBe('0xTX')
      expect(r.network).toBe('eip155:8453')
    }
  })

  it('returns failed when the facilitator reports success:false', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, errorReason: 'insufficient balance' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const r = await settleViaFacilitator(authHeader(), REQ)
    expect(r.status).toBe('failed')
  })

  it('returns failed on a non-200 facilitator response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }))
    const r = await settleViaFacilitator(authHeader(), REQ)
    expect(r.status).toBe('failed')
  })
})

describe('verifyViaFacilitator', () => {
  it('is invalid when unconfigured', async () => {
    delete process.env.X402_FACILITATOR_URL
    const r = await verifyViaFacilitator(authHeader(), REQ)
    expect(r.valid).toBe(false)
  })

  it('passes through facilitator isValid:true', async () => {
    process.env.X402_FACILITATOR_URL = 'https://fac.test'
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ isValid: true, payer: '0xPAYER' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const r = await verifyViaFacilitator(authHeader(), REQ)
    expect(r.valid).toBe(true)
    expect(r.payer).toBe('0xPAYER')
  })
})
