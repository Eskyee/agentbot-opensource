'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { toggleJoinCommunity } from '@/app/actions/social'

export function JoinButton({ communitySlug }: { communitySlug: string }) {
  const [joined, setJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = async () => {
    if (isLoading) return

    // 1. Optimistic Update
    const previousState = joined
    setJoined(!joined)
    setIsLoading(true)

    try {
      // 2. Server Action
      await toggleJoinCommunity(communitySlug)
    } catch (err) {
      // 3. Rollback
      setJoined(previousState)
      toast.error(err instanceof Error ? err.message : 'Could not join community. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
        joined
          ? 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
          : 'bg-white text-black hover:bg-zinc-200'
      }`}
    >
      {joined ? 'Joined' : 'Join'}
    </button>
  )
}
