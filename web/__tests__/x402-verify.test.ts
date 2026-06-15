import { verifyX402Payment, type X402Requirements } from '@/app/lib/x402-verify'

const REQ: X402Requirements = {
  payTo: '0xAAA0000000000000000000000000000000000001',
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  network: 'eip155:8453',
  minAmount: 1000n,
}

function header(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64')
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    x402Version: 2,
    scheme: 'exact',
    network: 'eip155:8453',
    payload: {
      authorization: {
        from: '0xPAYER000000000000000000000000000000000001',
        to: REQ.payTo,
        value: '1000',
        asset: REQ.asset,
        validBefore: Math.floor(Date.now() / 1000) + 600,
      },
    },
    ...overrides,
  }
}

describe('verifyX402Payment', () => {
  it('rejects a missing header', () => {
    const r = verifyX402Payment(null, REQ)
    expect(r.valid).toBe(false)
  })

  it('rejects non-base64 garbage', () => {
    const r = verifyX402Payment('!!!not base64!!!', REQ)
    expect(r.valid).toBe(false)
  })

  it('accepts a well-formed authorization to the right address/asset/amount', () => {
    const r = verifyX402Payment(header(validPayload()), REQ)
    expect(r.valid).toBe(true)
    if (r.valid) {
      expect(r.amount).toBe(1000n)
      expect(r.payer).toContain('0xPAYER')
    }
  })

  it('rejects payment to the wrong address', () => {
    const p = validPayload()
    ;(p.payload.authorization as Record<string, unknown>).to = '0xBADADDRESS00000000000000000000000000000009'
    const r = verifyX402Payment(header(p), REQ)
    expect(r.valid).toBe(false)
  })

  it('rejects an underpayment', () => {
    const p = validPayload()
    ;(p.payload.authorization as Record<string, unknown>).value = '500'
    const r = verifyX402Payment(header(p), REQ)
    expect(r.valid).toBe(false)
  })

  it('rejects the wrong network', () => {
    const r = verifyX402Payment(header(validPayload({ network: 'eip155:1' })), REQ)
    expect(r.valid).toBe(false)
  })

  it('rejects an expired authorization', () => {
    const p = validPayload()
    ;(p.payload.authorization as Record<string, unknown>).validBefore = Math.floor(Date.now() / 1000) - 10
    const r = verifyX402Payment(header(p), REQ)
    expect(r.valid).toBe(false)
  })

  it('rejects a non-exact scheme', () => {
    const r = verifyX402Payment(header(validPayload({ scheme: 'upto' })), REQ)
    expect(r.valid).toBe(false)
  })
})
