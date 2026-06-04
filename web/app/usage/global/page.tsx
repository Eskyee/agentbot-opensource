'use client'

import { useEffect, useState } from 'react'

interface UsageTotals {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  requests: number
  errors: number
  total_cost_usd: number
  avg_latency_ms: number
}

interface ModelUsage {
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  requests: number
  errors: number
  total_cost_usd: number
  avg_latency_ms: number
  avg_per_request: number
}

interface HourlyData {
  hour: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  requests: number
  errors: number
}

interface UsageData {
  startedAt: string
  totals: UsageTotals
  byModel: ModelUsage[]
  hourly: HourlyData[]
  daily: HourlyData[]
}

interface MimoUsage {
  plan: string
  planLimit: number
  planName: string
  monthlyCredits: number
  monthlyInput: number
  monthlyOutput: number
  percentUsed: number
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export default function GlobalUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [mimo, setMimo] = useState<MimoUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/usage').then((r) => r.json()),
      fetch('/api/credits/mimo-usage').then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([usageData, mimoData]) => {
      if (usageData.error) throw new Error(usageData.error)
      setData(usageData)
      if (mimoData && !mimoData.error) setMimo(mimoData)
    }).catch((e) => setError(e.message))
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-zinc-600 text-xs uppercase tracking-widest animate-pulse">Loading usage data…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-red-500 text-xs uppercase tracking-widest">Error: {error || 'No data'}</div>
      </main>
    )
  }

  const { totals, byModel, hourly, daily } = data
  const avgPerReq = totals.requests > 0 ? Math.round(totals.total_tokens / totals.requests) : 0
  const cacheRate = totals.total_tokens > 0
    ? ((totals.prompt_tokens - totals.completion_tokens) / totals.total_tokens * 100).toFixed(1)
    : '0'

  // Build hourly bar chart data (last 48h)
  const recentHourly = hourly.slice(-48)
  const maxHourlyTokens = Math.max(...recentHourly.map((h) => h.total_tokens), 1)

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
            Usage
          </div>
          <div className="flex gap-3">
            <a
              href="/api/usage"
              target="_blank"
              className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
            >
              json ↗
            </a>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter uppercase leading-[0.9] mb-2">
          Global <span className="text-orange-500">Usage.</span>
        </h1>
        <p className="text-zinc-500 text-xs">
          Live aggregate across every Agentbot agent. Counting since {formatDate(data.startedAt)}.
        </p>
      </section>

      {/* MiMo Credits — if available */}
      {mimo && mimo.planLimit > 0 && (
        <section className="border-t border-zinc-900">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">
              MiMo {mimo.planName} Plan · Credits This Month
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-4xl sm:text-5xl font-bold tracking-tighter ${mimo.percentUsed > 95 ? 'text-red-500' : mimo.percentUsed > 80 ? 'text-orange-500' : 'text-white'}`}>
                {mimo.percentUsed.toFixed(1)}%
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">used</span>
            </div>
            <div className="w-full h-3 bg-zinc-900 border border-zinc-800 mb-4">
              <div
                className={`h-full transition-all duration-500 ${mimo.percentUsed > 95 ? 'bg-red-500' : mimo.percentUsed > 80 ? 'bg-orange-500' : 'bg-white'}`}
                style={{ width: `${Math.min(mimo.percentUsed, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900">
              <div className="bg-black p-4">
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Used</div>
                <div className="text-lg font-bold tracking-tighter">{formatNumber(mimo.monthlyCredits)}</div>
                <div className="text-[10px] text-zinc-600">credits</div>
              </div>
              <div className="bg-black p-4">
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Remaining</div>
                <div className="text-lg font-bold tracking-tighter">{formatNumber(Math.max(mimo.planLimit - mimo.monthlyCredits, 0))}</div>
                <div className="text-[10px] text-zinc-600">of {formatNumber(mimo.planLimit)}</div>
              </div>
              <div className="bg-black p-4">
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Input Tokens</div>
                <div className="text-lg font-bold tracking-tighter">{formatNumber(mimo.monthlyInput)}</div>
              </div>
              <div className="bg-black p-4">
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Output Tokens</div>
                <div className="text-lg font-bold tracking-tighter">{formatNumber(mimo.monthlyOutput)}</div>
              </div>
            </div>
            <a href="/credits" className="inline-block mt-4 text-[10px] uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">
              View full credit details →
            </a>
          </div>
        </section>
      )}

      {/* Top-level stats */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-900">
            <StatBox label="Requests" value={formatNumber(totals.requests)} />
            <StatBox label="Total Tokens" value={formatNumber(totals.total_tokens)} />
            <StatBox label="Prompt" value={formatNumber(totals.prompt_tokens)} />
            <StatBox label="Completion" value={formatNumber(totals.completion_tokens)} />
            <StatBox label="Avg / Req" value={formatNumber(avgPerReq)} />
            <StatBox label="Errors" value={formatNumber(totals.errors)} accent={totals.errors > 0 ? 'red' : undefined} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-900 mt-px">
            <StatBox label="Total Cost" value={`$${totals.total_cost_usd.toLocaleString()}`} />
            <StatBox label="Avg Latency" value={`${totals.avg_latency_ms}ms`} />
            <StatBox label="Cache Rate" value={`${cacheRate}%`} />
          </div>
        </div>
      </section>

      {/* Hourly chart */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">
            Last 48 hours · total tokens per hour
          </div>
          <div className="flex items-end gap-px h-24">
            {recentHourly.map((h, i) => {
              const height = Math.max(2, (h.total_tokens / maxHourlyTokens) * 96)
              return (
                <div
                  key={i}
                  className="flex-1 bg-orange-500/60 hover:bg-orange-500 transition-colors relative group"
                  style={{ height: `${height}px` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-zinc-900 border border-zinc-800 px-2 py-1 text-[9px] text-zinc-400 whitespace-nowrap">
                    {h.hour}:00 · {formatNumber(h.total_tokens)} tokens · {formatNumber(h.requests)} reqs
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-[8px] text-zinc-700 uppercase tracking-widest">
            <span>{recentHourly[0]?.hour || '—'}</span>
            <span>{recentHourly[recentHourly.length - 1]?.hour || '—'}</span>
          </div>
        </div>
      </section>

      {/* By model table */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">By Model</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-600">
                  <th className="py-2 pr-4">Model</th>
                  <th className="py-2 pr-4 text-right">Requests</th>
                  <th className="py-2 pr-4 text-right">Prompt</th>
                  <th className="py-2 pr-4 text-right">Completion</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4 text-right">Avg/Req</th>
                  <th className="py-2 pr-4 text-right">Cost</th>
                  <th className="py-2 text-right">Errors</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map((m, i) => (
                  <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-950 transition-colors">
                    <td className="py-2 pr-4 text-xs text-white font-bold">{m.model}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400 text-right tabular-nums">{formatNumber(m.requests)}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400 text-right tabular-nums">{formatNumber(m.prompt_tokens)}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400 text-right tabular-nums">{formatNumber(m.completion_tokens)}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400 text-right tabular-nums">{formatNumber(m.total_tokens)}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400 text-right tabular-nums">{formatNumber(m.avg_per_request)}</td>
                    <td className="py-2 pr-4 text-xs text-orange-500 text-right tabular-nums">${m.total_cost_usd.toLocaleString()}</td>
                    <td className="py-2 text-xs text-right tabular-nums">
                      {m.errors > 0 ? (
                        <span className="text-red-500">{formatNumber(m.errors)}</span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8">
          <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
            Aggregates persist via PostgreSQL and reset only on database migration.
            Usage logs remain the audit truth.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="/api/usage" target="_blank" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              json ↗
            </a>
            <a href="/documentation" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              docs
            </a>
            <a href="/" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              home
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: 'red' | 'orange' }) {
  const color = accent === 'red' ? 'text-red-500' : accent === 'orange' ? 'text-orange-500' : 'text-white'
  return (
    <div className="bg-black p-4 sm:p-6">
      <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">{label}</div>
      <div className={`text-xl sm:text-2xl font-bold tracking-tighter ${color} tabular-nums`}>{value}</div>
    </div>
  )
}
