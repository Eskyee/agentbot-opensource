'use client'

import { useState } from 'react'
import { toast } from 'sonner'

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
      // 2. API Call
      const res = await fetch(`/api/social/communities/${communitySlug}/join`, {
        method: !joined ? 'POST' : 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Failed to update membership')
      }
    } catch (err) {
      // 3. Rollback
      setJoined(previousState)
      toast.error('Could not join community. Please check your connection.')
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
