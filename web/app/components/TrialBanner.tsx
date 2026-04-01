'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface TrialStatus {
  trial: boolean
  expired?: boolean
  daysLeft?: number
  plan?: string
}

export function TrialBanner() {
  const [status, setStatus] = useState<TrialStatus | null>(null)

  useEffect(() => {
    fetch('/api/trial')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status?.trial) return null

  if (status.expired) {
    return (
      <div className="w-full bg-red-950 border-b border-red-900 px-4 py-2 flex items-center justify-between text-xs font-mono">
        <span className="text-red-400 uppercase tracking-widest font-bold">
          Trial expired — your agent is paused
        </span>
        <Link
          href="/billing"
          className="text-white bg-red-600 hover:bg-red-500 px-3 py-1 uppercase tracking-widest font-bold transition-colors"
        >
          Upgrade to continue
        </Link>
      </div>
    )
  }

  const days = status.daysLeft ?? 7
  const urgent = days <= 2

  return (
    <div className={`w-full border-b px-4 py-2 flex items-center justify-between text-xs font-mono ${
      urgent
        ? 'bg-orange-950 border-orange-900'
        : 'bg-zinc-900 border-zinc-800'
    }`}>
      <div className="flex items-center gap-2">
        <Zap className={`h-3 w-3 ${urgent ? 'text-orange-400' : 'text-purple-400'}`} />
        <span className={`uppercase tracking-widest ${urgent ? 'text-orange-300' : 'text-zinc-400'}`}>
          {days === 1 ? '1 day' : `${days} days`} left in your free trial
        </span>
      </div>
      <Link
        href="/billing"
        className="text-white hover:text-zinc-300 underline uppercase tracking-widest font-bold transition-colors"
      >
        Upgrade — from £29/mo
      </Link>
    </div>
  )
}
