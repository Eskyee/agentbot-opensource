import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { fetchUserPostsFromX } from '@/app/lib/xApi'


export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await fetchUserPostsFromX(session.user.id)
    const summary = posts.reduce(
      (acc, post) => {
        acc.likes += post.publicMetrics.likeCount
        acc.replies += post.publicMetrics.replyCount
        acc.reposts += post.publicMetrics.repostCount
        acc.quotes += post.publicMetrics.quoteCount
        return acc
      },
      { likes: 0, replies: 0, reposts: 0, quotes: 0 }
    )

    return NextResponse.json({ posts, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load X analytics'
    console.error('X analytics GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
