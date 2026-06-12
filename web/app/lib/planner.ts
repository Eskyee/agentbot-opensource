/**
 * Subagent planner — decompose a goal into specialized subtasks.
 *
 * Anthropic's research: a lead planner coordinating specialized sub-agents beats
 * single-agent by up to 90% on hard tasks, and subagents are the cheapest
 * multi-agent pattern (one call per delegation). This produces the plan; the
 * caller (OpenClaw runtime) executes each subtask, routing it through the
 * gateway's `model:auto` so each gets the cheapest capable model.
 */
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from './opengateway'
import { extractJson } from './playground-generation'

export const PLANNER_MODEL = 'xiaomi/mimo-v2.5-pro'

export type SubtaskRole = 'search' | 'generate' | 'review' | 'analyze' | 'execute' | 'other'

export type Subtask = {
  id: string
  title: string
  description: string
  role: SubtaskRole
  /** route hint for the gateway: cost | balanced | quality */
  priority: 'cost' | 'balanced' | 'quality'
  dependsOn: string[]
}

export type Plan = {
  goal: string
  summary: string
  subtasks: Subtask[]
  model: string
  provider: string
}

const ROLES: SubtaskRole[] = ['search', 'generate', 'review', 'analyze', 'execute', 'other']

function buildMessages(goal: string, context?: string) {
  const system = [
    'You are a lead planner that decomposes a goal into a minimal set of subtasks',
    'for specialized sub-agents. Fewer, well-scoped subtasks beat many tiny ones.',
    '',
    'Return ONLY valid JSON (no markdown):',
    '{',
    '  "summary": "<one sentence plan overview>",',
    '  "subtasks": [',
    '    {',
    '      "id": "t1",',
    '      "title": "<short>",',
    '      "description": "<what the sub-agent must do, self-contained>",',
    '      "role": "search|generate|review|analyze|execute|other",',
    '      "priority": "cost|balanced|quality",',
    '      "dependsOn": ["t0"]',
    '    }',
    '  ]',
    '}',
    '',
    'Rules:',
    '- 2–6 subtasks. Order them; use dependsOn for real dependencies only.',
    '- Use "cost" priority for simple/search tasks, "quality" for hard reasoning.',
    '- Each description must be runnable without seeing the others.',
  ].join('\n')

  const user = [context ? `Context:\n${context}\n` : '', `Goal:\n${goal}`].join('\n')
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

function normalizeSubtasks(raw: unknown): Subtask[] {
  if (!raw || typeof raw !== 'object') return []
  const list = (raw as { subtasks?: unknown }).subtasks
  if (!Array.isArray(list)) return []
  const out: Subtask[] = []
  list.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') return
    const e = entry as Record<string, unknown>
    const id = typeof e.id === 'string' && e.id.trim() ? e.id.trim().slice(0, 24) : `t${i + 1}`
    const title = typeof e.title === 'string' ? e.title.slice(0, 120) : `Step ${i + 1}`
    const description = typeof e.description === 'string' ? e.description.slice(0, 2_000) : ''
    if (!description.trim()) return
    const role = ROLES.includes(e.role as SubtaskRole) ? (e.role as SubtaskRole) : 'other'
    const priority =
      e.priority === 'cost' || e.priority === 'quality' ? e.priority : 'balanced'
    const dependsOn = Array.isArray(e.dependsOn)
      ? e.dependsOn.filter((d): d is string => typeof d === 'string').slice(0, 6)
      : []
    out.push({ id, title, description, role, priority, dependsOn })
  })
  return out.slice(0, 6)
}

export async function planGoal(goal: string, opts?: { context?: string; model?: string }): Promise<Plan> {
  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) throw new Error('No gateway upstream configured for planning')

  const model = opts?.model?.trim() || PLANNER_MODEL
  const messages = buildMessages(goal, opts?.context)
  let lastFailure = ''

  for (const upstream of upstreams) {
    try {
      const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: gatewayUpstreamHeaders(upstream, 'Agentbot Planner'),
        body: JSON.stringify({
          model: normalizeGatewayModel(model, upstream.provider),
          messages,
          temperature: 0.3,
          max_tokens: 2_000,
          ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        lastFailure = `${upstream.provider} ${response.status}${text ? `: ${text.slice(0, 160)}` : ''}`
        if (shouldTryNextGatewayUpstream(response.status)) continue
        throw new Error(lastFailure)
      }
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        lastFailure = `${upstream.provider} returned no content`
        continue
      }
      const json = extractJson(content) as { summary?: unknown }
      const subtasks = normalizeSubtasks(json)
      if (subtasks.length === 0) {
        lastFailure = `${upstream.provider} produced no subtasks`
        continue
      }
      return {
        goal,
        summary: typeof json.summary === 'string' ? json.summary.slice(0, 280) : 'Plan ready.',
        subtasks,
        model,
        provider: upstream.provider,
      }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'planning request failed'
    }
  }

  throw new Error(lastFailure || 'planner: all upstreams failed')
}
