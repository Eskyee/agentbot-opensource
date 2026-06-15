import { NextRequest, NextResponse } from 'next/server'
import { masterCreatorSystemPrompt } from '@/app/lib/creator-toolkit'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import {
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from '@/app/lib/opengateway'

export const runtime = 'nodejs'
export const maxDuration = 90

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'

const sections = [
  { time: '00:00', name: 'Illegal Signal Intro', energy: 18, note: 'Shortwave noise, sub pressure fading in, one chopped vocal tag.' },
  { time: '00:32', name: 'Break Lock', energy: 42, note: 'Filtered Amen edits enter with ghost snares and vinyl grit.' },
  { time: '01:04', name: 'Reese Pressure', energy: 68, note: 'Wide Reese answers the sub while drums tighten into 16-bar phrases.' },
  { time: '01:36', name: 'First Drop', energy: 92, note: 'Full break stack, bass call-response, warehouse siren on bar 15.' },
  { time: '02:24', name: 'Emotional Breakdown', energy: 36, note: 'Pads, distant MC texture, kick removed, radio bed stays alive.' },
  { time: '03:12', name: 'Second Drop', energy: 100, note: 'Harder edits, extra ride layer, bass resample opens into the final run.' },
  { time: '04:32', name: 'Dubplate Exit', energy: 48, note: 'Strip to drums, tape delay throws, final pirate station ID.' },
]

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function deterministicArrangement(title: string, genre: string, mood: string, bpm: number, reason = 'deterministic fallback') {
  return {
    agent: 'Break Architect',
    title,
    genre,
    bpm,
    mood,
    tagline: 'Deploy AI workers. Build underground systems.',
    arrangement: sections,
    drumEvolution: [
      'Start with filtered break texture and radio static.',
      'Add chopped ghost snares before the first bass reveal.',
      'Layer ride noise and parallel crunch for the second drop.',
      'Remove low percussion during the breakdown to make the return hit harder.',
    ],
    bassProgression: [
      'Sub-only warning tone in the intro.',
      'Reese opens with slow phaser movement in the first build.',
      'Drop uses two-bar growl answers against the main sub.',
      'Second drop adds resampled mid-bass grit and tighter call-response.',
    ],
    fx: [
      'Shortwave sweep into every 32-bar marker.',
      'Reverse cymbal into first drop, tape stop before breakdown.',
      'Warehouse siren one-shot on the second-drop pickup.',
      'Dub delay throws on the final eight bars.',
    ],
    provider: 'deterministic',
    model: 'fallback',
    fallback: true,
    fallbackReason: reason,
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return JSON.parse(trimmed)

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return JSON.parse(fenced[1].trim())

  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first >= 0 && last > first) return JSON.parse(trimmed.slice(first, last + 1))

  throw new Error('Arrangement response did not include JSON')
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.map((item) => asString(item).trim()).filter(Boolean).slice(0, 8)
    : fallback
}

function normalizeArrangement(raw: unknown, fallback: ReturnType<typeof deterministicArrangement>) {
  if (!raw || typeof raw !== 'object') throw new Error('Arrangement payload is not an object')
  const record = raw as Record<string, unknown>
  const arrangement = Array.isArray(record.arrangement)
    ? record.arrangement
        .map((section) => section && typeof section === 'object' ? section as Record<string, unknown> : null)
        .filter(Boolean)
        .map((section) => ({
          time: asString(section?.time).slice(0, 12),
          name: asString(section?.name).slice(0, 80),
          energy: Math.min(100, Math.max(0, Number(section?.energy) || 0)),
          note: asString(section?.note).slice(0, 220),
        }))
        .filter((section) => section.time && section.name && section.note)
        .slice(0, 10)
    : []

  if (arrangement.length < 4) throw new Error('Arrangement payload did not include enough sections')

  return {
    ...fallback,
    agent: asString(record.agent, fallback.agent).slice(0, 80),
    title: asString(record.title, fallback.title).slice(0, 80),
    genre: asString(record.genre, fallback.genre).slice(0, 80),
    bpm: Number(record.bpm) || fallback.bpm,
    mood: asString(record.mood, fallback.mood).slice(0, 120),
    tagline: asString(record.tagline, fallback.tagline).slice(0, 120),
    arrangement,
    drumEvolution: normalizeStringArray(record.drumEvolution, fallback.drumEvolution),
    bassProgression: normalizeStringArray(record.bassProgression, fallback.bassProgression),
    fx: normalizeStringArray(record.fx, fallback.fx),
    fallback: false,
    fallbackReason: undefined,
  }
}

function buildArrangementPrompt(title: string, genre: string, mood: string, bpm: number) {
  return `Generate a real underground arrangement as JSON only.

Track title: ${title}
Genre: ${genre}
Mood: ${mood}
BPM: ${bpm}

Return this exact JSON shape:
{
  "agent": "Break Architect",
  "title": "...",
  "genre": "...",
  "bpm": 174,
  "mood": "...",
  "tagline": "Deploy AI workers. Build underground systems.",
  "arrangement": [
    { "time": "00:00", "name": "...", "energy": 20, "note": "..." }
  ],
  "drumEvolution": ["..."],
  "bassProgression": ["..."],
  "fx": ["..."]
}

Requirements:
- 6-8 timestamped sections.
- Avoid generic EDM language.
- Focus on tension, groove, texture, sound system pressure, and pirate radio atmosphere.
- Keep every note concise and useful for a producer.`
}

async function generateWithVercelGateway(title: string, genre: string, mood: string, bpm: number) {
  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) {
    throw new Error('Vercel Gateway upstream is not configured.')
  }

  const fallback = deterministicArrangement(title, genre, mood, bpm)
  let lastFailure = ''

  for (const upstream of upstreams) {
    const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: gatewayUpstreamHeaders(upstream),
      body: JSON.stringify({
        model: normalizeGatewayModel(DEFAULT_MODEL, upstream.provider),
        messages: [
          { role: 'system', content: `${masterCreatorSystemPrompt}\n\nYou are the Arrangement Agent. Return JSON only.` },
          { role: 'user', content: buildArrangementPrompt(title, genre, mood, bpm) },
        ],
        temperature: 0.5,
        max_tokens: 1400,
        ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
      }),
      signal: AbortSignal.timeout(75_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      lastFailure = `${upstream.provider} failed with ${response.status}${text ? `: ${text.slice(0, 240)}` : ''}`
      if (shouldTryNextGatewayUpstream(response.status)) continue
      throw new Error(lastFailure)
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      lastFailure = `${upstream.provider} returned no arrangement content`
      continue
    }

    const normalized = normalizeArrangement(extractJson(content), fallback)
    return {
      ...normalized,
      provider: upstream.provider,
      model: normalizeGatewayModel(DEFAULT_MODEL, upstream.provider),
    }
  }

  throw new Error(lastFailure || 'All configured arrangement upstreams failed.')
}

export async function POST(req: NextRequest) {
  // Public endpoint that spends LLM credits per call — rate-limit by IP
  if (await isRateLimited(getClientIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = asString(body.title, 'Untitled Dub').trim().slice(0, 80) || 'Untitled Dub'
  const genre = asString(body.genre, 'dark jungle').trim().slice(0, 80) || 'dark jungle'
  const mood = asString(body.mood, 'pirate radio pressure').trim().slice(0, 120) || 'pirate radio pressure'
  const bpm = Number(body.bpm) || 174

  try {
    return NextResponse.json(await generateWithVercelGateway(title, genre, mood, bpm))
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Vercel Gateway arrangement generation failed.'
    return NextResponse.json(deterministicArrangement(title, genre, mood, bpm, reason))
  }
}
