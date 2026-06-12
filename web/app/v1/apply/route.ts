/**
 * POST /v1/apply — Fast Apply endpoint.
 *
 * Merge a terse AI edit into a full file with a cheap fast model instead of
 * re-emitting the whole file from the expensive model.
 *
 *   curl https://agentbot.sh/v1/apply \
 *     -H "authorization: Bearer ogw_live_..." \
 *     -H "content-type: application/json" \
 *     -d '{"code":"<original>","edit":"<lazy edit with // ... existing code ...>"}'
 *
 *   → { "merged": "<full updated file>", "model": "...", "provider": "..." }
 */
import { NextRequest } from 'next/server'
import { authenticateGatewayRequest, gatewayCorsHeaders, openAiError } from '@/app/lib/opengateway'
import { fastApply } from '@/app/lib/fast-apply'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { apiOk } from '@/app/lib/api/respond'
import { readJson, str } from '@/app/lib/api/body'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: gatewayCorsHeaders() })
}

export async function POST(req: NextRequest) {
  // AI-cost endpoint — rate-limit first
  if (await checkRateLimit(req, 'ai')) {
    return openAiError('Rate limit exceeded. Slow down and retry.', 429, 'rate_limited')
  }

  // Same key/x402 auth posture as the chat endpoint
  const paymentSignature = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
  const auth = await authenticateGatewayRequest(req.headers)
  if (!auth && !paymentSignature) {
    return openAiError('Authentication required. Provide an API key or x402 payment.', 401, 'unauthorized')
  }

  const parsed = await readJson<{ code?: unknown; edit?: unknown; instructions?: unknown; model?: unknown }>(req)
  if (!parsed.ok) return openAiError('Request body must be valid JSON.', 400, 'invalid_json')

  const code = str(parsed.data.code, '', 60_000)
  const edit = str(parsed.data.edit, '', 60_000)
  const instructions = str(parsed.data.instructions, '', 2_000)
  const model = str(parsed.data.model, '', 120)

  if (!code.trim()) return openAiError('Missing required field: code.', 400, 'missing_code')
  if (!edit.trim()) return openAiError('Missing required field: edit.', 400, 'missing_edit')

  try {
    const result = await fastApply({ code, edit, instructions: instructions || undefined, model: model || undefined })
    return apiOk(result, 200, gatewayCorsHeaders())
  } catch (error) {
    return openAiError(
      error instanceof Error ? error.message : 'Fast apply failed',
      502,
      'apply_failed',
    )
  }
}
