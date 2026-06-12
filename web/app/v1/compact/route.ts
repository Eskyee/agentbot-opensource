/**
 * POST /v1/compact — Context Compaction endpoint.
 *
 * Compress a long conversation so a 24/7 agent stays cheap and coherent. Keeps
 * the most recent turns verbatim and folds older turns into a fact-preserving
 * digest via a cheap fast model.
 *
 *   curl https://agentbot.sh/v1/compact \
 *     -H "authorization: Bearer ogw_live_..." \
 *     -H "content-type: application/json" \
 *     -d '{"messages":[...],"keep_recent":6}'
 *
 *   → { messages, summary, compactedCount, tokensBefore, tokensAfter, ... }
 */
import { NextRequest } from 'next/server'
import { authenticateGatewayRequest, gatewayCorsHeaders, openAiError } from '@/app/lib/opengateway'
import { compactMessages, type ChatMessage } from '@/app/lib/compaction'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { apiOk } from '@/app/lib/api/respond'
import { readJson, num, str } from '@/app/lib/api/body'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: gatewayCorsHeaders() })
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  const out: ChatMessage[] = []
  for (const entry of raw as unknown[]) {
    if (!entry || typeof entry !== 'object') continue
    const m = entry as { role?: unknown; content?: unknown }
    const role = str(m.role, 'user', 20)
    const content = typeof m.content === 'string' ? m.content : ''
    if (content) out.push({ role, content })
  }
  return out
}

export async function POST(req: NextRequest) {
  if (await checkRateLimit(req, 'ai')) {
    return openAiError('Rate limit exceeded. Slow down and retry.', 429, 'rate_limited')
  }

  const paymentSignature = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
  const auth = await authenticateGatewayRequest(req.headers)
  if (!auth && !paymentSignature) {
    return openAiError('Authentication required. Provide an API key or x402 payment.', 401, 'unauthorized')
  }

  const parsed = await readJson<{ messages?: unknown; keep_recent?: unknown; prior_summary?: unknown; model?: unknown }>(req)
  if (!parsed.ok) return openAiError('Request body must be valid JSON.', 400, 'invalid_json')

  const messages = sanitizeMessages(parsed.data.messages)
  if (messages.length === 0) return openAiError('Missing required field: messages.', 400, 'missing_messages')

  const keepRecent = num(parsed.data.keep_recent, 6, 0, 50)
  const priorSummary = str(parsed.data.prior_summary, '', 8_000)
  const model = str(parsed.data.model, '', 120)

  try {
    const result = await compactMessages({
      messages,
      keepRecent,
      priorSummary: priorSummary || undefined,
      model: model || undefined,
    })
    return apiOk(result, 200, gatewayCorsHeaders())
  } catch (error) {
    return openAiError(error instanceof Error ? error.message : 'Compaction failed', 502, 'compaction_failed')
  }
}
