'use client'

import { useState, useEffect } from 'react'

/**
 * Resolves a wallet address to a Base Name (e.g. "alice.base.eth").
 * Returns null if the address has no registered Basename.
 */
export function useBasename(address?: string | null) {
  const [basename, setBasename] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetch(`/api/basename?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => setBasename(data.name ?? null))
      .catch(() => setBasename(null))
      .finally(() => setLoading(false))
  }, [address])

  return { basename, loading }
}

/**
 * Extract the wallet address from a wallet-login session email.
 * Wallet users have email in the form: <address>@wallet.base.org
 */
export function getWalletAddress(email?: string | null): string | null {
  if (!email?.endsWith('@wallet.base.org')) return null
  return email.replace('@wallet.base.org', '')
}
