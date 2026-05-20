'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type GatewayUsage = {
  windowDays: number
  personal: GatewayTotals
  global: GatewayTotals
  byModel: Array<GatewayTotals & { model: string }>
  keys: Array<{
    id: string
    name: string
    keyPreview: string
    createdAt: string
    lastUsed: string | null
  }>
}

type GatewayTotals = {
  requests: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

type Health = {
  ok: boolean
  status: string
  provider?: string
  latencyMs?: number
  upstreamStatus?: number
  requiredEnv?: string[]
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value)
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(value)
}

export default function OpenGatewayPage() {
  const [usage, setUsage] = useState<GatewayUsage | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [keyName, setKeyName] = useState('agentbot-playground')
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState('https://agentbot.sh')

  const quickstart = useMemo(() => `curl ${origin}/v1/chat/completions \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{
    "model": "mimo-v2.5-pro",
    "messages": [
      {"role": "user", "content": "hello, gateway"}
    ]
  }'`, [origin])

  async function loadConsole() {
    const [usageRes, healthRes] = await Promise.all([
      fetch('/api/opengateway/usage', { cache: 'no-store' }),
      fetch('/api/opengateway/health', { cache: 'no-store' }),
    ])

    if (usageRes.status === 401) {
      setError('Sign in to generate keys and view your usage.')
      setUsage(null)
    } else if (usageRes.ok) {
      setUsage(await usageRes.json())
      setError('')
    }

    setHealth(await healthRes.json())
  }

  useEffect(() => {
    setOrigin(window.location.origin)
    loadConsole().catch((err) => setError(err instanceof Error ? err.message : 'Console failed to load'))
  }, [])

  async function createKey() {
    setLoading(true)
    setError('')
    setNewKey('')
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create key')
      }
      setNewKey(data.key)
      await loadConsole()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setLoading(false)
    }
  }

  async function deleteKey(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    await loadConsole()
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <section className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="font-mono text-xs uppercase tracking-[0.28em] text-orange-500">
              Agentbot
            </Link>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              <Link href="/playground" className="hover:text-white">Playground</Link>
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link href="/opengateway/health" className="hover:text-white">Health</Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Open LLM Inference Gateway</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Opengateway.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
                One OpenAI-compatible Agentbot endpoint across providers. Generate an API key, swap the base URL, and ship.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Gateway health</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{health?.status || 'checking'}</p>
                </div>
                <span className={`h-3 w-3 rounded-full ${health?.ok ? 'bg-emerald-400' : 'bg-orange-500'}`} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Provider</dt>
                  <dd className="mt-1 text-zinc-200">{health?.provider || 'not configured'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Latency</dt>
                  <dd className="mt-1 text-zinc-200">{health?.latencyMs ? `${health.latencyMs}ms` : '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Generate a key</h2>
              <p className="mt-1 text-sm text-zinc-500">Keys are shown once and stored hashed.</p>
            </div>
            <button
              onClick={createKey}
              disabled={loading}
              className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-black disabled:opacity-50"
            >
              {loading ? 'Creating' : 'Create'}
            </button>
          </div>
          <input
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            className="mt-5 w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none focus:border-orange-500"
            placeholder="Key name"
          />
          {newKey ? (
            <div className="mt-5 border border-orange-500/40 bg-orange-500/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-400">Copy this key now</p>
              <code className="mt-3 block break-all text-sm text-orange-100">{newKey}</code>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-orange-400">{error}</p> : null}
        </div>

        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Quickstart</h2>
          <pre className="mt-4 overflow-x-auto bg-black p-4 text-xs leading-6 text-zinc-300">
            <code>{quickstart}</code>
          </pre>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-4 lg:px-8">
        {[
          ['Your requests', usage?.personal.requests || 0],
          ['Your tokens', (usage?.personal.inputTokens || 0) + (usage?.personal.outputTokens || 0)],
          ['Global requests', usage?.global.requests || 0],
          ['Global spend', usage ? formatUsd(usage.global.costUsd) : '$0.0000'],
        ].map(([label, value]) => (
          <div key={label} className="border border-zinc-900 bg-zinc-950 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-2 lg:px-8">
        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Your keys</h2>
          <div className="mt-4 divide-y divide-zinc-900">
            {(usage?.keys || []).map((key) => (
              <div key={key.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-white">{key.name}</p>
                  <p className="font-mono text-xs text-zinc-500">{key.keyPreview}</p>
                </div>
                <button onClick={() => deleteKey(key.id)} className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-orange-400">
                  Revoke
                </button>
              </div>
            ))}
            {!usage?.keys?.length ? <p className="py-4 text-sm text-zinc-500">No keys yet.</p> : null}
          </div>
        </div>

        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Global model usage</h2>
          <div className="mt-4 divide-y divide-zinc-900">
            {(usage?.byModel || []).map((model) => (
              <div key={model.model} className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm">
                <span className="font-mono text-zinc-300">{model.model}</span>
                <span className="text-zinc-500">{formatNumber(model.requests)} req</span>
              </div>
            ))}
            {!usage?.byModel?.length ? <p className="py-4 text-sm text-zinc-500">No gateway traffic yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  )
}
