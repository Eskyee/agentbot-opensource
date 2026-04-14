'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/social')
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Delete post?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:text-red-400 transition-colors"
    >
      Delete post
    </button>
  )
}
