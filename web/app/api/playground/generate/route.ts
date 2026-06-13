import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { isAdminEmail } from '@/app/lib/admin'
import { checkPlaygroundAllowance, incrementDailyGenerationCount, FREE_DAILY_LIMIT, ADMIN_DAILY_LIMIT } from '@/app/lib/playground-usage'
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from '@/app/lib/opengateway'
import {
  buildEditSystemPrompt,
  buildEditUserPrompt,
  buildJsonSystemPrompt,
  buildUserPrompt,
  composeGeneration,
  extractJson,
  inferLanguage,
  normalizeGeneration,
  parseEditInstructions,
  sanitizeCurrentFiles,
  type CurrentFile,
  type PlaygroundGeneration,
} from '@/app/lib/playground-generation'
import { fastApply } from '@/app/lib/fast-apply'

export const runtime = 'nodejs'
export const maxDuration = 120

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'
const PLAYGROUND_MAX_TOKENS = 9000

function jsonResponse(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error, ...details }, { status })
}

function userFacingGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Generation failed'

  if (/JSON repair returned no content|Model response did not include JSON|Generation payload is not an object/i.test(message)) {
    return 'OpenClaude did not return valid app files. Try sending again; if it keeps happening, check the configured AI Gateway key and model access.'
  }

  if (/401|403|authentication|unauthorized|forbidden|invalid api key/i.test(message)) {
    return 'Playground model access is not authorized. Sign in and make sure the AI Gateway API key is configured for xiaomi/mimo-v2.5-pro.'
  }

  if (/429|rate limit|rate limits|temporarily have rate limits|free credits/i.test(message)) {
    return 'Vercel AI Gateway is rate limited for this key. Add paid credits or try again later; the playground is still using Agentbot Vercel AI Gateway.'
  }

  if (/Vercel AI Gateway is not configured|Playground model backend is not configured/i.test(message)) {
    return 'Playground model backend is not configured. Add AI_GATEWAY_API_KEY or VERCEL_AI_GATEWAY_KEY for Agentbot Vercel AI Gateway.'
  }

  return message
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function resolvePlaygroundGatewayUpstreams() {
  return resolveGatewayUpstreams().filter((upstream) => upstream.provider === 'vercel-ai-gateway')
}

