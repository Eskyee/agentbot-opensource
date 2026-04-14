'use client'

import { useState } from 'react'

export function JoinButton({ communitySlug }: { communitySlug: string }) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/social/communities/${communitySlug}/join`, {
        method: joined ? 'DELETE' : 'POST',
      })
      if (res.ok) setJoined(!joined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
        joined
          ? 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
          : 'bg-white text-black hover:bg-zinc-200'
      } disabled:opacity-50`}
    >
      {loading ? '...' : joined ? 'Joined' : 'Join'}
    </button>
  )
}
