'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useDashboardData } from '@/app/dashboard/DashboardDataProvider'

interface ClawBankWallet {
  id: string
  name: string
  type: string
  address: string
  chain: string
  coin: string
}

interface ClawBankStatus {
  connected: boolean
  email?: string
  kycApproved?: boolean
  wallets?: ClawBankWallet[]
  balance?: { amount: string; currency: string; amountCents?: number }
  depositInfo?: { routing: string; account: string; bank: string }
  error?: string
  mcp?: { ok: boolean; error?: string }
  lastRefresh?: number
}

export default function ClawBankPage() {
  const { data } = useDashboardData()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState<ClawBankStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/clawbank')
      const d = await res.json()
      setSaved(d.hasKey)
      if (d.status) {
        setStatus({ ...d.status, lastRefresh: Date.now() })
      } else if (!d.hasKey) {
        setStatus(null)
      }
    } catch {}
    setLoading(false)
  }, [])

  // Initial load + auto-refresh every 30s when connected
  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchStatus])

  const saveKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/clawbank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to save')
      setSaved(true)
      setApiKey('')
      if (d.status) setStatus({ ...d.status, lastRefresh: Date.now() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [apiKey])

  const testConnection = useCallback(async () => {
    setTesting(true)
    setError('')
    try {
      const res = await fetch('/api/clawbank/test')
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Connection failed')
      setStatus((prev) => ({ ...prev, ...d.status, lastRefresh: Date.now() }))
      await fetchStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }, [fetchStatus])

  const removeKey = useCallback(async () => {
    if (!confirm('Remove your ClawBank API key? Your agent will lose banking access.')) return
    try {
      await fetch('/api/clawbank', { method: 'DELETE' })
      setSaved(false)
      setStatus(null)
      setApiKey('')
    } catch {}
  }, [])

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(addr)
    setTimeout(() => setCopied(''), 2000)
  }

  const isConnected = status?.connected

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                Financial Infrastructure
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">ClawBank</h1>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.16em] text-green-400 font-bold">Live</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-zinc-500 py-12 text-center">Loading…</div>
          ) : isConnected ? (
            <>
              {/* Balance + Account Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {/* Balance */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:col-span-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                    Balance
                  </div>
                  <div className="text-4xl font-bold font-mono text-white">
                    ${status.balance?.amount || '0.00'}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {status.balance?.currency || 'USD'}
                    {status.balance?.amountCents !== undefined && (
                      <span className="ml-2 text-zinc-600">
                        ({status.balance.amountCents} cents)
                      </span>
                    )}
                  </div>
                </div>

                {/* Account */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                    Account
                  </div>
                  <div className="text-sm text-zinc-200 font-mono truncate">
                    {status.email || '—'}
                  </div>
                  {status.kycApproved && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400 uppercase tracking-wider">
                        KYC Approved
                      </span>
                    </div>
                  )}
                  {status.mcp?.ok && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400 uppercase tracking-wider">
                        Agent Tools Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallets */}
              {status.wallets && status.wallets.length > 0 && (
                <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3">
                    Wallets
                  </div>
                  <div className="space-y-2">
                    {status.wallets.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between border border-zinc-800 bg-zinc-950 px-4 py-3"
                      >
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 font-bold">
                            {w.name || w.chain}
                          </div>
                          <div className="text-xs text-zinc-300 font-mono mt-0.5">
                            {w.address.slice(0, 8)}…{w.address.slice(-6)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                            {w.chain}
                          </span>
                          <button
                            onClick={() => copyAddr(w.address)}
                            className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                          >
                            {copied === w.address ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Tools Status */}
              <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3">
                  Agent Banking Tools
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'Get Balance', icon: '💰' },
                    { name: 'List Wallets', icon: '◎' },
                    { name: 'Deposit Instructions', icon: '📋' },
                    { name: 'Send USDC', icon: '⇄' },
                    { name: 'Formation Guide', icon: '🏢' },
                    { name: 'List Jurisdictions', icon: '🌍' },
                    { name: 'Start Checkout', icon: '💳' },
                    { name: 'Order History', icon: '📊' },
                  ].map((tool) => (
                    <div
                      key={tool.name}
                      className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-center"
                    >
                      <div className="text-sm mb-0.5">{tool.icon}</div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                        {tool.name}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-3">
                  All 19 ClawBank tools available to your agent via MCP.
                  {status.mcp?.ok
                    ? ' Tools are live and ready.'
                    : ` Agent MCP: ${status.mcp?.error || 'pending — deploy agent first'}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                >
                  {testing ? 'Testing…' : 'Refresh Status'}
                </button>
                <button
                  onClick={removeKey}
                  className="rounded-full border border-red-900/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-400 hover:border-red-700 hover:text-red-300"
                >
                  Disconnect
                </button>
                <a
                  href="https://clawbank.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                >
                  Open ClawBank ↗
                </a>
              </div>

              {/* Last refresh */}
              {status.lastRefresh && (
                <div className="text-[10px] text-zinc-700">
                  Last refreshed: {new Date(status.lastRefresh).toLocaleTimeString()}
                  <span className="ml-2 text-zinc-800">· auto-refreshes every 30s</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Not connected — What you get + sign up */}
              <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3">
                  What your agent gets
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: '🏦', title: 'Bank Account', desc: 'Virtual USD account with routing number' },
                    { icon: '◎', title: 'Crypto Wallet', desc: 'ETH & BTC wallets, USDC on Base' },
                    { icon: '⇄', title: 'On/Off Ramp', desc: 'ACH, FedNow, Wire, Same-Day' },
                    { icon: '⬢', title: 'Business Formation', desc: 'Programmatic LLC setup via API' },
                  ].map((f) => (
                    <div key={f.title} className="border border-zinc-800 bg-zinc-950 p-4">
                      <div className="text-lg mb-1">{f.icon}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-300 font-bold">
                        {f.title}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-4">
                  Connect Your Account
                </div>

                <div className="space-y-3 text-sm text-zinc-400 mb-4">
                  <p>
                    <span className="text-zinc-200 font-bold">1.</span> Sign up at{' '}
                    <a
                      href="https://clawbank.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
                    >
                      clawbank.co
                    </a>{' '}
                    — KYC takes 60 seconds
                  </p>
                  <p>
                    <span className="text-zinc-200 font-bold">2.</span> Go to Settings → API Tokens, create a key
                  </p>
                  <p>
                    <span className="text-zinc-200 font-bold">3.</span> Paste below — your agent gets all 19 banking tools instantly
                  </p>
                </div>

                {saved && !isConnected && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 mb-4">
                    Key saved but connection failed. Check your key and try again.
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1.5 block">
                    ClawBank API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-cb-…"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                  />
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={saveKey}
                    disabled={saving || !apiKey.trim()}
                    className="rounded-full border border-zinc-700 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    {saving ? 'Connecting…' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && isConnected && (
            <div className="mb-6 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
    </div>
  )
}
