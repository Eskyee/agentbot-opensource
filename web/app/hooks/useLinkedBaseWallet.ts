'use client'

/**
 * useLinkedBaseWallet — single source of truth for a user's linked Base wallet.
 *
 * "Link once, use everywhere": a user confirms ownership of their Base address
 * one time (scan QR via Sign in with Base). After that, every surface
 * (dashboard wallet, dj-stream, etc.) reads the linked address from here — no
 * repeated connect popups.
 *
 * Backed by GET /api/wallet/address, which returns the address linked to the
 * authenticated account (Wallet record or session vaultId).
 */
import { useCallback, useEffect, useState } from 'react'

export type LinkedBaseWallet = {
  address: string | null
  network: string | null
  source: string | null
  loading: boolean
  authenticated: boolean
  refresh: () => Promise<void>
}

export function useLinkedBaseWallet(): LinkedBaseWallet {
  const [address, setAddress] = useState<string | null>(null)
  const [network, setNetwork] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/address', { cache: 'no-store' })
      if (res.status === 401) {
        setAuthenticated(false)
        setAddress(null)
        return
      }
      const data = await res.json()
      setAuthenticated(Boolean(data?.authenticated))
      setAddress(typeof data?.address === 'string' ? data.address : null)
      setNetwork(typeof data?.network === 'string' ? data.network : null)
      setSource(typeof data?.source === 'string' ? data.source : null)
    } catch {
      setAddress(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { address, network, source, loading, authenticated, refresh }
}
