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
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [toolResult, setToolResult] = useState<unknown>(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [toolError, setToolError] = useState('')
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

  const invokeTool = useCallback(async (toolName: string, args?: Record<string, unknown>) => {
    setActiveTool(toolName)
    setToolLoading(true)
    setToolError('')
    setToolResult(null)
    try {
      const res = await fetch('/api/clawbank/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, arguments: args }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Tool call failed')
      setToolResult(d.result)
    } catch (e) {
      setToolError(e instanceof Error ? e.message : 'Tool call failed')
    } finally {
      setToolLoading(false)
    }
  }, [])

  const closeTool = useCallback(() => {
    setActiveTool(null)
    setToolResult(null)
    setToolError('')
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
                    { name: 'Get Balance', icon: '💰', tool: 'get_balance' },
                    { name: 'List Wallets', icon: '◎', tool: 'list_wallets' },
                    { name: 'Deposit Instructions', icon: '📋', tool: 'get_deposit_instructions' },
                    { name: 'Send USDC', icon: '⇄', tool: 'create_usdc_transfer', needsInput: true },
                    { name: 'Formation Guide', icon: '🏢', tool: 'clawbank_formation_guide' },
                    { name: 'List Jurisdictions', icon: '🌍', tool: 'list_formation_jurisdictions' },
                    { name: 'Start Checkout', icon: '💳', tool: 'start_formation_checkout', needsInput: true },
                    { name: 'Order History', icon: '📊', tool: 'list_formation_orders' },
                  ].map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => !tool.needsInput && invokeTool(tool.tool)}
                      disabled={toolLoading || tool.needsInput}
                      className={`border border-zinc-800 bg-zinc-950 px-3 py-2 text-center transition-colors ${
                        tool.needsInput
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer'
                      } ${activeTool === tool.tool ? 'border-orange-500/50 bg-orange-500/5' : ''}`}
                    >
                      <div className="text-sm mb-0.5">{tool.icon}</div>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                        {tool.name}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-3">
                  Click any tool to run it live. 19 tools total — some require parameters and run via your agent.
                  {status.mcp?.ok
                    ? ' Agent tools active.'
                    : ` Agent MCP: ${status.mcp?.error || 'pending — deploy agent first'}`}
                </p>
              </div>

              {/* Tool Result Panel */}
              {activeTool && (
                <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                      {activeTool.replace(/_/g, ' ')} — Result
                    </div>
                    <button
                      onClick={closeTool}
                      className="text-zinc-600 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {toolLoading ? (
                    <div className="text-sm text-zinc-500 py-4 text-center">Running…</div>
                  ) : toolError ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {toolError}
                    </div>
                  ) : toolResult ? (
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all bg-zinc-950 border border-zinc-800 rounded-lg p-4 max-h-80 overflow-y-auto">
                      {JSON.stringify(toolResult, null, 2)}
                    </pre>
                  ) : null}
                </div>
              )}

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
