import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import {
  masterCreatorSystemPrompt,
  soundpackBlueprint,
  toolkitPrompts,
} from '@/app/lib/creator-toolkit'
import { pushPlaygroundToGitlawb } from '@/app/lib/playground-gitlawb'
import type { PlaygroundGeneration } from '@/app/api/playground/projects/_shared'

export const runtime = 'nodejs'
export const maxDuration = 120

type ArrangementPayload = {
  title?: string
  genre?: string
  bpm?: number
  mood?: string
  arrangement?: Array<{ time: string; name: string; energy: number; note: string }>
  drumEvolution?: string[]
  bassProgression?: string[]
  fx?: string[]
  provider?: string
  model?: string
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function sanitizeArrangement(value: unknown): ArrangementPayload {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return {
    title: asString(record.title, 'Agentbot Arrangement').slice(0, 80),
    genre: asString(record.genre, 'dark jungle / neuro DnB').slice(0, 80),
    bpm: Number(record.bpm) || 174,
    mood: asString(record.mood, 'pirate radio pressure').slice(0, 120),
    provider: asString(record.provider, 'agentbot'),
    model: asString(record.model, 'creator-toolkit'),
    arrangement: Array.isArray(record.arrangement)
      ? record.arrangement.map((section) => section && typeof section === 'object' ? section as Record<string, unknown> : null)
          .filter(Boolean)
          .map((section) => ({
            time: asString(section?.time).slice(0, 12),
            name: asString(section?.name).slice(0, 80),
            energy: Math.min(100, Math.max(0, Number(section?.energy) || 0)),
            note: asString(section?.note).slice(0, 220),
          }))
          .filter((section) => section.time && section.name && section.note)
      : [],
    drumEvolution: Array.isArray(record.drumEvolution) ? record.drumEvolution.map((item) => asString(item)).filter(Boolean) : [],
    bassProgression: Array.isArray(record.bassProgression) ? record.bassProgression.map((item) => asString(item)).filter(Boolean) : [],
    fx: Array.isArray(record.fx) ? record.fx.map((item) => asString(item)).filter(Boolean) : [],
  }
}

function buildMarkdownList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- Pending'
}

function buildGeneration(arrangement: ArrangementPayload): PlaygroundGeneration {
  const title = arrangement.title || 'Agentbot Arrangement'
  const manifest = {
    title,
    kind: 'agentbot-creator-package',
    arrangement,
    soundpack: soundpackBlueprint,
    prompts: toolkitPrompts.map((prompt) => ({
      id: prompt.id,
      category: prompt.category,
      title: prompt.title,
      prompt: prompt.prompt,
    })),
  }

  const readme = `# ${title}

Agentbot creator package generated from the Creator Console.

## Arrangement

${(arrangement.arrangement || []).map((section) => `- ${section.time} ${section.name} (${section.energy}%): ${section.note}`).join('\n') || '- Pending'}

## Drum Evolution

${buildMarkdownList(arrangement.drumEvolution || [])}

## Bass Progression

${buildMarkdownList(arrangement.bassProgression || [])}

## FX

${buildMarkdownList(arrangement.fx || [])}
`

  return {
    title,
    summary: 'Agentbot underground creator package with arrangement, soundpack structure, and prompt system.',
    previewHtml: '<!doctype html><html><body><main><h1>Agentbot Creator Package</h1></main></body></html>',
    console: ['Creator package assembled', 'Soundpack manifest included', 'Ready for GitLawb signed publish'],
    files: [
      { path: 'README.md', language: 'markdown', content: readme },
      { path: 'arrangement.json', language: 'json', content: `${JSON.stringify(arrangement, null, 2)}\n` },
      { path: 'soundpack.json', language: 'json', content: `${JSON.stringify(soundpackBlueprint, null, 2)}\n` },
      { path: 'creator-package.json', language: 'json', content: `${JSON.stringify(manifest, null, 2)}\n` },
      { path: 'prompts/master-system-prompt.md', language: 'markdown', content: `${masterCreatorSystemPrompt}\n` },
      {
        path: 'package.json',
        language: 'json',
        content: `${JSON.stringify({ name: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), private: true, type: 'module' }, null, 2)}\n`,
      },
    ],
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const arrangement = sanitizeArrangement(body.arrangement)
    if (!arrangement.arrangement?.length) {
      return NextResponse.json({ error: 'Generate an arrangement before publishing to GitLawb.' }, { status: 400 })
    }

    const gitlawb = await pushPlaygroundToGitlawb({
      projectId: `creator-${Date.now().toString(36)}`,
      projectName: arrangement.title || 'agentbot-creator-package',
      generation: buildGeneration(arrangement),
    })

    return NextResponse.json({ gitlawb })
  } catch (error) {
    console.error('[creator-toolkit.gitlawb] failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish creator package to GitLawb' },
      { status: 500 },
    )
  }
}
