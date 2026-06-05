'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { getWalletAddress } from '@/app/hooks/useBasename'

export function WalletBadge() {
  const { data: session } = useCustomSession()
  const [balance, setBalance] = useState<string | null>(null)
  const walletAddress = getWalletAddress(session?.user?.email)

  useEffect(() => {
    if (!walletAddress) return
    let cancelled = false
    fetch('/api/wallet')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.balance != null) {
          setBalance(data.balance)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [walletAddress])

  if (!walletAddress) return null

  const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-3)}`

  return (
    <Link
      href="/dashboard/wallet"
      className="flex items-center gap-1.5 px-2 py-1 border border-zinc-800 hover:border-zinc-600 transition-colors text-[10px] font-mono"
      title={walletAddress}
    >
      <span className="text-zinc-500">💰</span>
      <span className="text-white">{short}</span>
      {balance !== null && (
        <>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">{balance}</span>
        </>
      )}
    </Link>
  )
}
