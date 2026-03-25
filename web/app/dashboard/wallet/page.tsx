'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { setSessionId, clearSessionId } from '@/lib/mpp/session-fetch'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

interface WalletData {
  address: string
  chain: string
  chainId: number
  testnet: boolean
  totalUsd: string
  primaryToken: {
    address: string
    name: string
    symbol: string
    decimals: number
    balance: string
  } | null
  allTokens: {
    address: string
    name: string
    symbol: string
    balance: string
  }[]
}

interface Session {
  id: string
  userAddress: string
  deposit: string
  spent: string
  remaining: string
  vouchers: unknown[]
  status: 'active' | 'settling' | 'closed'
  createdAt: number
}

export default function WalletPage() {
  const { data: session, status } = useCustomSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [mppSession, setMppSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check for stored wallet address on mount
  useEffect(() => {
    const stored = localStorage.getItem('tempo_wallet_address')
    if (stored) {
      setWalletAddress(stored)
      setConnected(true)
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch wallet data when address is available
  useEffect(() => {
    if (!walletAddress) return

    async function fetchWallet() {
      try {
        const res = await fetch(`/api/wallet?address=${walletAddress}`)
        if (!res.ok) throw new Error('Failed to fetch wallet')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setWallet(data)
      } catch (err) {
        console.error('Wallet fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWallet()
  }, [walletAddress])

  // Fetch active session and restore from localStorage
  useEffect(() => {
    if (!walletAddress) return

    async function fetchSession() {
      try {
        const res = await fetch(`/api/wallet/sessions?address=${walletAddress}`)
        const data = await res.json()
        if (data.sessions?.length > 0) {
          const active = data.sessions.find((s: Session) => s.status === 'active')
          if (active) {
            setMppSession(active)
            setSessionId(active.id) // Restore for auto-billing
          }
        }
      } catch (err) {
        console.error('Session fetch error:', err)
      }
    }
    fetchSession()
  }, [walletAddress])

  // Open session
  async function openSession() {
    if (!walletAddress) return
    setSessionLoading(true)
    try {
      const res = await fetch('/api/wallet/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, deposit: '10.00' }),
      })
      const data = await res.json()
      if (data.session) {
        setMppSession(data.session)
        setSessionId(data.session.id) // Store for auto-billing
      }
    } catch (err) {
      console.error('Open session error:', err)
    } finally {
      setSessionLoading(false)
    }
  }

  // Close session
  async function closeMppSession() {
    if (!mppSession) return
    setSessionLoading(true)
    try {
      const res = await fetch(`/api/wallet/sessions?sessionId=${mppSession.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setMppSession(null)
        clearSessionId() // Remove from auto-billing
      }
    } catch (err) {
      console.error('Close session error:', err)
    } finally {
      setSessionLoading(false)
    }
  }

  // Connect wallet — for now, prompt for address
  // Post-launch: integrate passkey flow
  const [addressInput, setAddressInput] = useState('')
  const [connecting, setConnecting] = useState(false)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!addressInput.startsWith('0x') || addressInput.length !== 42) return

    setConnecting(true)
    try {
      // Validate address exists on Tempo
      const res = await fetch(`/api/wallet?address=${addressInput}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Store locally
      localStorage.setItem('tempo_wallet_address', addressInput)
      setWalletAddress(addressInput)
      setConnected(true)
      setWallet(data)
    } catch (err) {
      console.error('Connect error:', err)
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    localStorage.removeItem('tempo_wallet_address')
    setWalletAddress(null)
    setConnected(false)
    setWallet(null)
    setAddressInput('')
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Tempo Network</span>
          <h1 className="text-3xl font-bold tracking-tighter uppercase mt-1">Wallet</h1>
        </div>

        {!connected ? (
          /* Connect Wallet */
          <div className="border border-zinc-800 p-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Connect</span>
            <h2 className="text-xl font-bold tracking-tighter uppercase mt-2 mb-4">Tempo Wallet</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Connect your Tempo wallet to manage agent payments. Your wallet, your funds.
            </p>
            <form onSubmit={handleConnect}>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black border border-zinc-800 p-3 text-sm font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 mb-4"
              />
              <button
                type="submit"
                disabled={connecting || addressInput.length !== 42}
                className="w-full border border-zinc-800 p-3 text-[10px] uppercase tracking-widest hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </form>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <a
                href="https://wallet.tempo.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
              >
                Don't have a wallet? Create one at wallet.tempo.xyz →
              </a>
            </div>
          </div>
        ) : (
          /* Wallet Dashboard */
          <>
            {/* Balance Card */}
            <div className="border border-zinc-800 p-6 mb-6">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-zinc-900 w-24 mb-4"></div>
                  <div className="h-10 bg-zinc-900 w-48 mb-2"></div>
                  <div className="h-3 bg-zinc-900 w-32"></div>
                </div>
              ) : wallet ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">Balance</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase tracking-widest ${wallet.testnet ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {wallet.testnet ? 'TESTNET' : 'MAINNET'}
                      </span>
                      <button
                        onClick={handleDisconnect}
                        className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  <div className="text-5xl font-bold tracking-tighter mb-1">
                    ${parseFloat(wallet.totalUsd).toFixed(2)}
                  </div>
                  <div className="text-zinc-500 text-sm font-mono mb-6">
                    {wallet.primaryToken?.symbol || 'USD'} {wallet.allTokens.length > 1 ? `(+${wallet.allTokens.length - 1} more)` : ''}
                  </div>
                  <div className="border-t border-zinc-800 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Address</span>
                      <a
                        href={`https://explore${wallet.testnet ? '.testnet' : ''}.tempo.xyz/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-zinc-300 hover:text-zinc-100"
                      >
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-zinc-500">Network</span>
                      <span className="font-mono text-zinc-300">{wallet.chain}</span>
                    </div>
                    {wallet.allTokens.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Tokens</span>
                        {wallet.allTokens.map((token) => (
                          <div key={token.address} className="flex items-center justify-between text-sm mt-1">
                            <span className="text-zinc-500">{token.symbol}</span>
                            <span className="font-mono text-zinc-300">{parseFloat(token.balance).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Payment Session */}
            <div className="border border-zinc-800 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Payment Session</span>
                {mppSession && (
                  <span className="text-[10px] uppercase tracking-widest text-emerald-500">ACTIVE</span>
                )}
              </div>
              {mppSession ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Deposited</span>
                      <span className="text-lg font-bold tracking-tighter">${mppSession.deposit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Spent</span>
                      <span className="text-lg font-bold tracking-tighter text-red-400">${mppSession.spent}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Remaining</span>
                      <span className="text-lg font-bold tracking-tighter text-emerald-400">${mppSession.remaining}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t border-zinc-800 pt-4">
                    <span className="text-zinc-500">Pending vouchers: {mppSession.vouchers.length}</span>
                    <button
                      onClick={closeMppSession}
                      disabled={sessionLoading}
                      className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {sessionLoading ? 'Closing...' : 'Close Session'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-zinc-500 text-sm mb-4">
                    Open a payment session for off-chain agent billing. Sub-100ms per call, no gas fees.
                  </p>
                  <button
                    onClick={openSession}
                    disabled={sessionLoading}
                    className="w-full border border-zinc-800 p-3 text-[10px] uppercase tracking-widest hover:border-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {sessionLoading ? 'Opening...' : 'Open Session ($10.00)'}
                  </button>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Top Up via Stripe</span>
                <div className="grid grid-cols-2 gap-2">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={async () => {
                        if (topUpLoading) return
                        setTopUpLoading(amt)
                        try {
                          const res = await fetch(`/api/wallet/top-up?amount=${amt * 100}&address=${walletAddress}`)
                          const data = await res.json()
                          if (data.url) {
                            window.location.href = data.url
                          } else if (res.status === 401) {
                            // Not logged in — redirect to signup
                            window.location.href = data.loginUrl || '/signup'
                          } else if (data.error) {
                            alert(`Top-up error: ${data.error}`)
                            setTopUpLoading(null)
                          }
                        } catch (err) {
                          console.error('Top-up error:', err)
                          setTopUpLoading(null)
                        }
                      }}
                      disabled={topUpLoading === amt}
                      className="border border-zinc-700 p-2 text-sm font-mono hover:border-zinc-500 transition-colors disabled:opacity-50"
                    >
                      {topUpLoading === amt ? '...' : `$${amt}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-zinc-800 p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Direct Transfer</span>
                <p className="text-zinc-500 text-xs mb-3">
                  Send USDC directly to your Tempo wallet address.
                </p>
                <button
                  onClick={() => {
                    if (!wallet) return
                    navigator.clipboard.writeText(wallet.address)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="w-full border border-zinc-700 p-2 text-[10px] uppercase tracking-widest hover:border-zinc-500 transition-colors"
                >
                  {copied ? '✓ COPIED' : 'Copy Address'}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Recent Activity</span>
              <div className="border border-zinc-800 p-6 mt-2">
                <div className="text-center">
                  <p className="text-zinc-500 text-sm mb-3">
                    Transaction history is available on Tempo Explorer.
                  </p>
                  {wallet && (
                    <a
                      href={`https://explore${wallet.testnet ? '.testnet' : ''}.tempo.xyz/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-zinc-800 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                    >
                      View Transactions on Explorer →
                    </a>
                  )}
                </div>
              </div>
              {mppSession && mppSession.vouchers.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Session Activity</span>
                  <div className="border border-zinc-800 divide-y divide-zinc-800 mt-2">
                    {mppSession.vouchers.map((v: any, i: number) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-zinc-300">Agent call ({v.plugin})</div>
                          <div className="text-[10px] text-zinc-600 mt-1">
                            {new Date(v.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className="text-sm font-mono text-red-400">-${v.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        </div>
    </div>
  )
}
