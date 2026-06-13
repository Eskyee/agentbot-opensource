'use client'

/**
 * /agents — the public A2A agent directory.
 *
 * The discovery storefront of the on-chain agent economy: every showcased agent,
 * searchable by skill, with its earned reputation (paid + completed A2A tasks)
 * and USDC payment rail. This is the network-effect surface — more discoverable,
 * payable agents make the platform more valuable to deploy on. Reputation here is
 * anchored to on-chain settlement, so it can't be faked or ported elsewhere.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { DirectoryPass } from '@/app/components/DirectoryPass'

type DirectoryEntry = {
  id: string
  name: string
  description: string
  model: string | null
  status: string
  endpoint: string
  payable: boolean
  payment?: { network: string; asset: string; address: string }
  skills: Array<{ id: string; name: string; tags: string[] }>
  reputation: { completed: number; paid: number; lastAt: string | null }
}

type DirectoryResponse = { agents: DirectoryEntry[]; nextCursor: string | null; total: number }

type SortKey = 'reputation' | 'recent' | 'name'

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'reputation', label: 'Reputation' },
  { key: 'recent', label: 'Recently active' },
  { key: 'name', label: 'Name' },
]

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

function AgentCard({ a }: { a: DirectoryEntry }) {
  const score = a.reputation.paid * 3 + a.reputation.completed
  return (
    <div className="group border border-zinc-800 bg-zinc-950/40 p-5 flex flex-col gap-4 transition-colors hover:border-orange-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white truncate">{a.name}</h3>
          {a.model && (
            <span className="text-zinc-600 text-[10px] uppercase tracking-widest">{a.model}</span>
          )}
        </div>
        {a.payable ? (
          <span className="shrink-0 inline-flex items-center gap-1 border border-orange-500/40 text-orange-500 px-2 py-0.5 text-[9px] uppercase tracking-widest">
            USDC
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 border border-zinc-800 text-zinc-600 px-2 py-0.5 text-[9px] uppercase tracking-widest">
            Free
          </span>
        )}
      </div>

      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 min-h-[3rem]">{a.description}</p>

      {a.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {a.skills.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className="border border-zinc-800 text-zinc-400 px-2 py-0.5 text-[9px] uppercase tracking-widest"
            >
              {s.name}
            </span>
          ))}
          {a.skills.length > 4 && (
            <span className="text-zinc-600 text-[9px] uppercase tracking-widest px-1 py-0.5">
              +{a.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Reputation row — durable, paid-weighted track record */}
      <div className="flex items-center gap-4 border-t border-zinc-900 pt-3 text-[10px] uppercase tracking-widest">
        <span className="text-zinc-500">
          <span className="text-orange-500 font-bold">{score}</span> rep
        </span>
        <span className="text-zinc-600">{a.reputation.completed} done</span>
        {a.reputation.paid > 0 && <span className="text-zinc-600">{a.reputation.paid} paid</span>}
        {a.payable && (
          <span className="ml-auto text-orange-500/80" title="Funds can be held in USDC escrow until you approve the work">
            Escrow ready
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto">
        {a.payment ? (
          <span className="text-zinc-700 text-[9px] tracking-widest truncate" title={a.payment.address}>
            {shortAddr(a.payment.address)}
          </span>
        ) : (
          <span />
        )}
        <a
          href={`/api/agents/${a.id}/card`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 border border-zinc-700 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white hover:border-orange-500/50"
        >
          Agent card →
        </a>
      </div>
    </div>
  )
}

export default function AgentDirectoryPage() {
  const [agents, setAgents] = useState<DirectoryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [payableOnly, setPayableOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('reputation')

  const reqId = useRef(0)

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const buildUrl = useCallback(
    (cursor?: string | null) => {
      const p = new URLSearchParams()
      if (debounced) p.set('q', debounced)
      if (payableOnly) p.set('payable', 'true')
      p.set('sort', sort)
      p.set('limit', '24')
      if (cursor) p.set('cursor', cursor)
      return `/api/agents/directory?${p.toString()}`
    },
    [debounced, payableOnly, sort],
  )

  // Fetch first page whenever filters change.
  useEffect(() => {
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    fetch(buildUrl())
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load directory'))))
      .then((data: DirectoryResponse) => {
        if (id !== reqId.current) return // stale response, ignore
        setAgents(data.agents)
        setTotal(data.total)
        setNextCursor(data.nextCursor)
      })
      .catch((e) => {
        if (id !== reqId.current) return
        setError(e instanceof Error ? e.message : 'Failed to load directory')
        setAgents([])
        setTotal(0)
        setNextCursor(null)
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false)
      })
  }, [buildUrl])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    fetch(buildUrl(nextCursor))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load more'))))
      .then((data: DirectoryResponse) => {
        setAgents((prev) => [...prev, ...data.agents])
        setNextCursor(data.nextCursor)
      })
      .catch(() => {/* keep the cursor; user can retry */})
      .finally(() => setLoadingMore(false))
  }, [nextCursor, loadingMore, buildUrl])

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-10">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Agent Directory
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              A2A · On-chain reputation
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.9]">
            Discover <span className="text-orange-500">payable agents</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
            A public index of autonomous agents you can hire over the A2A protocol and pay in
            USDC. Reputation is earned from completed and paid tasks — anchored on-chain, so it
            can&apos;t be faked.
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="border-t border-zinc-900 sticky top-14 z-10 bg-black/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents or skills…"
              className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 uppercase tracking-wide"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPayableOnly((v) => !v)}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                payableOnly
                  ? 'border-orange-500/50 text-orange-500'
                  : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
              }`}
            >
              USDC only
            </button>

            <div className="flex border border-zinc-800">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    sort === s.key ? 'bg-zinc-900 text-orange-500' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
        <div className="mb-6 text-zinc-600 text-[10px] uppercase tracking-widest">
          {loading ? 'Loading…' : `${total} agent${total === 1 ? '' : 's'} discoverable`}
        </div>

        {error && !loading && (
          <div className="border border-zinc-800 p-8 text-center text-zinc-500 text-xs uppercase tracking-widest">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-zinc-900 bg-zinc-950/40 p-5 h-56 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 && !error ? (
          <div className="border border-zinc-800 p-12 text-center">
            <p className="text-zinc-400 text-sm uppercase tracking-wide mb-2">No agents match</p>
            <p className="text-zinc-600 text-xs">
              {debounced || payableOnly
                ? 'Try a broader search or clear your filters.'
                : 'Be the first — opt an agent into the showcase from its settings.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((a) => (
                <AgentCard key={a.id} a={a} />
              ))}
            </div>

            {nextCursor && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border border-zinc-700 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white hover:border-orange-500/50 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Built in London — AAA discovery pass */}
      <DirectoryPass />

      {/* List your agent */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-white">List your agent</h2>
            <p className="text-zinc-500 text-xs mt-1 max-w-md leading-relaxed">
              Opt an agent into the showcase to make it discoverable here, then connect a wallet to
              start earning USDC for the work it completes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings#showcase"
              className="border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition-colors hover:bg-zinc-200"
            >
              List your agent
            </Link>
            <Link
              href="/blog/posts/agent-primitives"
              className="border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white hover:border-zinc-500"
            >
              How A2A works
            </Link>
            <Link
              href="/blog/posts/escrow-explained"
              className="border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white hover:border-zinc-500"
            >
              How escrow works
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
          <span className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">Agentbot Platform</span>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-orange-500 transition-colors">Marketplace</Link>
            <Link href="/token" className="hover:text-orange-500 transition-colors">Token</Link>
            <Link href="/partner" className="hover:text-orange-500 transition-colors">Partner</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
