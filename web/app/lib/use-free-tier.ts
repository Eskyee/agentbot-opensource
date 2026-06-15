'use client'

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

interface UseFreeTierReturn {
  checkAndUse: () => Promise<boolean>
  status: { used: number; remaining: number; limit: number } | null
  loading: boolean
  error: string | null
}

/**
 * Hook to check and consume a free daily message.
 * Returns true if the message is allowed, false if limit reached.
 */
export function useFreeTier(): UseFreeTierReturn {
  const { address, isConnected } = useAccount()
  const [status, setStatus] = useState<{ used: number; remaining: number; limit: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAndUse = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError('Connect your Base wallet for free messages')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/free-tier/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, action: 'use' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to check free tier')
        return false
      }

      setStatus({ used: data.used, remaining: data.remaining, limit: data.limit })

      if (!data.canMessage) {
        setError(`Daily limit reached (${data.limit} messages). Sign up for unlimited.`)
        return false
      }

      return true
    } catch (e: any) {
      setError(e.message || 'Network error')
      return false
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  return { checkAndUse, status, loading, error }
}
