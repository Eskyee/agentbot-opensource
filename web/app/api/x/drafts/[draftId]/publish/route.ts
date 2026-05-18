import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { appendManagedAgentEvent } from '@/app/lib/managedAgentEvents'
import { publishPostToX } from '@/app/lib/xApi'
import { getXDraftQueue, normalizeDraftText, saveXDraftQueue } from '@/app/lib/xDrafts'


export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params
    const queue = await getXDraftQueue(session.user.id)
    const draft = queue.find((item) => item.id === draftId)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'approved') {
      return NextResponse.json({ error: 'Draft must be approved before publishing' }, { status: 400 })
    }

    const normalized = normalizeDraftText(draft.draftText)
    const duplicate = queue.find((item) =>
      item.id !== draft.id &&
      item.status === 'published' &&
      normalizeDraftText(item.draftText) === normalized
    )
    if (duplicate) {
      return NextResponse.json({ error: 'Duplicate published post detected' }, { status: 409 })
    }

    let published
    try {
      published = await publishPostToX(session.user.id, draft.draftText)
    } catch (error) {
      if (draft.sessionId) {
        await appendManagedAgentEvent({
          sessionId: draft.sessionId,
          type: 'publish.failed',
          payload: {
            draftId: draft.id,
            error: error instanceof Error ? error.message : 'publish failed',
          },
        }).catch((appendError) => {
          console.error('Managed agent publish.failed append failed:', appendError)
        })
      }
      throw error
    }

    const nextQueue = queue.map((item) =>
      item.id === draftId
        ? {
            ...item,
            status: 'published' as const,
            updatedAt: new Date().toISOString(),
            publishedPostId: published.postId,
            publishedUrl: published.url,
          }
        : item
    )

    await saveXDraftQueue(session.user.id, nextQueue)
    if (draft.sessionId) {
      await appendManagedAgentEvent({
        sessionId: draft.sessionId,
        type: 'publish.succeeded',
        payload: {
          draftId: draft.id,
          postId: published.postId,
          url: published.url,
        },
      }).catch((error) => {
        console.error('Managed agent publish event append failed:', error)
      })
    }

    return NextResponse.json({
      success: true,
      postId: published.postId,
      url: published.url,
      drafts: nextQueue,
    })
  } catch (error) {
    console.error('X draft publish error:', error)
    const message = error instanceof Error ? error.message : 'Failed to publish draft'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
