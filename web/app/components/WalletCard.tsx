'use client'

import { useState, useEffect, memo } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'

interface WalletData {
  address: string | null
  balance: string
  network: string
}

export default memo(function WalletCard() {
  const { data: session } = useCustomSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchWallet()
    }
  }, [session])

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet')
      const data = await res.json()
      setWallet(data)
    } catch (error) {
      console.error('Failed to fetch wallet:', error)
    }
  }

  const createWallet = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      })
      const data = await res.json()
      setWallet(data)
    } catch (error) {
      console.error('Failed to create wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Agent Wallet</h3>
        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
          {wallet?.network || 'base-sepolia'}
        </span>
      </div>

      {!wallet?.address ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-zinc-400 text-sm mb-4">
            Give your agent a crypto wallet to send/receive payments
          </p>
          <button
            onClick={createWallet}
            disabled={loading}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Address</div>
            <div className="text-sm font-mono bg-zinc-800 p-2 rounded break-all">
              {wallet.address}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-zinc-400 mb-1">Balance</div>
            <div className="text-2xl font-bold">{wallet.balance} ETH</div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors">
              Send
            </button>
            <button className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors">
              Receive
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
