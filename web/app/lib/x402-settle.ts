/**
 * x402 settlement via a facilitator — the on-chain half of the payment story.
 *
 * lib/x402-verify.ts checks an authorization *structurally* (scheme, network,
 * asset, target, amount, freshness) with no network calls. What it can't do
 * locally is (a) cryptographically verify the EIP-712 signature and (b) actually
 * move the USDC on-chain. Both require an x402 *facilitator* — a service that
 * exposes `/verify` and `/settle` over the standard x402 payload shape.
 *
 * This module wires that facilitator. Configure it with:
 *   X402_FACILITATOR_URL   e.g. https://x402.org/facilitator  (or a CDP endpoint)
 *   X402_FACILITATOR_KEY   optional bearer token, if the facilitator requires one
 *
 * Fail-closed everywhere: if the facilitator isn't configured we return
 * { status: 'unconfigured' } and callers must NOT treat the payment as settled.
 * If it's configured but the call fails or reports invalid, we return 'failed'.
 * Only a facilitator success returns 'settled' with the on-chain tx hash.
 */
import { safeFetch } from './api/fetch'

export type SettleRequirements = {
  payTo: string
  asset: string
  /** CAIP-2, e.g. eip155:8453 */
  network: string
  /** smallest-unit amount required */
  amount: bigint
}

export type SettleResult =
  | { status: 'settled'; txHash: string; payer?: string; network: string }
  | { status: 'unconfigured' }
  | { status: 'failed'; reason: string }

function facilitator(): { url: string; key?: string } | null {
  const url = process.env.X402_FACILITATOR_URL?.trim().replace(/\/+$/, '')
  if (!url) return null
  const key = process.env.X402_FACILITATOR_KEY?.trim()
  return { url, key: key || undefined }
}

/** Is on-chain settlement available in this environment? */
export function isSettlementConfigured(): boolean {
  return facilitator() !== null
}

function decode(header: string): Record<string, unknown> | null {
  try {
    const normalized = header.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf-8')
    const obj = JSON.parse(json)
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Build the standard x402 paymentRequirements object the facilitator expects.
 * Mirrors the `exact` EVM scheme fields.
 */
function buildRequirements(req: SettleRequirements) {
  return {
    scheme: 'exact',
    network: req.network,
    asset: req.asset,
    payTo: req.payTo,
    maxAmountRequired: req.amount.toString(),
    resource: 'agentbot:escrow',
    description: 'Agentbot escrow release',
    mimeType: 'application/json',
    maxTimeoutSeconds: 120,
  }
}

async function call(path: string, body: unknown): Promise<{ ok: boolean; json: Record<string, unknown> | null; status: number }> {
  const f = facilitator()
  if (!f) return { ok: false, json: null, status: 0 }
  const res = await safeFetch(`${f.url}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(f.key ? { authorization: `Bearer ${f.key}` } : {}),
    },
    body: JSON.stringify(body),
    timeoutMs: 15_000,
  })
  let json: Record<string, unknown> | null = null
  try {
    json = (await res.json()) as Record<string, unknown>
  } catch {
    json = null
  }
  return { ok: res.ok, json, status: res.status }
}

/**
 * Verify the authorization's signature + validity through the facilitator.
 * Returns true only on an explicit valid response. (Optional pre-check before
 * settle; settle also verifies, so this is mainly for the open-time gate.)
 */
export async function verifyViaFacilitator(
  authorizationHeader: string,
  req: SettleRequirements,
): Promise<{ valid: boolean; reason?: string; payer?: string }> {
  const f = facilitator()
  if (!f) return { valid: false, reason: 'facilitator not configured' }
  const payload = decode(authorizationHeader)
  if (!payload) return { valid: false, reason: 'authorization is not valid base64 JSON' }

  try {
    const { ok, json } = await call('/verify', {
      x402Version: payload.x402Version ?? 1,
      paymentPayload: payload,
      paymentRequirements: buildRequirements(req),
    })
    if (!ok || !json) return { valid: false, reason: 'facilitator verify call failed' }
    const valid = json.isValid === true || json.valid === true
    return {
      valid,
      reason: valid ? undefined : String(json.invalidReason ?? json.reason ?? 'invalid'),
      payer: typeof json.payer === 'string' ? json.payer : undefined,
    }
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : 'verify error' }
  }
}

/**
 * Settle a captured authorization on-chain via the facilitator. This is the line
 * the escrow `release` action calls. Returns the tx hash on success.
 */
export async function settleViaFacilitator(
  authorizationHeader: string,
  req: SettleRequirements,
): Promise<SettleResult> {
  const f = facilitator()
  if (!f) return { status: 'unconfigured' }

  const payload = decode(authorizationHeader)
  if (!payload) return { status: 'failed', reason: 'authorization is not valid base64 JSON' }

  try {
    const { ok, json, status } = await call('/settle', {
      x402Version: payload.x402Version ?? 1,
      paymentPayload: payload,
      paymentRequirements: buildRequirements(req),
    })
    if (!ok || !json) return { status: 'failed', reason: `facilitator settle returned ${status}` }

    const success = json.success === true
    const txHash =
      (typeof json.transaction === 'string' && json.transaction) ||
      (typeof json.txHash === 'string' && json.txHash) ||
      (typeof json.transactionHash === 'string' && json.transactionHash) ||
      ''
    if (!success || !txHash) {
      return { status: 'failed', reason: String(json.errorReason ?? json.error ?? 'settlement not confirmed') }
    }
    return {
      status: 'settled',
      txHash,
      payer: typeof json.payer === 'string' ? json.payer : undefined,
      network: req.network,
    }
  } catch (err) {
    return { status: 'failed', reason: err instanceof Error ? err.message : 'settle error' }
  }
}
