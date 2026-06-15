/**
 * Fast Apply — merge a terse, lazy AI edit into a full file.
 *
 * The expensive model emits only the changed regions with `// ... existing code ...`
 * markers; a cheap fast model expands that into the complete updated file. This is
 * dramatically cheaper and faster than having the big model re-emit whole files,
 * and is the pattern Morph productized as "Fast Apply" (10k+ tok/s).
 *
 * We don't have a fine-tuned apply model, so we drive a small fast model (MiMo
 * Flash by default) with a strict merge prompt and deterministic settings.
 */
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from './opengateway'

export const FAST_APPLY_MODEL = 'xiaomi/mimo-v2-flash'
const MAX_FILE_CHARS = 60_000

export type FastApplyResult = {
  merged: string
  model: string
  provider: string
}

function buildApplyMessages(code: string, edit: string, instructions?: string) {
  const system = [
    'You are a fast code-merge engine. You receive an ORIGINAL file and an EDIT',
    'snippet. The edit uses comments like "// ... existing code ..." to stand in for',
    'unchanged regions. Produce the COMPLETE updated file with the edit applied.',
    '',
    'Rules:',
    '- Output ONLY the final file contents. No markdown fences, no commentary.',
    '- Preserve everything not touched by the edit, exactly.',
    '- Expand every "existing code" placeholder back to the original lines.',
    '- Keep the original indentation style and trailing newline.',
    '- Never invent code beyond what the edit implies.',
  ].join('\n')

  const user = [
    instructions ? `Intent: ${instructions}\n` : '',
    '<ORIGINAL_FILE>',
    code,
    '</ORIGINAL_FILE>',
    '',
    '<EDIT>',
    edit,
    '</EDIT>',
    '',
    'Return the complete merged file.',
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/** Strip accidental markdown fences the model may wrap around the file. */
function unfence(text: string): string {
  const trimmed = text.trim()
  const fence = trimmed.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/)
  return fence ? fence[1] : trimmed
}

export async function fastApply(params: {
  code: string
  edit: string
  instructions?: string
  model?: string
}): Promise<FastApplyResult> {
  const code = params.code.slice(0, MAX_FILE_CHARS)
  const edit = params.edit.slice(0, MAX_FILE_CHARS)
  if (!code.trim()) throw new Error('fast-apply: empty original code')
  if (!edit.trim()) throw new Error('fast-apply: empty edit')

  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) throw new Error('No gateway upstream configured for fast-apply')

  const model = params.model?.trim() || FAST_APPLY_MODEL
  const messages = buildApplyMessages(code, edit, params.instructions)
  let lastFailure = ''

  for (const upstream of upstreams) {
    try {
      const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: gatewayUpstreamHeaders(upstream, 'Agentbot Fast Apply'),
        body: JSON.stringify({
          model: normalizeGatewayModel(model, upstream.provider),
          messages,
          temperature: 0, // deterministic merge
          max_tokens: 16_000,
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
      if (!content || !content.trim()) {
        lastFailure = `${upstream.provider} returned empty merge`
        continue
      }

      return { merged: unfence(content), model, provider: upstream.provider }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'fast-apply request failed'
    }
  }

  throw new Error(lastFailure || 'fast-apply: all upstreams failed')
}
