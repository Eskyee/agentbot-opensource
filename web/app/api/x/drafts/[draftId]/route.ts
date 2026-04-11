import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getXDraftQueue, saveXDraftQueue, type XDraftStatus } from '@/app/lib/xDrafts'

export const dynamic = 'force-dynamic'

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
    const { status } = await req.json()

    if (!['approved', 'rejected', 'draft', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const queue = await getXDraftQueue(session.user.id)
    const nextQueue = queue.map((draft) =>
      draft.id === draftId
        ? {
            ...draft,
            status: status as XDraftStatus,
            updatedAt: new Date().toISOString(),
          }
        : draft
    )

    await saveXDraftQueue(session.user.id, nextQueue)
    return NextResponse.json({ drafts: nextQueue })
  } catch (error) {
    console.error('X draft PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update X draft' }, { status: 500 })
  }
}
