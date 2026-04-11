import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { generateXDraft } from '@/app/lib/xDraftGenerator'
import { getXDraftQueue, saveXDraftQueue, type XDraft } from '@/app/lib/xDrafts'

export const dynamic = 'force-dynamic'

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
    const draftText = await generateXDraft(sourceText.trim(), String(tone))

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
