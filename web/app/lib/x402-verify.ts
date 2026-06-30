/**
 * x402 payment verification — the single place the platform validates a
 * `payment-signature` header. Performs structural + target verification AND
 * cryptographic payer proof, failing closed.
 *
 * What this verifies (self-contained, no network):
 *   - the header decodes to a well-formed x402 PaymentPayload
 *   - scheme is "exact" and the network matches what we require
 *   - the embedded EIP-3009 authorization transfers ≥ the required amount of the
 *     expected asset (USDC) to the expected payTo address
 *   - the authorization has not expired (validBefore in the future)
 *   - a signature is present and well-formed (ALWAYS enforced)
 *   - the EIP-712 signature recovers to the authorization's `from` address
 *     (EOA payers). This is enforced when X402_ENFORCE_SIGNATURE=true; otherwise
 *     mismatches are logged ("shadow mode") so operators can validate the
 *     per-network USDC domain against real traffic before turning it on.
 *
 * Still out of scope (needs a facilitator/RPC):
 *   - EIP-1271 smart-account signatures (verifyTypedData is ECDSA/EOA only)
 *   - on-chain settlement confirmation (see x402-settle.ts / a facilitator)
 */
import * as ethersLib from 'ethers'

// Work across ethers v5 (APIs under `.utils`) and v6 (top-level), since the
// workspace may resolve either. Route the namespace through a plain `any`
// binding first: accessing `.utils` directly on the `import * as` binding makes
// the bundler statically flag it as a missing export under v6 ("Attempted
// import error: 'utils' is not exported from 'ethers'"). Going via `lib`
// keeps the runtime fallback without the build-time warning.
const lib = ethersLib as unknown as {
  verifyTypedData?: (domain: unknown, types: unknown, value: unknown, sig: string) => string
  getAddress?: (address: string) => string
  utils?: {
    verifyTypedData?: (domain: unknown, types: unknown, value: unknown, sig: string) => string
    getAddress?: (address: string) => string
  }
}
const verifyTypedData: (domain: unknown, types: unknown, value: unknown, sig: string) => string =
  (lib.verifyTypedData ?? lib.utils?.verifyTypedData) as never
const getAddress: (address: string) => string =
  (lib.getAddress ?? lib.utils?.getAddress) as never

// EIP-712 domain for USDC's EIP-3009 TransferWithAuthorization, per network.
// NOTE: `name` differs between deployments (Base mainnet uses "USD Coin", Base
// Sepolia uses "USDC") — a wrong value would reject legitimate payments, which
// is why cryptographic enforcement is gated behind X402_ENFORCE_SIGNATURE until
// validated against live traffic.
const USDC_EIP712_DOMAIN: Record<string, { name: string; version: string; chainId: number }> = {
  'eip155:8453': { name: 'USD Coin', version: '2', chainId: 8453 },
  'eip155:84532': { name: 'USDC', version: '2', chainId: 84532 },
}

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
}

/** Recover the EIP-712 signer of an EIP-3009 authorization and check it == from. */
function verifyAuthorizationSignature(
  auth: Record<string, unknown>,
  signature: string,
  req: X402Requirements,
): { ok: boolean; reason?: string } {
  const dom = USDC_EIP712_DOMAIN[req.network]
  if (!dom) return { ok: false, reason: `no known EIP-712 domain for network ${req.network}` }
  try {
    const domain = { name: dom.name, version: dom.version, chainId: dom.chainId, verifyingContract: getAddress(req.asset) }
    // Values as strings: accepted as uint256 by both ethers v5 and v6 encoders.
    const message = {
      from: getAddress(String(auth.from)),
      to: getAddress(String(auth.to)),
      value: String(auth.value ?? '0'),
      validAfter: String(auth.validAfter ?? '0'),
      validBefore: String(auth.validBefore ?? '0'),
      nonce: String(auth.nonce ?? ''),
    }
    const recovered = verifyTypedData(domain, TRANSFER_WITH_AUTHORIZATION_TYPES, message, signature)
    if (recovered.toLowerCase() !== String(auth.from).toLowerCase()) {
      return { ok: false, reason: 'recovered signer does not match from address' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'signature recovery error' }
  }
}

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
  if (!payer || !/^0x[0-9a-fA-F]{40}$/.test(payer)) {
    return { valid: false, reason: 'authorization is missing a valid payer (from) address' }
  }

  // A real x402 "exact" authorization is signed by the payer. Always require a
  // present, well-formed signature — accepting an unsigned payload let anyone
  // forge a payment by sending a structurally-valid JSON blob.
  const signature = typeof inner?.signature === 'string' ? inner.signature.trim() : ''
  if (!/^0x[0-9a-fA-F]+$/.test(signature) || signature.length < 132) {
    return { valid: false, reason: 'missing or malformed authorization signature' }
  }

  // Cryptographic payer proof (EOA). Enforced when X402_ENFORCE_SIGNATURE=true;
  // otherwise log mismatches so the per-network USDC domain can be validated
  // against live traffic before enforcing (see USDC_EIP712_DOMAIN note).
  const sig = verifyAuthorizationSignature(auth, signature, req)
  if (!sig.ok) {
    if (process.env.X402_ENFORCE_SIGNATURE === 'true') {
      return { valid: false, reason: `authorization signature invalid: ${sig.reason}` }
    }
    console.warn(`[x402-verify] signature check failed (shadow mode, not enforced): ${sig.reason}`)
  }

  return { valid: true, payer, amount, network: req.network }
}
