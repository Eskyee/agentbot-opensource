'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { useDashboardData } from '@/app/dashboard/DashboardDataProvider'

interface ClawBankStatus {
  connected: boolean
  email?: string
  wallets?: Array<{ id: string; chain: string; address: string }>
  balance?: { amount: string; currency: string }
  error?: string
  mcp?: { ok: boolean; error?: string }
}

export default function ClawBankPage() {
  const { data, refresh } = useDashboardData()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState<ClawBankStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load saved key existence + status
  useEffect(() => {
    setLoading(true)
    fetch('/api/clawbank')
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.hasKey)
        if (d.status) setStatus(d.status)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
      if (d.status) setStatus(d.status)
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
      setStatus(d.status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }, [])

  const removeKey = useCallback(async () => {
    if (!confirm('Remove your ClawBank API key? Your agent will lose banking access.')) return
    try {
      await fetch('/api/clawbank', { method: 'DELETE' })
      setSaved(false)
      setStatus(null)
      setApiKey('')
    } catch {}
  }, [])

  const sidebarProps = {
    plan: data.plan,
    runtimeUrl: data.openclawUrl,
    runtimeGatewayToken: data.gatewayToken,
    runtimeInstanceId: data.openclawInstanceId,
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <DashboardSidebar
        credits={0}
        plan={sidebarProps.plan}
        runtimeUrl={sidebarProps.runtimeUrl}
        runtimeGatewayToken={sidebarProps.runtimeGatewayToken}
        runtimeInstanceId={sidebarProps.runtimeInstanceId}
        isAdmin={false}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
              Financial Infrastructure
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">ClawBank</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Give your agent a bank account. Wallet, transfers, business formation — one API key.
            </p>
          </div>

          {/* What is ClawBank */}
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3">
              What you get
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

          {/* API Key Section */}
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-4">
              Connection
            </div>

            {loading ? (
              <div className="text-sm text-zinc-500">Checking…</div>
            ) : saved && status?.connected ? (
              <div className="space-y-4">
                {/* Connected state */}
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="text-sm text-green-400 font-bold uppercase tracking-wider">
                    Connected
                  </span>
                </div>

                {status.email && (
                  <div className="text-xs text-zinc-400">
                    Account: <span className="text-zinc-200">{status.email}</span>
                  </div>
                )}

                {status.balance && (
                  <div className="text-xs text-zinc-400">
                    Balance:{' '}
                    <span className="text-zinc-200 font-mono">
                      {status.balance.amount} {status.balance.currency}
                    </span>
                  </div>
                )}

                {status.wallets && status.wallets.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600 mb-2">
                      Wallets
                    </div>
                    {status.wallets.map((w) => (
                      <div
                        key={w.id}
                        className="text-xs text-zinc-400 font-mono mb-1"
                      >
                        {w.chain}: {w.address.slice(0, 6)}…{w.address.slice(-4)}
                      </div>
                    ))}
                  </div>
                )}

                {status.mcp?.ok && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">Agent connected — banking tools active</span>
                  </div>
                )}
                {status.mcp && !status.mcp.ok && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    <span className="text-xs text-yellow-400">Key saved — agent connection pending ({status.mcp.error || 'deploy agent first'})</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    {testing ? 'Testing…' : 'Test Connection'}
                  </button>
                  <button
                    onClick={removeKey}
                    className="rounded-full border border-red-900/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-400 hover:border-red-700 hover:text-red-300"
                  >
                    Remove Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not connected — save key */}
                <p className="text-sm text-zinc-400">
                  Enter your ClawBank API key to give your agent banking capabilities.
                  {saved && !status?.connected && (
                    <span className="block text-yellow-500/80 text-xs mt-1">
                      Key saved but connection failed. Check your key and try again.
                    </span>
                  )}
                </p>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1.5 block">
                    API Key
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
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  onClick={saveKey}
                  disabled={saving || !apiKey.trim()}
                  className="rounded-full border border-zinc-700 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save & Connect'}
                </button>
              </div>
            )}
          </div>

          {/* Agent Integration Info */}
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3">
              How it works
            </div>
            <div className="space-y-3 text-sm text-zinc-400">
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
                and complete KYC (60 seconds)
              </p>
              <p>
                <span className="text-zinc-200 font-bold">2.</span> Get your API key from ClawBank
                Settings → API Tokens
              </p>
              <p>
                <span className="text-zinc-200 font-bold">3.</span> Paste it above — your agent
                instantly gets banking tools (wallet, transfers, deposit instructions)
              </p>
              <p>
                <span className="text-zinc-200 font-bold">4.</span> Your agent can then send USDC,
                check balances, get deposit instructions, and form LLCs — all through natural
                language
              </p>
            </div>
          </div>

          {/* Docs link */}
          <div className="flex gap-3">
            <a
              href="https://clawbank.co"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-700 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              Sign Up at ClawBank ↗
            </a>
            <Link
              href="/guide"
              className="rounded-full border border-zinc-800 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            >
              Agent Guide
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
