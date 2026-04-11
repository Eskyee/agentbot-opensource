import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getXDraftQueue, saveXDraftQueue, type XDraft } from '@/app/lib/xDrafts'

export const dynamic = 'force-dynamic'

async function generateDraft(sourceText: string, tone: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return `Draft (${tone}): ${sourceText.slice(0, 180)}`
  }

  const prompt = [
    'You write short X posts for an operator-grade social agent workflow.',
    'Rules:',
    '- No emojis',
    '- No hashtags in the body',
    '- Keep it sharp and high-signal',
    '- One idea per post',
    '- Max 280 characters',
    `Tone: ${tone}`,
    `Source: ${sourceText}`,
    'Return only the draft text.',
  ].join('\n')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/xiaomi/mimo-v2-pro',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      max_tokens: 160,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Draft generation failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const text = String(payload?.choices?.[0]?.message?.content || '').trim()
  return text.slice(0, 280)
}

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const drafts = await getXDraftQueue(session.user.id)
    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('X drafts GET error:', error)
    return NextResponse.json({ error: 'Failed to load X drafts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceText, tone = 'direct' } = await req.json()
    if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) {
      return NextResponse.json({ error: 'sourceText required' }, { status: 400 })
    }

    const queue = await getXDraftQueue(session.user.id)
    const now = new Date().toISOString()
    const draftText = await generateDraft(sourceText.trim(), String(tone))

    const draft: XDraft = {
      id: randomUUID(),
      sourceText: sourceText.trim(),
      draftText,
      tone: String(tone),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }

    const nextQueue = [draft, ...queue]
    await saveXDraftQueue(session.user.id, nextQueue)

    return NextResponse.json({ draft, drafts: nextQueue })
  } catch (error) {
    console.error('X drafts POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create X draft'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
