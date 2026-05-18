import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { appendManagedAgentEvent } from '@/app/lib/managedAgentEvents'
import { getXDraftQueue, saveXDraftQueue, type XDraftStatus } from '@/app/lib/xDrafts'


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params
    const { status, scheduledFor } = await req.json()

    if (status !== undefined && !['approved', 'rejected', 'draft', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (scheduledFor !== undefined && scheduledFor !== null && typeof scheduledFor !== 'string') {
      return NextResponse.json({ error: 'Invalid scheduledFor' }, { status: 400 })
    }

    const queue = await getXDraftQueue(session.user.id)
    const nextQueue = queue.map((draft) =>
      draft.id === draftId
        ? {
            ...draft,
            status: (status ?? draft.status) as XDraftStatus,
            updatedAt: new Date().toISOString(),
            scheduledFor: scheduledFor === undefined ? draft.scheduledFor || null : scheduledFor,
          }
        : draft
    )

    await saveXDraftQueue(session.user.id, nextQueue)
    const updatedDraft = nextQueue.find((draft) => draft.id === draftId)
    if (updatedDraft?.sessionId) {
      await appendManagedAgentEvent({
        sessionId: updatedDraft.sessionId,
        type: status === 'approved' ? 'draft.approved' : status === 'rejected' ? 'draft.rejected' : `draft.${status}`,
        payload: {
          draftId: updatedDraft.id,
          status: status ?? updatedDraft.status,
          draftText: updatedDraft.draftText,
          scheduledFor: updatedDraft.scheduledFor || null,
        },
      }).catch((error) => {
        console.error('Managed agent event append failed:', error)
      })
    }
    return NextResponse.json({ drafts: nextQueue })
  } catch (error) {
    console.error('X draft PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update X draft' }, { status: 500 })
  }
}
