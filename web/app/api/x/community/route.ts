import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { fetchCommunityPostsFromX } from '@/app/lib/xApi'

export const dynamic = 'force-dynamic'

const DEFAULT_COMMUNITY_ID = process.env.X_COMMUNITY_ID || '2031495203002134740'

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId') || DEFAULT_COMMUNITY_ID

    const posts = await fetchCommunityPostsFromX(session.user.id, communityId)
    return NextResponse.json({ communityId, posts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community feed'
    console.error('X community GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
