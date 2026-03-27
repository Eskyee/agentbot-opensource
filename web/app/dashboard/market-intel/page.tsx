'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Eye, ArrowUpRight, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Competitor {
  name: string
  url: string
  description: string
  price: string
  status: 'up' | 'down' | 'unknown'
  responseMs: number | null
}

interface Signal {
  id: string
  text: string
  source: string
  date: string
  sentiment: 'pos' | 'neg' | 'neutral'
}

interface Opportunity {
  title: string
  gap: string
  action: string
}

interface MarketData {
  generatedAt: string
  competitors: Competitor[]
  signals: Signal[]
  opportunities: Opportunity[]
}

const STATUS_COLOR: Record<string, string> = {
  up: 'bg-green-400',
  down: 'bg-red-400',
  unknown: 'bg-zinc-500',
}

const SENTIMENT_COLOR: Record<string, string> = {
  pos: 'text-green-400',
  neg: 'text-red-400',
  neutral: 'text-zinc-400',
}

export default function MarketIntelPage() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/market-intel')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setData(json)
      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error('Market intel fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <DashboardShell>
      <DashboardHeader
        title="Market Intel"
        icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
        action={
          <button
            onClick={fetchData}
            disabled={loading}
            className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <DashboardContent className="space-y-8">
        {lastGenerated && (
          <p className="text-[10px] text-zinc-600 font-mono">Generated at {lastGenerated}</p>
        )}

        {loading && !data ? (
          <div className="flex flex-col py-20 gap-4 items-center">
            <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest">Scanning competitors…</p>
          </div>
        ) : (
          <>
            {/* Competitor grid */}
            <section>
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Competitive Landscape — Live Status</h2>
              <div className="space-y-px bg-zinc-800">
                {data?.competitors.map(c => {
                  const isOpen = expanded === c.name
                  return (
                    <div key={c.name} className="bg-zinc-950 border border-zinc-800">
                      <button
                        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-zinc-900/50 transition-colors"
                        onClick={() => setExpanded(isOpen ? null : c.name)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold uppercase tracking-tight">{c.name}</span>
                            <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-0.5 font-mono">{c.price}</span>
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{c.description}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[c.status]}`} />
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {c.responseMs ? `${c.responseMs}ms` : c.status === 'down' ? 'down' : '—'}
                            </span>
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 border-t border-zinc-800 pt-3">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-zinc-600">URL:</span>
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">{c.url}</a>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <span className="text-zinc-600">Response:</span>
                            <span>{c.responseMs ? `${c.responseMs}ms` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <span className="text-zinc-600">Status:</span>
                            <span className={SENTIMENT_COLOR[c.status === 'up' ? 'pos' : c.status === 'down' ? 'neg' : 'neutral']}>
                              {c.status === 'up' ? 'Operational' : c.status === 'down' ? 'Offline' : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Market signals */}
            <section>
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" /> Market Signals
              </h2>
              <div className="space-y-px bg-zinc-800">
                {data?.signals.map(sig => (
                  <div key={sig.id} className="bg-zinc-950 border border-zinc-800 flex items-start gap-4 px-5 py-3">
                    <p className="text-xs text-zinc-300 flex-1 leading-relaxed">{sig.text}</p>
                    <div className="shrink-0 flex flex-col items-end gap-1 text-[10px] text-zinc-600 font-mono">
                      <span>{sig.date}</span>
                      <span>{sig.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Opportunity map */}
            <section>
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Opportunity Map</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
                {data?.opportunities.map(opp => (
                  <div key={opp.title} className="bg-zinc-950 border border-zinc-800 p-5">
                    <div className="text-sm font-bold uppercase tracking-tight mb-1.5">{opp.title}</div>
                    <div className="text-xs text-zinc-500 mb-3">{opp.gap}</div>
                    <div className="text-xs text-zinc-400 flex items-start gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                      {opp.action}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
