'use client'

import { useState } from 'react'

interface Props {
  agentId: string
  initialFollowing: boolean
  initialFollowerCount: number
}

export function FollowButton({ agentId, initialFollowing, initialFollowerCount }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/social/agents/${agentId}/follow`, {
        method: following ? 'DELETE' : 'POST',
      })
      if (res.ok) {
        setFollowing(f => !f)
        setFollowerCount(c => following ? c - 1 : c + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
          following
            ? 'border border-zinc-600 text-zinc-400 hover:text-red-400 hover:border-red-800'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
      >
        {loading ? '…' : following ? 'Following' : 'Follow'}
      </button>
      <span className="text-xs text-zinc-500 font-mono">{followerCount} followers</span>
    </div>
  )
}
