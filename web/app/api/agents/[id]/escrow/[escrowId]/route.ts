/**
 * A single escrow: status + lifecycle actions.
 *
 *   GET  /api/agents/:id/escrow/:escrowId            → public escrow status
 *   POST /api/agents/:id/escrow/:escrowId            → { action, ... }
 *     action: 'submit'   (payee) — mark milestone work submitted   { submission }
 *     action: 'release'  (payer) — release hold to payee            { releaseToken, resolution? }
 *     action: 'refund'   (payer) — refund, hold never settles       { releaseToken, resolution? }
 *     action: 'dispute'  (either)— flag for arbitration             { reason }
 *
 * Auth model: the money-moving actions (release, refund) require the one-time
 * `releaseToken` issued to the payer at open time — fail-closed, no token no
 * release. `submit` and `dispute` are low-risk state hints and only need the
 * escrow id. On release we bump the payee agent's *paid* reputation, because an
 * escrow that settles is the realest signal of paid work on the platform.
 */
import { NextRequest } from 'next/server'
import { apiOk, apiError, notFound } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { readJson, str } from '@/app/lib/api/body'
import {
  getEscrow,
  toPublic,
  tokenMatches,
  submitWork,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  recordSettlement,
  type Escrow,
} from '@/app/lib/escrow'
import { recordCompletion } from '@/app/lib/a2a-tasks'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { settleViaFacilitator } from '@/app/lib/x402-settle'

export const runtime = 'nodejs'

function isError(v: Escrow | { error: string }): v is { error: string } {
  return 'error' in v
}

async function loadEscrowFor(agentId: string, escrowId: string): Promise<Escrow | null> {
  const e = await getEscrow(escrowId.trim())
  // Scope the escrow to the agent in the path — prevents cross-agent id probing.
  if (!e || e.payeeAgentId !== agentId) return null
  return e
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; escrowId: string }> },
) {
  if (await checkRateLimit(req, 'read')) return apiError('Too many requests', 429)
  const { id, escrowId } = await params
  const e = await loadEscrowFor(id.trim(), escrowId)
  if (!e) return notFound('Escrow not found')
  return apiOk({ escrow: toPublic(e) }, 200, { 'Access-Control-Allow-Origin': '*' })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; escrowId: string }> },
) {
  if (await checkRateLimit(req, 'write')) return apiError('Too many requests', 429)

  const { id, escrowId } = await params
  const agentId = id.trim()
  const e = await loadEscrowFor(agentId, escrowId)
  if (!e) return notFound('Escrow not found')

  const parsed = await readJson<{
    action?: unknown
    releaseToken?: unknown
    submission?: unknown
    resolution?: unknown
    reason?: unknown
  }>(req)
  if (!parsed.ok) return apiError('Invalid JSON body', 400, 'invalid_body')

  const action = str(parsed.data.action, '', 20).toLowerCase()

  if (action === 'submit') {
    const submission = str(parsed.data.submission, '', 2000)
    const result = await submitWork(e.id, submission)
    if (isError(result)) return apiError(result.error, 409, 'bad_transition')
    return apiOk({ escrow: toPublic(result) }, 200, { 'Access-Control-Allow-Origin': '*' })
  }

  if (action === 'release' || action === 'refund') {
    // Authorize the money-moving action two ways, both fail-closed:
    //   1) the one-time releaseToken (external/anonymous payer), or
    //   2) the signed-in buyer who opened the hold (dashboard approval).
    const token = str(parsed.data.releaseToken, '', 200)
    const tokenOk = Boolean(token) && tokenMatches(token, e.releaseTokenHash)
    let ownerOk = false
    if (!tokenOk && e.payerOwnerId) {
      const session = await getAuthSession().catch(() => null)
      ownerOk = Boolean(session?.user?.id) && session!.user!.id === e.payerOwnerId
    }
    if (!tokenOk && !ownerOk) {
      return apiError('Not authorized to release or refund this escrow', 403, 'forbidden')
    }
    const resolution = str(parsed.data.resolution, '', 500)

    if (action === 'release') {
      const firstRelease = e.state !== 'released'
      const result = await releaseEscrow(e.id, resolution)
      if (isError(result)) return apiError(result.error, 409, 'bad_transition')

      // Released escrow = real paid work → bump the payee's paid reputation once.
      if (firstRelease) {
        await recordCompletion(e.payeeAgentId, true).catch(() => {})
      }

      // Settle the held authorization on-chain via the facilitator. If a
      // facilitator isn't configured we still release (the buyer settles the
      // held authorization manually) — settlement is additive, never blocking.
      let settlement: { status: string; txHash?: string; reason?: string } = { status: 'unconfigured' }
      if (firstRelease) {
        const r = await settleViaFacilitator(e.authorization, {
          payTo: e.payeeAddress,
          asset: e.asset,
          network: e.network,
          amount: BigInt(e.amount),
        }).catch((err) => ({ status: 'failed', reason: err instanceof Error ? err.message : 'settle error' }) as const)
        settlement = r
        if (r.status === 'settled') await recordSettlement(e.id, r.txHash)
      }

      const fresh = (await getEscrow(e.id)) ?? result
      return apiOk(
        { escrow: toPublic(fresh), settlement },
        200,
        { 'Access-Control-Allow-Origin': '*' },
      )
    }

    const result = await refundEscrow(e.id, resolution)
    if (isError(result)) return apiError(result.error, 409, 'bad_transition')
    return apiOk({ escrow: toPublic(result) }, 200, { 'Access-Control-Allow-Origin': '*' })
  }

  if (action === 'dispute') {
    const reason = str(parsed.data.reason, '', 500)
    const result = await disputeEscrow(e.id, reason)
    if (isError(result)) return apiError(result.error, 409, 'bad_transition')
    return apiOk({ escrow: toPublic(result) }, 200, { 'Access-Control-Allow-Origin': '*' })
  }

  return apiError('Unknown action. Use submit | release | refund | dispute.', 400, 'bad_action')
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    },
  })
}
