/**
 * Escrow collection endpoint for a single agent (the payee).
 *
 *   POST /api/agents/:id/escrow
 *     Open a funded escrow. The payer provides an x402 USDC authorization via the
 *     `payment-signature` header (held, not yet settled) plus a milestone
 *     description and amount. We verify the authorization targets the agent
 *     owner's wallet for ≥ the amount, then store the hold and return a one-time
 *     `releaseToken` the payer must keep to release or refund later.
 *
 *   GET /api/agents/:id/escrow
 *     Public list of escrows where this agent is the payee (no auth blobs/tokens).
 *
 * Discovery gate: only showcased agents are escrow-addressable, same as the card.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { apiOk, apiError, notFound } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { readJson, str } from '@/app/lib/api/body'
import { verifyX402Payment } from '@/app/lib/x402-verify'
import { usdcFor } from '@/app/lib/usdc'
import { createEscrow, listEscrowsByPayee, toPublic } from '@/app/lib/escrow'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const runtime = 'nodejs'

/** Floor an escrow can't go below: 0.001 USDC, matching the A2A task floor. */
const MIN_ESCROW_AMOUNT = 1000n

async function loadShowcasedAgent(id: string) {
  const agent = await prisma.agent
    .findUnique({ where: { id }, select: { id: true, userId: true, showcaseOptIn: true } })
    .catch(() => null)
  if (!agent || !agent.showcaseOptIn) return null
  return agent
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await checkRateLimit(req, 'read')) return apiError('Too many requests', 429)
  const { id } = await params
  const agent = await loadShowcasedAgent(id.trim())
  if (!agent) return notFound('Agent not found')

  const escrows = await listEscrowsByPayee(agent.id)
  return apiOk({ escrows }, 200, { 'Access-Control-Allow-Origin': '*' })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await checkRateLimit(req, 'write')) return apiError('Too many requests', 429)

  const { id } = await params
  const agent = await loadShowcasedAgent(id.trim())
  if (!agent) return notFound('Agent not found')

  // Payee must have a wallet — escrow needs somewhere to release funds to.
  const wallet = await prisma.wallet
    .findFirst({ where: { userId: agent.userId }, select: { address: true, network: true } })
    .catch(() => null)
  if (!wallet) {
    return apiError('This agent has no wallet and cannot receive escrowed payment', 409, 'no_wallet')
  }

  const parsed = await readJson<{ amount?: unknown; milestone?: unknown }>(req)
  if (!parsed.ok) return apiError('Invalid JSON body', 400, 'invalid_body')

  const milestone = str(parsed.data.milestone, '', 2000).trim()
  if (!milestone) return apiError('milestone is required', 400, 'missing_milestone')

  // Amount: smallest-unit USDC, as a string to avoid float loss.
  let amount: bigint
  try {
    amount = BigInt(String(parsed.data.amount ?? '0'))
  } catch {
    return apiError('amount must be an integer in USDC smallest units', 400, 'bad_amount')
  }
  if (amount < MIN_ESCROW_AMOUNT) {
    return apiError(`amount below minimum (${MIN_ESCROW_AMOUNT} smallest units)`, 400, 'amount_too_low')
  }

  // The held funds: an x402 authorization targeting the payee wallet for ≥ amount.
  const usdc = usdcFor(wallet.network)
  const header = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
  const verdict = verifyX402Payment(header, {
    payTo: wallet.address,
    asset: usdc.asset,
    network: usdc.caip2,
    minAmount: amount,
  })
  if (!verdict.valid) {
    return apiError(
      `Escrow requires a held x402 authorization (${verdict.reason}): authorize ≥ ${amount} USDC (smallest unit) to ${wallet.address} on ${usdc.caip2} via a payment-signature header.`,
      402,
      'payment_required',
    )
  }

  // If the buyer is signed in, tag the hold with their user id so they can
  // release/refund from the dashboard without re-presenting the one-time token.
  const session = await getAuthSession().catch(() => null)
  const payerOwnerId = session?.user?.id

  const { escrow, releaseToken } = await createEscrow({
    payeeAgentId: agent.id,
    payerAddress: verdict.payer ?? 'unknown',
    payeeAddress: wallet.address,
    amount: amount.toString(),
    asset: usdc.asset,
    network: usdc.caip2,
    milestone,
    authorization: (header as string).trim(),
    ...(payerOwnerId ? { payerOwnerId } : {}),
  })

  // releaseToken is returned exactly once — the payer must store it to later
  // release or refund. We persist only its hash.
  return apiOk(
    {
      escrow: toPublic(escrow),
      releaseToken,
      note: 'Store releaseToken securely — it is required to release or refund and is shown only once.',
    },
    201,
    { 'Access-Control-Allow-Origin': '*' },
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, payment-signature',
    },
  })
}
