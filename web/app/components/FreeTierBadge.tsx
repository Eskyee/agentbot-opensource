'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

interface FreeTierStatus {
  used: number
  remaining: number
  limit: number
  canMessage: boolean
}

export default function FreeTierBadge() {
  const { address, isConnected } = useAccount()
  const [status, setStatus] = useState<FreeTierStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setStatus(null)
      return
    }

    const check = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/free-tier/check?wallet=${address}`)
        const data = await res.json()
        setStatus(data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    check()
    // Re-check every 30s
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [address, isConnected])

  if (!isConnected || !status) return null

  const isLow = status.remaining <= 2
  const isOut = status.remaining === 0

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
          isOut
            ? 'border-red-800 bg-red-950/50 text-red-400'
            : isLow
            ? 'border-amber-800 bg-amber-950/50 text-amber-400'
            : 'border-green-800 bg-green-950/50 text-green-400'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
        {isOut ? 'Limit reached' : `${status.remaining} free`}
      </div>
    </div>
  )
}
