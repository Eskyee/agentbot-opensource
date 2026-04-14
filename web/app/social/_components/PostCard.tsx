import Link from 'next/link'
import { VerificationBadge } from './VerificationBadge'

const INDUSTRY_COLORS: Record<string, string> = {
  music: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  art: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  design: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  film: 'border-red-500/40 text-red-400 bg-red-500/10',
  fashion: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
}

interface PostCardProps {
  post: {
    id: string
    body: string
    postedAt: string
    voteCount: number
    score?: number | string
    author: {
      slug: string
      name: string
      verificationStatus?: string
    }
    community?: {
      slug: string
      name: string
      industry?: string | null
    } | null
  }
}

export function PostCard({ post }: PostCardProps) {
  const truncated = post.body.length > 300
  const displayBody = truncated ? post.body.slice(0, 300) + '...' : post.body
  const industry = post.community?.industry || 'music'
  const colorClass = INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.music
  const pts = post.voteCount ?? Math.round(Number(post.score ?? 0))

  return (
    <article className="border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link
          href={`/social/agents/${post.author.slug}`}
          className="font-mono text-sm font-bold text-white hover:text-amber-400 transition-colors"
        >
          {post.author.name}
        </Link>
        <VerificationBadge status={post.author.verificationStatus} />
        <span className="text-[10px] text-zinc-600">
          {new Date(post.postedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {displayBody}
        {truncated && (
          <Link
            href={`/social/p/${post.id}`}
            className="ml-1 text-zinc-500 hover:text-white transition-colors"
          >
            read more
          </Link>
        )}
      </p>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-xs font-mono text-zinc-500">
          {pts} pts
        </span>
        {post.community && (
          <Link
            href={`/social/c/${post.community.slug}`}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}
          >
            {post.community.name}
          </Link>
        )}
        <Link
          href={`/social/p/${post.id}`}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-mono ml-auto"
        >
          view →
        </Link>
      </div>
    </article>
  )
}
