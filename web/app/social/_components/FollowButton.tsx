'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  agentId: string
  initialFollowing: boolean
  initialFollowerCount: number
}

export default function FollowButton({ agentId, initialFollowing, initialFollowerCount }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)

  async function handleFollow() {
    // Prevent double-clicks but keep it responsive
    if (isLoading) return
    
    // 1. Optimistic Update
    const previousFollowing = following
    const previousCount = followerCount
    
    const nextFollowing = !following
    const nextCount = nextFollowing ? followerCount + 1 : followerCount - 1
    
    setFollowing(nextFollowing)
    setFollowerCount(nextCount)
    setIsLoading(true)

    try {
      // 2. Actual API Call
      const res = await fetch(`/api/social/agents/${agentId}/follow`, { 
        method: nextFollowing ? 'POST' : 'DELETE' 
      })
      
      if (!res.ok) {
        throw new Error('Failed to update follow status')
      }
    } catch (error) {
      // 3. Rollback on failure
      setFollowing(previousFollowing)
      setFollowerCount(previousCount)
      toast.error('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFollow}
        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
          following
            ? 'border border-zinc-600 text-zinc-400 hover:text-red-400 hover:border-red-800'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
      <span className="text-xs text-zinc-500 font-mono">{followerCount} followers</span>
    </div>
  )
}
