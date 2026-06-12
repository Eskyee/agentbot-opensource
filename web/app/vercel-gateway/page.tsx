'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Snippet } from '@/app/components/ui/snippet'
import { StatusDot } from '@/app/components/ui/status-dot'

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

export default function VercelGatewayPage() {
  const [usage, setUsage] = useState<GatewayUsage | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [keyName, setKeyName] = useState('agentbot-playground')
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState('https://agentbot.sh')
  const [snippetTab, setSnippetTab] = useState<'curl' | 'python' | 'node'>('curl')
  const [models, setModels] = useState<string[]>([])
  const [modelQuery, setModelQuery] = useState('')

  const snippets = useMemo(() => ({
    curl: `curl ${origin}/v1/chat/completions \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{
    "model": "mimo-v2.5-pro",
    "messages": [
      {"role": "user", "content": "hello, gateway"}
    ]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(base_url="${origin}/v1", api_key="ogw_live_...")

reply = client.chat.completions.create(
    model="mimo-v2.5-pro",
    messages=[{"role": "user", "content": "hello, gateway"}],
)
print(reply.choices[0].message.content)`,
    node: `import OpenAI from 'openai'

const client = new OpenAI({ baseURL: '${origin}/v1', apiKey: 'ogw_live_...' })

const reply = await client.chat.completions.create({
  model: 'mimo-v2.5-pro',
  messages: [{ role: 'user', content: 'hello, gateway' }],
})
console.log(reply.choices[0].message.content)`,
  }), [origin])

  async function loadConsole() {
    const [usageRes, healthRes] = await Promise.all([
      fetch('/api/vercel-gateway/usage', { cache: 'no-store' }),
      fetch('/api/vercel-gateway/health', { cache: 'no-store' }),
    ])

    if (usageRes.status === 401) {
      setError('Sign in to generate keys and view your usage.')
      setUsage(null)
    } else if (usageRes.ok) {
      setUsage(await usageRes.json())
      setError('')
    }

    setHealth(await healthRes.json())

    // Live model list from the OpenAI-compatible /v1/models endpoint
    fetch('/v1/models', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const ids = Array.isArray(data?.data) ? data.data.map((m: { id?: string }) => m?.id).filter(Boolean) : []
        if (ids.length > 0) setModels(ids)
      })
      .catch(() => {})
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
              <Link href="/vercel-gateway/health" className="hover:text-white">Health</Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Open LLM Inference Gateway</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Every agent.<br />One <span className="text-orange-500">gateway.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
                The endpoint that powers every Agentbot container, the Playground, and the coding
                agent — open for your keys too. OpenAI-compatible, provider failover, usage you can
                read. Swap the base URL and ship.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.18em]">
                <a href="#keys" className="border border-orange-500 bg-orange-500 px-4 py-2 text-black hover:bg-orange-400">
                  Generate a key →
                </a>
                <Link href="/playground" className="border border-zinc-800 px-4 py-2 text-zinc-400 hover:border-zinc-600 hover:text-white">
                  Watch it work in the Playground
                </Link>
              </div>

              {/* Routing path — what actually happens to a request */}
              <div className="mt-8 overflow-x-auto">
                <div className="flex items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                  <span className="border border-zinc-800 px-2 py-1 text-zinc-400">your client</span>
                  <span className="text-zinc-700">──▶</span>
                  <span className="border border-orange-500/40 px-2 py-1 text-orange-500">agentbot /v1</span>
                  <span className="text-zinc-700">──▶</span>
                  <span className="border border-zinc-800 px-2 py-1 text-zinc-400">vercel ai gateway</span>
                  <span className="text-zinc-700">⇢ failover ⇢</span>
                  <span className="border border-zinc-800 px-2 py-1 text-zinc-400">openrouter</span>
                  <span className="text-zinc-700">──▶</span>
                  <span className="border border-zinc-800 px-2 py-1 text-zinc-400">model</span>
                </div>
              </div>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Gateway health</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{health?.status || 'checking'}</p>
                </div>
                <StatusDot state={health ? (health.ok ? 'online' : 'degraded') : 'queued'} pulse={health?.ok} />
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
              <button
                onClick={() => loadConsole().catch(() => {})}
                className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-white"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div id="keys" className="border border-zinc-900 bg-zinc-950 p-5 scroll-mt-24">
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Quickstart</h2>
            <div className="flex gap-1">
              {(['curl', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSnippetTab(tab)}
                  className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    snippetTab === tab ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-500">OpenAI-compatible — point any SDK at the gateway and keep your code.</p>
          <div className="mt-4">
            <Snippet text={snippets[snippetTab].split('\n')} prompt={false} className="rounded-none text-[11px]" />
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            New to the gateway?{' '}
            <Link href="/blog/posts/opengateway-explained" className="text-orange-500 hover:underline">
              Read how it works →
            </Link>
          </p>
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

      <section className="mx-auto grid max-w-6xl gap-px bg-zinc-900 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {[
          ['One endpoint, many providers', 'Point any OpenAI-compatible client at /v1 and pass the model. Requests route through Vercel AI Gateway with OpenRouter failover — provider secrets stay server-side.'],
          ['Failover built in', 'If an upstream rate-limits or errors, the gateway retries the next configured provider before your client ever sees a failure.'],
          ['Manage your own keys', 'Generate a key per project or environment, revoke instantly. Keys are shown once and stored as SHA-256 hashes — never raw.'],
          ['Real-time usage, yours and global', 'Per-user and per-model token tracking written on every request. Read your spend in the console, not on next month\u2019s invoice.'],
        ].map(([title, body]) => (
          <div key={title} className="bg-zinc-950 p-5">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
          </div>
        ))}
      </section>

      {models.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-10 lg:px-8">
          <div className="border border-zinc-900 bg-zinc-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Models</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Live from <code className="text-zinc-400">/v1/models</code> — send the id exactly as listed. MiMo also accepts the short form.
                </p>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">{models.length} available</span>
            </div>
            <input
              value={modelQuery}
              onChange={(event) => setModelQuery(event.target.value)}
              placeholder="Filter models — try 'free', 'claude', 'qwen'…"
              className="mt-4 w-full border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-500"
            />
            {(() => {
              const query = modelQuery.trim().toLowerCase()
              const filtered = query ? models.filter((id) => id.toLowerCase().includes(query)) : models
              const shown = filtered.slice(0, 30)
              return (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((id) => (
                      <div key={id} className="flex items-center justify-between gap-2 border border-zinc-900 bg-black px-3 py-2">
                        <code className="truncate font-mono text-xs text-zinc-300">{id}</code>
                        {id.endsWith(':free') && (
                          <span className="shrink-0 border border-emerald-500/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">Free</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {filtered.length > shown.length && (
                    <p className="mt-3 text-xs text-zinc-600">
                      Showing {shown.length} of {filtered.length} — refine the filter to narrow down.
                    </p>
                  )}
                  {filtered.length === 0 && (
                    <p className="mt-3 text-sm text-zinc-500">No models match &quot;{modelQuery}&quot;.</p>
                  )}
                </>
              )
            })()}
          </div>
        </section>
      )}

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

      {/* What this gateway already runs */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Already in production</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white">
            You&apos;re not the first request through this pipe.
          </h2>
          <div className="mt-8 grid gap-px bg-zinc-900 sm:grid-cols-3">
            {[
              ['Playground', 'Every app built in the Playground streams its generation through this gateway — multi-file React apps, live.', '/playground'],
              ['Agent containers', 'Each OpenClaw runtime routes its inference here, with per-user token quotas tracked on every call.', '/dashboard'],
              ['Coding agent', 'The hosted coding agent runs on the same endpoint and the same failover ladder you just read about.', '/coding-agent'],
            ].map(([title, body, href]) => (
              <Link key={title} href={href} className="group bg-black p-6 transition-colors hover:bg-zinc-950">
                <h3 className="text-sm font-semibold text-white group-hover:text-orange-500">{title} →</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Next step</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">Generate your first key.</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Sign in, create a key in seconds, and point your client at the gateway. Keys are shown
            once, stored hashed, revocable in one click.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-[0.18em]">
            <a href="#keys" className="border border-orange-500 bg-orange-500 px-5 py-2.5 text-black hover:bg-orange-400">
              Open console →
            </a>
            <Link href="/blog/posts/opengateway-explained" className="border border-zinc-800 px-5 py-2.5 text-zinc-400 hover:border-zinc-600 hover:text-white">
              Read the field notes
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
