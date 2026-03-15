'use client'

import { useState } from 'react'
import { TrendingUp, ExternalLink, Eye, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp } from 'lucide-react'

interface Competitor {
  name: string
  description: string
  price: string
  change: number // % MoM
  sentiment: 'up' | 'down' | 'neutral'
  signals: string[]
}

const COMPETITORS: Competitor[] = [
  {
    name: 'Relevance AI',
    description: 'No-code agent builder targeting enterprise teams',
    price: '$19–$599/mo',
    change: 12,
    sentiment: 'up',
    signals: ['Raised $24M Series A', 'New Zapier integration', 'SOC 2 Type II certified'],
  },
  {
    name: 'Lindy.ai',
    description: 'Personal AI assistant with workflow automation',
    price: '$29–$299/mo',
    change: 8,
    sentiment: 'up',
    signals: ['1M+ users milestone', 'Added Slack agent', 'GPT-5 integration live'],
  },
  {
    name: 'Beam.ai',
    description: 'Enterprise AI agent platform with SOC 2',
    price: 'Custom',
    change: -3,
    sentiment: 'down',
    signals: ['CTO departure', 'Enterprise sales pivot', 'Pricing increased 30%'],
  },
  {
    name: 'AgentGPT',
    description: 'Open-source autonomous agent runner',
    price: 'Free / OSS',
    change: 0,
    sentiment: 'neutral',
    signals: ['Star growth plateaued', 'Community fork gaining traction', 'No recent releases'],
  },
]

interface Signal {
  id: string
  text: string
  source: string
  date: string
  sentiment: 'pos' | 'neg' | 'neutral'
}

const MARKET_SIGNALS: Signal[] = [
  { id: '1', text: 'AI agent space projected to reach $45B by 2028 (Gartner)', source: 'Gartner', date: '2026-03-12', sentiment: 'pos' },
  { id: '2', text: 'Anthropic API usage up 340% YoY among developer accounts', source: 'Anthropic Q1 Letter', date: '2026-03-10', sentiment: 'pos' },
  { id: '3', text: 'EU AI Act enforcement begins July 2026 — compliance window closing', source: 'EU Official', date: '2026-03-09', sentiment: 'neutral' },
  { id: '4', text: 'OpenAI releases operator guidance tightening plugin security requirements', source: 'OpenAI Blog', date: '2026-03-07', sentiment: 'neutral' },
  { id: '5', text: 'VC investment in AI tooling down 18% QoQ as market consolidates', source: 'Crunchbase', date: '2026-03-05', sentiment: 'neg' },
]

const SENTIMENT_COLOR = { up: 'text-green-400', down: 'text-red-400', neutral: 'text-gray-400' }
const SIGNAL_COLOR = { pos: 'border-green-800/40 bg-green-900/10', neg: 'border-red-800/40 bg-red-900/10', neutral: 'border-gray-700 bg-gray-900/20' }

export default function MarketIntelPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <h1 className="text-xl font-bold tracking-tight">Market Intel</h1>
        <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 rounded-full px-3 py-0.5">Updated weekly</span>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Competitor grid */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Competitive Landscape</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {COMPETITORS.map(c => {
              const isOpen = expanded === c.name
              return (
                <div key={c.name} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : c.name)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{c.name}</span>
                        <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 rounded px-2 py-0.5">{c.price}</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{c.description}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`flex items-center gap-1 text-sm font-mono font-bold ${SENTIMENT_COLOR[c.sentiment]}`}>
                        {c.sentiment === 'up'      ? <ArrowUpRight className="h-4 w-4" />
                         : c.sentiment === 'down'  ? <ArrowDownRight className="h-4 w-4" />
                         :                           <Minus className="h-4 w-4" />}
                        {c.change > 0 ? `+${c.change}%` : c.change === 0 ? '—' : `${c.change}%`}
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-gray-800">
                      <div className="pt-3 space-y-1.5">
                        {c.signals.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-gray-600 mt-0.5">›</span>
                            {s}
                          </div>
                        ))}
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
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Market Signals
          </h2>
          <div className="space-y-2">
            {MARKET_SIGNALS.map(sig => (
              <div key={sig.id} className={`flex items-start gap-4 border rounded-xl px-5 py-3 ${SIGNAL_COLOR[sig.sentiment]}`}>
                <p className="text-sm text-gray-200 flex-1 leading-relaxed">{sig.text}</p>
                <div className="shrink-0 flex flex-col items-end gap-1 text-[10px] text-gray-500 font-mono">
                  <span>{sig.date}</span>
                  <span>{sig.source}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Opportunity map */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Opportunity Map</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'DJ / Creative AI', gap: 'No competitor owns the music-creator segment', action: 'Double down on DJ Stream + $BASEFM ecosystem', color: 'border-purple-800/40 bg-purple-900/10' },
              { title: 'Wallet-native Auth', gap: 'Competitors rely on email auth only', action: 'SIWE + Base smart wallet is a genuine moat', color: 'border-blue-800/40 bg-blue-900/10' },
              { title: 'UK Market Pricing', gap: 'Most competitors price USD only — GBP adoption friction', action: 'GBP pricing already live — lean into UK marketing', color: 'border-green-800/40 bg-green-900/10' },
            ].map(opp => (
              <div key={opp.title} className={`border rounded-xl p-5 ${opp.color}`}>
                <div className="font-semibold text-sm mb-1.5">{opp.title}</div>
                <div className="text-xs text-gray-400 mb-3">{opp.gap}</div>
                <div className="text-xs text-gray-300 flex items-start gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                  {opp.action}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