async function repairGenerationJson(content: string, upstream: ReturnType<typeof resolveGatewayUpstreams>[number], model: string) {
  const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: gatewayUpstreamHeaders(upstream),
    body: JSON.stringify({
      model: normalizeGatewayModel(model, upstream.provider),
      messages: [
        {
          role: 'system',
          content: 'Repair the user payload into compact valid JSON only. Return title, summary, files, and console. Preserve all file code content exactly. Return no markdown.',
        },
        { role: 'user', content },
      ],
      temperature: 0,
      max_tokens: PLAYGROUND_MAX_TOKENS,
      ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
    }),
    signal: AbortSignal.timeout(110_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`${upstream.provider} JSON repair failed with ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const repaired = data.choices?.[0]?.message?.content
  if (!repaired) {
    throw new Error(`${upstream.provider} JSON repair returned no content`)
  }

  return normalizeGeneration(extractJson(repaired))
}

async function generateWithVercelGateway(prompt: string, model: string, currentFiles?: CurrentFile[]) {
  const upstreams = resolvePlaygroundGatewayUpstreams()
  if (upstreams.length === 0) {
    throw new Error('Vercel AI Gateway is not configured.')
  }

  let lastFailure = ''

  for (const upstream of upstreams) {
    const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: gatewayUpstreamHeaders(upstream),
      body: JSON.stringify({
        model: normalizeGatewayModel(model, upstream.provider),
        messages: [
          { role: 'system', content: buildJsonSystemPrompt(Boolean(currentFiles?.length)) },
          { role: 'user', content: buildUserPrompt(prompt, currentFiles) },
        ],
        temperature: 0.35,
        max_tokens: PLAYGROUND_MAX_TOKENS,
        ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
      }),
      signal: AbortSignal.timeout(110_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      lastFailure = `${upstream.provider} failed with ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`
      if (shouldTryNextGatewayUpstream(response.status)) continue
      throw new Error(lastFailure)
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      lastFailure = `${upstream.provider} returned no content`
      continue
    }

    try {
      return normalizeGeneration(extractJson(content))
    } catch (parseError) {
      try {
        return await repairGenerationJson(content, upstream, model)
      } catch (repairError) {
        lastFailure = repairError instanceof Error
          ? repairError.message
          : parseError instanceof Error
            ? parseError.message
            : `${upstream.provider} returned invalid JSON`
        console.warn('[playground.generate] upstream returned invalid JSON', {
          provider: upstream.provider,
          error: lastFailure,
        })
        continue
      }
    }
  }

  throw new Error(lastFailure || 'All configured playground model upstreams failed.')
}

/**
 * Edit mode (Fast Apply): ask the model for lazy per-file edits, then merge each
 * with the fast-apply model against the current file. Much cheaper than a full
 * re-emit on follow-ups. Returns null if the model produced no usable edits so
 * the caller can fall back to a full regeneration.
 */
async function generateEditsWithFastApply(
  prompt: string,
  model: string,
  currentFiles: CurrentFile[],
): Promise<PlaygroundGeneration | null> {
  const upstreams = resolvePlaygroundGatewayUpstreams()
  if (upstreams.length === 0) throw new Error('Vercel AI Gateway is not configured.')

  let lastFailure = ''
  let instructions: ReturnType<typeof parseEditInstructions> | null = null

  for (const upstream of upstreams) {
    const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: gatewayUpstreamHeaders(upstream),
      body: JSON.stringify({
        model: normalizeGatewayModel(model, upstream.provider),
        messages: [
          { role: 'system', content: buildEditSystemPrompt() },
          { role: 'user', content: buildEditUserPrompt(prompt, currentFiles) },
        ],
        temperature: 0.2,
        max_tokens: PLAYGROUND_MAX_TOKENS,
        ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
      }),
      signal: AbortSignal.timeout(110_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      lastFailure = `${upstream.provider} failed with ${response.status}${text ? `: ${text.slice(0, 200)}` : ''}`
      if (shouldTryNextGatewayUpstream(response.status)) continue
      throw new Error(lastFailure)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      lastFailure = `${upstream.provider} returned no content`
      continue
    }
    try {
      instructions = parseEditInstructions(extractJson(content))
      break
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'unparseable edit payload'
      continue
    }
  }

  if (!instructions || instructions.edits.length === 0) {
    console.warn('[playground.generate.edit] no usable edits', { lastFailure })
    return null
  }

  // Merge each edit against its current file via the fast-apply model.
  const byPath = new Map(currentFiles.map((file) => [file.path, file.content]))
  for (const edit of instructions.edits) {
    const original = byPath.get(edit.path)
    if (original == null) {
      // New file the model is introducing — accept the edit body as the file.
      byPath.set(edit.path, edit.edit)
      continue
    }
    const merged = await fastApply({ code: original, edit: edit.edit, instructions: prompt, model: 'xiaomi/mimo-v2-flash' })
    byPath.set(edit.path, merged.merged)
  }

  const modelFiles = Array.from(byPath.entries()).map(([path, content]) => ({
    path,
    language: inferLanguage(path),
    content,
  }))

  return composeGeneration({
    title: instructions.title,
    summary: instructions.summary,
    modelFiles,
    console: [`Fast Apply merged ${instructions.edits.length} file(s)`, 'Preview updated'],
  })
}

function localMockGeneration(prompt: string): PlaygroundGeneration {
  const title = prompt.split(/\s+/).filter(Boolean).slice(0, 4).join(' ') || 'Untitled'
  const safeTitle = title.replace(/[<>&"]/g, '')
  const appTsx = `import { useMemo, useState } from 'react'
import './index.css'

const seedItems = ['Research', 'Design', 'Build', 'Review']

export default function App() {
  const [active, setActive] = useState(seedItems[0])
  const progress = useMemo(() => seedItems.indexOf(active) + 1, [active])

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">OpenClaude local draft</p>
        <h1>${safeTitle}</h1>
        <p>${prompt.replace(/`/g, '\\`')}</p>
      </section>
      <section className="panel">
        {seedItems.map((item) => (
          <button key={item} className={item === active ? 'active' : ''} onClick={() => setActive(item)}>
            {item}
          </button>
        ))}
      </section>
      <section className="meter" aria-label="Build progress">
        <span style={{ width: \`\${progress * 25}%\` }} />
      </section>
    </main>
  )
}
`
  const css = `:root { color-scheme: dark; font-family: ui-monospace, monospace; color: #fafafa; }
body { margin: 0; }
.shell { min-height: 100vh; padding: 56px; background: radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 28%), #050505; }
.hero { max-width: 780px; }
.eyebrow { color: #f97316; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; }
h1 { margin: 12px 0; font-size: clamp(42px, 8vw, 92px); line-height: 0.95; letter-spacing: -0.04em; }
p { color: #a1a1aa; line-height: 1.7; }
.panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1px; max-width: 720px; margin-top: 44px; background: #27272a; }
button { border: 0; background: #09090b; color: #d4d4d8; padding: 22px; text-align: left; cursor: pointer; }
button.active { color: #050505; background: #fafafa; }
.meter { max-width: 720px; height: 8px; margin-top: 20px; background: #18181b; }
.meter span { display: block; height: 100%; background: #f97316; }
`

  return composeGeneration({
    title: safeTitle,
    summary: 'Local mock generation is enabled for offline playground testing.',
    modelFiles: [
      { path: 'src/App.tsx', language: 'tsx', content: appTsx },
      { path: 'src/index.css', language: 'css', content: css },
    ],
    console: ['PLAYGROUND_ALLOW_LOCAL_MOCK=1', 'Generated Vite React TS project', 'Preview updated'],
  })
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (await isRateLimited(ip)) {
    return jsonResponse('Too many requests', 429)
  }

  let body: { prompt?: unknown; model?: unknown; files?: unknown; mode?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return jsonResponse('Invalid JSON body', 400)
  }

  const prompt = asString(body.prompt).trim()
  const model = asString(body.model, DEFAULT_MODEL).trim() || DEFAULT_MODEL
  const mode = asString(body.mode).trim()

  if (prompt.length < 12) {
    return jsonResponse('Describe the app in at least 12 characters.', 400)
  }
  if (prompt.length > 5000) {
    return jsonResponse('Prompt is too long for the playground.', 400)
  }

  // Optional current files → iteration mode (edit instead of regenerate)
  const currentFiles = sanitizeCurrentFiles(body.files)

  // Usage gating: check daily generation limit
  const session = await getAuthSession()
  const userId = session?.user?.id
  const identifier = userId || ip
  const isAdmin = isAdminEmail(session?.user?.email)

  let isPaidUser = false
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    })
    const trialActive = !!(user?.trialEndsAt && user.trialEndsAt > new Date())
    isPaidUser = user?.subscriptionStatus === 'active' || trialActive
  }

  const allowance = await checkPlaygroundAllowance(identifier, isPaidUser, isAdmin)
  if (!allowance.allowed) {
    return jsonResponse(
      `Free tier limit reached (${allowance.limit}/day). Subscribe to generate unlimited apps.`,
      402,
      { remaining: allowance.remaining, limit: allowance.limit, upgradeUrl: '/pricing' },
    )
  }

  // Count this generation attempt (before execution to prevent abuse via retries)
  const newCount = await incrementDailyGenerationCount(identifier)
  const dailyLimit = isAdmin ? ADMIN_DAILY_LIMIT : isPaidUser ? Infinity : FREE_DAILY_LIMIT
  const remainingAfter = isAdmin ? Math.max(0, ADMIN_DAILY_LIMIT - newCount) : isPaidUser ? Infinity : Math.max(0, FREE_DAILY_LIMIT - newCount)

  try {
    if (process.env.PLAYGROUND_ALLOW_LOCAL_MOCK === '1') {
      return NextResponse.json({ provider: 'local-mock', model, generation: localMockGeneration(prompt), usage: { remaining: remainingAfter, limit: dailyLimit } })
    }

    if (resolvePlaygroundGatewayUpstreams().length > 0) {
      // Fast Apply path for follow-up edits: lazy edits merged by the fast model.
      // Falls back to a full regeneration if the model produced no usable edits.
      if (mode === 'edit' && currentFiles.length > 0) {
        try {
          const edited = await generateEditsWithFastApply(prompt, model, currentFiles)
          if (edited) {
            return NextResponse.json({ provider: 'vercel-ai-gateway', model, generation: edited, mode: 'edit', usage: { remaining: remainingAfter, limit: dailyLimit } })
          }
        } catch (editError) {
          console.warn('[playground.generate] edit mode failed, regenerating', editError)
        }
      }

      const generation = await generateWithVercelGateway(prompt, model, currentFiles.length > 0 ? currentFiles : undefined)
      return NextResponse.json({ provider: 'vercel-ai-gateway', model, generation, usage: { remaining: remainingAfter, limit: dailyLimit } })
    }

    return jsonResponse('Playground model backend is not configured.', 503, {
      requiredEnv: ['AI_GATEWAY_API_KEY', 'VERCEL_AI_GATEWAY_KEY'],
      localTestEnv: 'Set PLAYGROUND_ALLOW_LOCAL_MOCK=1 only for offline UI testing.',
    })
  } catch (error) {
    console.error('[playground.generate] failed', error)
    return jsonResponse(userFacingGenerationError(error), 502)
  }
}
