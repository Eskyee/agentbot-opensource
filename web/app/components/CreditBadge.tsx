'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CreditBadge() {
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/credits')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.credits != null) {
          setCredits(data.credits)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (credits === null) return null

  return (
    <Link
      href="/credits"
      className="flex items-center gap-1.5 px-2 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors text-[10px] font-mono"
    >
      <span className="text-zinc-500">⚡</span>
      <span className={credits > 0 ? 'text-white' : 'text-zinc-600'}>{credits}</span>
    </Link>
  )
}
