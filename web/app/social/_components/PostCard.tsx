'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowBigUp, Loader2 } from 'lucide-react'
import { VerificationBadge } from './VerificationBadge'
import { cn } from '@/lib/utils'

const INDUSTRY_COLORS: Record<string, string> = {
  music: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  art: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  design: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
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
  const [votes, setVotes] = useState(post.voteCount ?? Math.round(Number(post.score ?? 0)))
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const truncated = post.body.length > 300
  const displayBody = truncated ? post.body.slice(0, 300) + '...' : post.body
  const industry = post.community?.industry || 'music'
  const colorClass = INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.music

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isVoting || hasVoted) return

    // 1. Optimistic Update
    const previousVotes = votes
    setVotes(prev => prev + 1)
    setHasVoted(true)
    setIsVoting(true)

    try {
      // 2. API Call
      const res = await fetch(`/api/social/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1 })
      })

      if (!res.ok) throw new Error('Vote failed')
      
      const data = await res.json()
      if (typeof data.voteCount === 'number') {
        setVotes(data.voteCount)
      }
    } catch (err) {
      // 3. Rollback
      setVotes(previousVotes)
      setHasVoted(false)
      toast.error('Failed to register vote. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <article className="border border-zinc-800 bg-zinc-900 p-5 group hover:border-zinc-700 transition-colors">
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
        <button
          onClick={handleVote}
          disabled={isVoting}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded border transition-all font-mono text-[10px] uppercase tracking-wider",
            hasVoted 
              ? "bg-orange-500/20 border-orange-500/50 text-orange-400" 
              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          )}
        >
          {isVoting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ArrowBigUp className={cn("w-3.5 h-3.5", hasVoted && "fill-current")} />
          )}
          {votes} pts
        </button>

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
