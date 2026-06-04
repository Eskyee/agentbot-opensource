'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MimoUsage {
  plan: string
  planLimit: number
  planName: string
  totalCreditsUsed: number
  monthlyCredits: number
  monthlyInput: number
  monthlyOutput: number
  percentUsed: number
}

function formatCredits(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function CreditsPage() {
  const [usage, setUsage] = useState<MimoUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/credits/mimo-usage')
      .then((r) => {
        if (r.status === 401) {
          setError('unauthorized')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data && !data.error) setUsage(data)
      })
      .catch(() => setError('failed'))
      .finally(() => setLoading(false))
  }, [])

  const isUnauthorized = error === 'unauthorized'
  const percentUsed = usage?.percentUsed ?? 0
  const isHigh = percentUsed > 80
  const isCritical = percentUsed > 95

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest mb-6">
          Credits
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter uppercase leading-[0.9] mb-4">
          MiMo Credits
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
          Your MiMo Token Plan usage. Credits are consumed per-request based on input/output tokens.
          Cache hits cost 120x less than misses thanks to HiCache optimization.
        </p>
      </section>

      {/* Current Usage — Main Display */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          {isUnauthorized ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm mb-4">Sign in to view your MiMo credit usage</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 bg-zinc-900 animate-pulse" />
              <div className="h-4 w-96 max-w-full bg-zinc-900 animate-pulse" />
              <div className="h-3 w-full bg-zinc-900 animate-pulse mt-6" />
            </div>
          ) : usage ? (
            <>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {usage.planName} Plan
                </span>
              </div>

              {/* Big number */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className={`text-4xl sm:text-5xl font-bold tracking-tighter ${isCritical ? 'text-red-500' : isHigh ? 'text-orange-500' : 'text-white'}`}>
                  {percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">used</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-zinc-900 border border-zinc-800 mb-4">
                <div
                  className={`h-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : 'bg-white'}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-px bg-zinc-900 mb-4">
                <div className="bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Used</div>
                  <div className="text-lg font-bold tracking-tighter">{formatCredits(usage.monthlyCredits)}</div>
                  <div className="text-[10px] text-zinc-600">credits this month</div>
                </div>
                <div className="bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Remaining</div>
                  <div className="text-lg font-bold tracking-tighter">{formatCredits(Math.max(usage.planLimit - usage.monthlyCredits, 0))}</div>
                  <div className="text-[10px] text-zinc-600">of {formatCredits(usage.planLimit)} included</div>
                </div>
              </div>

              {/* Token breakdown */}
              <div className="grid grid-cols-2 gap-px bg-zinc-900">
                <div className="bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Input Tokens</div>
                  <div className="text-sm font-bold">{formatCredits(usage.monthlyInput)}</div>
                </div>
                <div className="bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Output Tokens</div>
                  <div className="text-sm font-bold">{formatCredits(usage.monthlyOutput)}</div>
                </div>
              </div>

              {/* Warnings */}
              {isCritical && (
                <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 text-xs text-red-400">
                  ⚠ Credits nearly exhausted. Upgrade your plan or purchase additional credits.
                </div>
              )}
              {isHigh && !isCritical && (
                <div className="mt-4 p-4 border border-orange-500/30 bg-orange-500/5 text-xs text-orange-400">
                  ⚡ Credits running low. Consider upgrading before they run out.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">No usage data yet. Deploy an agent to start consuming credits.</p>
            </div>
          )}
        </div>
      </section>

      {/* Credit Rates */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">MiMo V2.5 Pro — Credit Rates</div>
          <div className="grid grid-cols-3 gap-px bg-zinc-900">
            {[
              { label: 'Input (cache hit)', value: '2.5', sub: 'credits/token' },
              { label: 'Input (cache miss)', value: '300', sub: 'credits/token' },
              { label: 'Output', value: '600', sub: 'credits/token' },
            ].map((r) => (
              <div key={r.label} className="bg-black p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{r.label}</div>
                <div className="text-xl font-bold tracking-tighter">{r.value}</div>
                <div className="text-[10px] text-zinc-600">{r.sub}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-zinc-600">
            With HiCache, typical cache hit rate is 50–80%. Your effective cost is much lower than the cache miss rate.
            Token Plans offer 3–5x more credits at the same price. TTS is free for a limited time.
          </p>
        </div>
      </section>

      {/* Plan Limits Reference */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Token Plan Limits</div>
          <div className="space-y-2">
            {[
              { name: 'Lite', price: '$6/mo', credits: '4.1B', usdPerB: '$1.46' },
              { name: 'Standard', price: '$16/mo', credits: '11B', usdPerB: '$1.45' },
              { name: 'Pro', price: '$50/mo', credits: '38B', usdPerB: '$1.32' },
              { name: 'Max', price: '$100/mo', credits: '82B', usdPerB: '$1.22' },
            ].map((plan) => (
              <div key={plan.name} className="flex items-center justify-between py-2 border-b border-zinc-900/50">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${usage?.planName === plan.name ? 'text-orange-500' : 'text-zinc-500'}`}>
                    {plan.name}
                  </span>
                  {usage?.planName === plan.name && (
                    <span className="text-[9px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">
                      current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{plan.price}</span>
                  <span className="font-bold text-white">{plan.credits}</span>
                  <span className="text-zinc-700">{plan.usdPerB}/B</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8 flex flex-wrap gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Learn</div>
            <div className="flex flex-col gap-2">
              <Link href="/documentation" className="text-[10px] text-zinc-500 hover:text-white transition-colors">how it works</Link>
              <Link href="/usage/global" className="text-[10px] text-zinc-500 hover:text-white transition-colors">usage</Link>
              <Link href="/blog" className="text-[10px] text-zinc-500 hover:text-white transition-colors">journal</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Products</div>
            <div className="flex flex-col gap-2">
              <Link href="/pricing" className="text-[10px] text-zinc-500 hover:text-white transition-colors">plans</Link>
              <Link href="/marketplace" className="text-[10px] text-zinc-500 hover:text-white transition-colors">marketplace</Link>
              <Link href="/basefm" className="text-[10px] text-zinc-500 hover:text-white transition-colors">baseFM</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Build</div>
            <div className="flex flex-col gap-2">
              <Link href="/documentation" className="text-[10px] text-zinc-500 hover:text-white transition-colors">docs</Link>
              <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-white transition-colors">github</a>
              <Link href="/partner/mimo" className="text-[10px] text-zinc-500 hover:text-white transition-colors">MiMo partner</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
