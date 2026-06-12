/**
 * Smart routing for `model: "auto"`.
 *
 * Inspects each request — estimated context size, tool/function definitions,
 * code content, and reasoning params — scores difficulty, and picks the
 * cheapest model expected to handle it. The caller (the /v1 route) walks the
 * returned ladder, escalating on rate-limit / 5xx / empty response, and tags
 * the winning model in the `x-gateway-served-model` response header.
 *
 * An optional route hint shapes the ladder:
 *   { "route": { "priority": "cost" | "balanced" | "quality", "max_cost_usd": 0.01 } }
 * The hint is stripped before the body reaches any upstream.
 */
import { estimateTokens } from './opengateway'

export type RoutePriority = 'cost' | 'balanced' | 'quality'

export type RouteHint = {
  priority?: RoutePriority
  max_cost_usd?: number
}

type ModelTier = {
  id: string
  /** rough USD per 1M output tokens — for ordering + max_cost filtering only */
  costPer1M: number
  /** difficulty ceiling this model handles well: 0..100 */
  capability: number
}

/**
 * Cost/capability ladder, cheapest first. Ids are gateway model strings.
 * Tuned to what the Agentbot gateway routes today; adjust as the catalog moves.
 */
const LADDER: ModelTier[] = [
  { id: 'xiaomi/mimo-v2-flash', costPer1M: 0.336, capability: 45 },
  { id: 'xiaomi/mimo-v2.5', costPer1M: 0.336, capability: 60 },
  { id: 'xiaomi/mimo-v2.5-pro', costPer1M: 1.044, capability: 78 },
  { id: 'google/gemini-2.5-flash', costPer1M: 1.8, capability: 82 },
  { id: 'anthropic/claude-sonnet-4.5', costPer1M: 15, capability: 96 },
]

const FALLBACK = 'xiaomi/mimo-v2.5-pro'

export function isAutoModel(model: string): boolean {
  const m = model.trim().toLowerCase()
  return m === 'auto' || m === 'gitlawb/auto' || m === 'agentbot/auto'
}

/** Score request difficulty 0..100 from cheap structural signals. */
export function scoreDifficulty(body: Record<string, unknown>): number {
  const messages = Array.isArray(body.messages) ? body.messages : []
  const text = messages.map((m) => (m && typeof m === 'object' ? (m as { content?: unknown }).content : '')).join('\n')
  const contextTokens = estimateTokens(text)

  let score = 0
  // Context size — long prompts need stronger models
  if (contextTokens > 16_000) score += 45
  else if (contextTokens > 6_000) score += 30
  else if (contextTokens > 1_500) score += 15

  // Tool/function calling implies agentic work
  const tools = body.tools ?? body.functions
  if (Array.isArray(tools) && tools.length > 0) score += 25

  // Reasoning params requested
  if (body.reasoning || body.reasoning_effort || body.thinking) score += 20

  // Code content — fenced blocks or heavy symbol density
  const codeFences = (text.match(/```/g) || []).length
  if (codeFences >= 2) score += 20
  else if (/[{};]\s*$/m.test(text) || /\b(function|class|import|def|const)\b/.test(text)) score += 10

  // Explicit large max_tokens output
  const maxTokens = Number(body.max_tokens) || 0
  if (maxTokens > 4000) score += 10

  return Math.min(100, score)
}

/**
 * Build an ordered list of candidate model ids for an auto request.
 * First entry is the primary pick; the rest are escalation/fallback steps.
 */
export function buildAutoLadder(body: Record<string, unknown>, hint?: RouteHint): string[] {
  const difficulty = scoreDifficulty(body)
  const priority: RoutePriority = hint?.priority ?? 'balanced'
  const maxCost = typeof hint?.max_cost_usd === 'number' ? hint.max_cost_usd * 1_000_000 : Infinity

  // Capability headroom required, shifted by priority
  const required =
    priority === 'quality' ? difficulty + 20 : priority === 'cost' ? difficulty - 10 : difficulty

  const affordable = LADDER.filter((t) => t.costPer1M <= maxCost)
  const pool = affordable.length > 0 ? affordable : LADDER

  // Candidates that clear the capability bar, cheapest first
  const capable = pool.filter((t) => t.capability >= required)
  const ordered = (capable.length > 0 ? capable : pool).slice()

  // For quality priority, prefer strongest first
  if (priority === 'quality') ordered.reverse()

  // Always append the rest of the pool (minus dupes) as deeper fallback,
  // capped at 3 attempts total before the route surfaces an error.
  const ids: string[] = []
  for (const t of [...ordered, ...pool]) {
    if (!ids.includes(t.id)) ids.push(t.id)
    if (ids.length >= 3) break
  }
  if (ids.length === 0) ids.push(FALLBACK)
  return ids
}

/** Remove the non-standard `route` hint so upstreams never see it. */
export function stripRouteHint(body: Record<string, unknown>): { body: Record<string, unknown>; hint?: RouteHint } {
  if (!body || typeof body !== 'object' || !('route' in body)) return { body }
  const { route, ...rest } = body
  const hint = route && typeof route === 'object' ? (route as RouteHint) : undefined
  return { body: rest, hint }
}
