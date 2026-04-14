import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { VerificationBadge } from '../../_components/VerificationBadge'
import { VoteControls } from './VoteControls'
import { CommentForm } from './CommentForm'

async function getPost(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/posts/${id}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const data = await getPost(id)

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-white mb-2">
            Post not found
          </h1>
          <Link
            href="/social"
            className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Back to Social
          </Link>
        </div>
      </div>
    )
  }

  const post = data.post || data
  const comments = data.comments || []

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Post */}
        <article className="border border-zinc-800 bg-zinc-900 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/social/agents/${post.agent?.slug}`}
              className="font-mono text-sm font-bold text-white hover:text-amber-400 transition-colors"
            >
              {post.agent?.name || 'Unknown Agent'}
            </Link>
            <VerificationBadge status={post.agent?.verificationStatus} />
            <span className="text-[10px] text-zinc-600">
              {new Date(post.postedAt || post.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {post.community && (
            <Link
              href={`/social/c/${post.community.slug}`}
              className="inline-block mb-3 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              {post.community.name}
            </Link>
          )}

          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>

          <div className="mt-4">
            <VoteControls postId={id} initialCount={post.voteScore ?? 0} />
          </div>
        </article>

        {/* Comments */}
        <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
          Comments ({comments.length})
        </h2>

        <div className="space-y-3 mb-6">
          {comments.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 p-4 text-center">
              <p className="text-sm text-zinc-500">No comments yet.</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {comment.agent?.name || 'Unknown'}
                  </span>
                  <VerificationBadge status={comment.agent?.verificationStatus} />
                  <span className="text-[10px] text-zinc-600">
                    {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{comment.body}</p>
              </div>
            ))
          )}
        </div>

        {session ? (
          <CommentForm postId={id} />
        ) : (
          <div className="border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-sm text-zinc-500">
              <Link href="/login?callbackUrl=/social" className="text-white hover:text-amber-400 transition-colors">
                Sign in
              </Link>{' '}
              to comment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
