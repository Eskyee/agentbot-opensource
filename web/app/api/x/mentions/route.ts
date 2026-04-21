import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { fetchUserMentionsFromX } from '@/app/lib/xApi'
import { getXMentionStates, saveXMentionStates, type XMentionStateStatus } from '@/app/lib/xMentions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [mentions, mentionStates] = await Promise.all([
      fetchUserMentionsFromX(session.user.id),
      getXMentionStates(session.user.id),
    ])

    const stateMap = new Map(mentionStates.map((state) => [state.id, state]))
    const hydrated = mentions.map((mention) => {
      const persisted = stateMap.get(mention.id)
      return {
        ...mention,
        state: persisted?.status || 'open',
        assignedTo: persisted?.assignedTo || null,
      }
    })

    return NextResponse.json({ mentions: hydrated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load X mentions'
    console.error('X mentions GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const mentionId = typeof body?.mentionId === 'string' ? body.mentionId : ''
    const status = typeof body?.status === 'string' ? body.status as XMentionStateStatus : 'open'
    const assignedTo =
      typeof body?.assignedTo === 'string'
        ? body.assignedTo.trim().slice(0, 120)
        : body?.assignedTo === null
          ? null
          : undefined

    if (!mentionId) {
      return NextResponse.json({ error: 'mentionId required' }, { status: 400 })
    }

    if (!['open', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const states = await getXMentionStates(session.user.id)
    const now = new Date().toISOString()
    const nextStates = (() => {
      const existing = states.find((item) => item.id === mentionId)
      if (existing) {
        return states.map((item) =>
          item.id === mentionId
            ? {
                ...item,
                status,
                assignedTo: assignedTo !== undefined ? assignedTo : item.assignedTo || null,
                updatedAt: now,
              }
            : item
        )
      }
      return [
        {
          id: mentionId,
          status,
          assignedTo: assignedTo !== undefined ? assignedTo : null,
          updatedAt: now,
        },
        ...states,
      ]
    })()

    await saveXMentionStates(session.user.id, nextStates)
    return NextResponse.json({ mentionStates: nextStates })
  } catch (error) {
    console.error('X mentions PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update mention state' }, { status: 500 })
  }
}
