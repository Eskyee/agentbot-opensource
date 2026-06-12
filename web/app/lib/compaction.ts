/**
 * Context Compaction — keep long-running agents alive cheaply.
 *
 * An OpenClaw agent that runs for days fills its context window and either
 * degrades or gets expensive. Compaction summarizes the older turns into a
 * compact, fact-preserving digest while keeping the most recent turns verbatim,
 * so the agent retains continuity at a fraction of the token cost.
 *
 * Strategy: keep the last `keepRecent` messages untouched; summarize everything
 * before them with a cheap fast model, preserving decisions, identifiers, open
 * tasks, and user preferences. Returns a new, shorter message array.
 */
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
  estimateTokens,
} from './opengateway'

export const COMPACTION_MODEL = 'xiaomi/mimo-v2-flash'

export type ChatMessage = { role: string; content: string }

export type CompactionResult = {
  messages: ChatMessage[]
  summary: string
  compactedCount: number
  tokensBefore: number
  tokensAfter: number
  model: string
  provider: string
}

function totalTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
}

function buildCompactionMessages(toSummarize: ChatMessage[], priorSummary?: string) {
  const system = [
    'You compress conversation history for a long-running AI agent without losing',
    'what matters. Produce a dense digest that preserves:',
    '- Decisions made and their rationale',
    '- Concrete identifiers (names, ids, URLs, file paths, amounts)',
    '- Open tasks and commitments still in flight',
    '- User preferences and constraints',
    '- Any state the agent must remember to stay consistent',
    '',
    'Drop pleasantries, redundant restatements, and resolved tangents.',
    'Write terse notes, not prose. Output ONLY the digest.',
  ].join('\n')

  const transcript = toSummarize.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
  const user = [
    priorSummary ? `Existing memory digest to extend:\n${priorSummary}\n` : '',
    'Conversation to fold into the digest:',
    transcript,
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export async function compactMessages(params: {
  messages: ChatMessage[]
  /** how many of the most recent messages to keep verbatim (default 6) */
  keepRecent?: number
  /** optional existing digest to extend instead of replace */
  priorSummary?: string
  model?: string
}): Promise<CompactionResult> {
  const keepRecent = Math.max(0, params.keepRecent ?? 6)
  const messages = params.messages
  const tokensBefore = totalTokens(messages)

  // Preserve a leading system message if present
  const systemMsgs = messages.filter((m, i) => m.role === 'system' && i < 2)
  const body = messages.filter((m) => !systemMsgs.includes(m))

  const recent = keepRecent > 0 ? body.slice(-keepRecent) : []
  const older = keepRecent > 0 ? body.slice(0, -keepRecent) : body

  if (older.length === 0) {
    // Nothing old enough to compact
    return {
      messages,
      summary: params.priorSummary ?? '',
      compactedCount: 0,
      tokensBefore,
      tokensAfter: tokensBefore,
      model: params.model ?? COMPACTION_MODEL,
      provider: 'none',
    }
  }

  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) throw new Error('No gateway upstream configured for compaction')

  const model = params.model?.trim() || COMPACTION_MODEL
  const reqMessages = buildCompactionMessages(older, params.priorSummary)
  let lastFailure = ''
  let digest = ''
  let usedProvider = ''

  for (const upstream of upstreams) {
    try {
      const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: gatewayUpstreamHeaders(upstream, 'Agentbot Compaction'),
        body: JSON.stringify({
          model: normalizeGatewayModel(model, upstream.provider),
          messages: reqMessages,
          temperature: 0,
          max_tokens: 2_000,
          ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        lastFailure = `${upstream.provider} failed with ${response.status}${text ? `: ${text.slice(0, 200)}` : ''}`
        if (shouldTryNextGatewayUpstream(response.status)) continue
        throw new Error(lastFailure)
      }
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content
      if (!content?.trim()) {
        lastFailure = `${upstream.provider} returned empty digest`
        continue
      }
      digest = content.trim()
      usedProvider = upstream.provider
      break
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'compaction request failed'
    }
  }

  if (!digest) throw new Error(lastFailure || 'compaction: all upstreams failed')

  const compacted: ChatMessage[] = [
    ...systemMsgs,
    { role: 'system', content: `[Compacted memory of ${older.length} earlier message(s)]\n${digest}` },
    ...recent,
  ]

  return {
    messages: compacted,
    summary: digest,
    compactedCount: older.length,
    tokensBefore,
    tokensAfter: totalTokens(compacted),
    model,
    provider: usedProvider,
  }
}
