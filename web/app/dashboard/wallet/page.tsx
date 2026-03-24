'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface WalletData {
  address: string
  chain: string
  chainId: number
  testnet: boolean
  feeToken: {
    address: string
    name: string
    symbol: string
    decimals: number
    balance: string
    balanceRaw: string
  }
  pathUsd: {
    address: string
    balance: string
    balanceRaw: string
  }
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Get address from session/wallet connect
    // For now, fetch with a placeholder
    async function fetchWallet() {
      try {
        const res = await fetch('/api/wallet?address=0xd8fd0e1dce89beaab924ac68098ddb17613db56f')
        if (!res.ok) throw new Error('Failed to fetch wallet')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setWallet(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchWallet()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Tempo Network</span>
          <h1 className="text-3xl font-bold tracking-tighter uppercase mt-1">Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="border border-zinc-800 p-6 mb-6">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-900 w-24 mb-4"></div>
              <div className="h-10 bg-zinc-900 w-48 mb-2"></div>
              <div className="h-3 bg-zinc-900 w-32"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm font-mono">
              ERROR: {error}
            </div>
          ) : wallet ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Balance</span>
                <span className={`text-[10px] uppercase tracking-widest ${wallet.testnet ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {wallet.testnet ? 'TESTNET' : 'MAINNET'}
                </span>
              </div>
              <div className="text-5xl font-bold tracking-tighter mb-1">
                ${parseFloat(wallet.pathUsd.balance).toFixed(2)}
              </div>
              <div className="text-zinc-500 text-sm font-mono mb-6">
                pathUSD
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Address</span>
                  <span className="font-mono text-zinc-300">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-zinc-500">Fee Token</span>
                  <span className="font-mono text-zinc-300">
                    {wallet.feeToken.symbol} — {parseFloat(wallet.feeToken.balance).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-zinc-500">Network</span>
                  <span className="font-mono text-zinc-300">{wallet.chain}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="border border-zinc-800 p-4 hover:border-zinc-600 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Action</span>
            <span className="text-sm font-bold uppercase tracking-tighter">Top Up</span>
          </button>
          <button className="border border-zinc-800 p-4 hover:border-zinc-600 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Action</span>
            <span className="text-sm font-bold uppercase tracking-tighter">Send</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Recent Activity</span>
          <div className="border border-zinc-800 divide-y divide-zinc-800 mt-2">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300">Agent call (generate-text)</div>
                <div className="text-[10px] text-zinc-600 mt-1">2 hours ago</div>
              </div>
              <span className="text-sm font-mono text-red-400">-$0.01</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300">Top-up (card → pathUSD)</div>
                <div className="text-[10px] text-zinc-600 mt-1">Yesterday</div>
              </div>
              <span className="text-sm font-mono text-emerald-400">+$10.00</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300">Agent call (tts)</div>
                <div className="text-[10px] text-zinc-600 mt-1">Yesterday</div>
              </div>
              <span className="text-sm font-mono text-red-400">-$0.03</span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 cursor-pointer">
              View all transactions →
            </span>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <Link href="/dashboard" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
