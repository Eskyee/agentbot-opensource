/**
 * POST /v1/plan — subagent planner.
 *
 * Decompose a goal into a minimal set of specialized subtasks (with per-task
 * priority hints the caller can feed straight into model:auto). The OpenClaw
 * runtime executes each subtask; this just produces the plan.
 *
 *   curl https://agentbot.sh/v1/plan \
 *     -H "authorization: Bearer ogw_live_..." \
 *     -H "content-type: application/json" \
 *     -d '{"goal":"Add dark mode to the dashboard","context":"Next.js + Tailwind"}'
 *
 *   → { goal, summary, subtasks: [{ id, title, description, role, priority, dependsOn }] }
 */
import { NextRequest } from 'next/server'
import { authenticateGatewayRequest, gatewayCorsHeaders, openAiError } from '@/app/lib/opengateway'
import { planGoal } from '@/app/lib/planner'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { apiOk } from '@/app/lib/api/respond'
import { readJson, str } from '@/app/lib/api/body'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: gatewayCorsHeaders() })
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

  const parsed = await readJson<{ goal?: unknown; context?: unknown; model?: unknown }>(req)
  if (!parsed.ok) return openAiError('Request body must be valid JSON.', 400, 'invalid_json')

  const goal = str(parsed.data.goal, '', 4_000).trim()
  if (goal.length < 8) return openAiError('Describe the goal in at least 8 characters.', 400, 'missing_goal')

  const context = str(parsed.data.context, '', 8_000)
  const model = str(parsed.data.model, '', 120)

  try {
    const plan = await planGoal(goal, { context: context || undefined, model: model || undefined })
    return apiOk(plan, 200, gatewayCorsHeaders())
  } catch (error) {
    return openAiError(error instanceof Error ? error.message : 'Planning failed', 502, 'plan_failed')
  }
}
