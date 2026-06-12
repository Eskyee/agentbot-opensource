/**
 * x402 payment verification — the single place the platform validates a
 * `payment-signature` header. Today the rest of the codebase only checks the
 * header is *present*; this performs real structural + target verification and
 * fails closed.
 *
 * What this verifies (self-contained, no network):
 *   - the header decodes to a well-formed x402 PaymentPayload
 *   - scheme is "exact" and the network matches what we require
 *   - the embedded EIP-3009 authorization transfers ≥ the required amount of the
 *     expected asset (USDC) to the expected payTo address
 *   - the authorization has not expired (validBefore in the future)
 *
 * What it does NOT yet verify (documented gap — needs a facilitator/RPC):
 *   - the EIP-712 signature over the authorization (cryptographic payer proof)
 *   - that the transfer actually settled on-chain
 * Wire a facilitator (verify+settle) to close these; this util is where to do it.
 */

export type X402Requirements = {
  payTo: string
  /** USDC contract address on the target chain */
  asset: string
  /** CAIP-2 network, e.g. "eip155:8453" (Base) */
  network: string
  /** smallest-unit minimum (USDC has 6 decimals) */
  minAmount: bigint
}

export type X402VerifyResult =
  | { valid: true; payer?: string; amount: bigint; network: string }
  | { valid: false; reason: string }

function decodeHeader(header: string): unknown {
  try {
    // x402 headers are base64(JSON). Tolerate base64url too.
    const normalized = header.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function eq(a: unknown, b: string): boolean {
  return typeof a === 'string' && a.toLowerCase() === b.toLowerCase()
}

/**
 * Verify a `payment-signature` header against the requirements. Pure + sync;
 * safe to call from any route. Returns a typed pass/fail with a reason.
 */
export function verifyX402Payment(header: string | null | undefined, req: X402Requirements): X402VerifyResult {
  if (!header || !header.trim()) return { valid: false, reason: 'missing payment-signature header' }

  const decoded = decodeHeader(header.trim())
  if (!decoded || typeof decoded !== 'object') return { valid: false, reason: 'payment payload is not valid base64 JSON' }

  const payload = decoded as Record<string, unknown>
  if (payload.x402Version !== 1 && payload.x402Version !== 2) {
    return { valid: false, reason: 'unsupported or missing x402Version' }
  }
  if (!eq(payload.scheme, 'exact')) {
    return { valid: false, reason: `unsupported scheme: ${String(payload.scheme)}` }
  }
  if (!eq(payload.network, req.network)) {
    return { valid: false, reason: `wrong network: ${String(payload.network)} (expected ${req.network})` }
  }

  // EVM "exact" scheme: payload.payload = { signature, authorization: {...} }
  const inner = payload.payload as Record<string, unknown> | undefined
  const auth = inner?.authorization as Record<string, unknown> | undefined
  if (!auth || typeof auth !== 'object') {
    return { valid: false, reason: 'missing transfer authorization' }
  }

  if (!eq(auth.to, req.payTo)) {
    return { valid: false, reason: 'authorization pays a different address than required' }
  }

  // Asset can live on the authorization or the payload depending on client.
  const asset = (auth.asset as string) || (inner?.asset as string) || ''
  if (asset && !eq(asset, req.asset)) {
    return { valid: false, reason: 'authorization is for a different asset than required' }
  }

  let amount: bigint
  try {
    amount = BigInt(String(auth.value ?? '0'))
  } catch {
    return { valid: false, reason: 'authorization value is not an integer' }
  }
  if (amount < req.minAmount) {
    return { valid: false, reason: `amount ${amount} below required ${req.minAmount}` }
  }

  // Freshness: validBefore must be in the future (seconds since epoch).
  const validBefore = Number(auth.validBefore ?? 0)
  if (validBefore && Number.isFinite(validBefore)) {
    const nowSec = Math.floor(Date.now() / 1000)
    if (validBefore <= nowSec) return { valid: false, reason: 'authorization has expired' }
  }

  const payer = typeof auth.from === 'string' ? auth.from : undefined
  return { valid: true, payer, amount, network: req.network }
}
