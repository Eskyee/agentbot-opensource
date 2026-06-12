/**
 * Streaming generation — SSE.
 *
 * The model responds in the @@@ marker format (see playground-generation.ts),
 * which we parse incrementally and forward as events:
 *   meta        { title, summary }
 *   file_open   { path }
 *   file_chunk  { path, text }
 *   file_close  { path, content }
 *   done        { generation, provider, model }
 *   error       { error }
 *
 * The client writes files into the live Sandpack workbench as they stream,
 * so users watch their app assemble itself.
 */
import { NextRequest } from 'next/server'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
} from '@/app/lib/opengateway'
import {
  MarkerStreamParser,
  buildStreamSystemPrompt,
  buildUserPrompt,
  sanitizeCurrentFiles,
} from '@/app/lib/playground-generation'

export const runtime = 'nodejs'
export const maxDuration = 150

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'
const PLAYGROUND_MAX_TOKENS = 9000

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function sseEncode(event: Record<string, unknown>) {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (await isRateLimited(ip)) {
    return new Response(sseEncode({ type: 'error', error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  let body: { prompt?: unknown; model?: unknown; files?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return new Response(sseEncode({ type: 'error', error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const prompt = asString(body.prompt).trim()
  const model = asString(body.model, DEFAULT_MODEL).trim() || DEFAULT_MODEL
  const currentFiles = sanitizeCurrentFiles(body.files)

  if (prompt.length < 12 || prompt.length > 5000) {
    return new Response(sseEncode({ type: 'error', error: 'Describe the app in 12–5000 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const upstream = resolveGatewayUpstreams().find((entry) => entry.provider === 'vercel-ai-gateway')
  if (!upstream) {
    return new Response(sseEncode({ type: 'error', error: 'Playground model backend is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(sseEncode(event)))

      try {
        const upstreamResponse = await fetch(`${upstream.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: gatewayUpstreamHeaders(upstream),
          body: JSON.stringify({
            model: normalizeGatewayModel(model, upstream.provider),
            stream: true,
            messages: [
              { role: 'system', content: buildStreamSystemPrompt(currentFiles.length > 0) },
              { role: 'user', content: buildUserPrompt(prompt, currentFiles.length > 0 ? currentFiles : undefined) },
            ],
            temperature: 0.35,
            max_tokens: PLAYGROUND_MAX_TOKENS,
          }),
          signal: AbortSignal.timeout(140_000),
        })

        if (!upstreamResponse.ok || !upstreamResponse.body) {
          const text = await upstreamResponse.text().catch(() => '')
          throw new Error(`Gateway failed with ${upstreamResponse.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
        }

        const parser = new MarkerStreamParser()
        const reader = upstreamResponse.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          sseBuffer += decoder.decode(value, { stream: true })

          // Upstream is OpenAI-style SSE: data: {json}\n\n
          const frames = sseBuffer.split('\n\n')
          sseBuffer = frames.pop() ?? ''

          for (const frame of frames) {
            const line = frame.split('\n').find((entry) => entry.startsWith('data:'))
            if (!line) continue
            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') continue
            let delta = ''
            try {
              const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> }
              delta = parsed.choices?.[0]?.delta?.content ?? ''
            } catch {
              continue
            }
            if (!delta) continue

            for (const event of parser.push(delta)) {
              if (event.type === 'done') continue // we emit our own final event below
              send(event)
            }
          }

          if (parser.done) break
        }

        const generation = parser.toGeneration()
        send({ type: 'done', generation, provider: 'vercel-ai-gateway', model })
      } catch (error) {
        console.error('[playground.generate.stream] failed', error)
        send({
          type: 'error',
          error: error instanceof Error ? error.message : 'Streaming generation failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
