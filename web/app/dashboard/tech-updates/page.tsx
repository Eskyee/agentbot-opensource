'use client'

import { useState } from 'react'
import { Cpu, Star, ExternalLink, Radio, Shield, Zap, Layers, TrendingUp } from 'lucide-react'

type Category = 'all' | 'models' | 'infra' | 'security' | 'protocols' | 'tools'

interface TechItem {
  id: string
  title: string
  summary: string
  category: Category
  date: string
  source: string
  url: string
  impact: 'high' | 'medium' | 'low'
  starred?: boolean
}

const ITEMS: TechItem[] = [
  {
    id: '1', category: 'models',
    title: 'Claude 3.7 Sonnet — Extended Thinking GA',
    summary: 'Anthropic ships extended thinking to production. 200K context window, improved tool use reliability, and hybrid reasoning mode that blends fast and deep thinking per token budget.',
    date: '2026-03-14', source: 'Anthropic', url: 'https://anthropic.com',
    impact: 'high', starred: true,
  },
  {
    id: '2', category: 'protocols',
    title: 'MCP 1.1 — Resource Subscriptions + Streaming',
    summary: 'Model Context Protocol adds resource subscriptions so servers can push updates to clients without polling. Key for real-time agent memory and event-driven pipelines.',
    date: '2026-03-13', source: 'Anthropic / MCP', url: 'https://modelcontextprotocol.io',
    impact: 'high',
  },
  {
    id: '3', category: 'infra',
    title: 'Vercel Edge Runtime v4 — Global KV Native',
    summary: 'Vercel announces built-in KV at the edge — zero cold starts, 1ms global reads. Replaces the need for external Redis for session and rate-limiting use cases.',
    date: '2026-03-12', source: 'Vercel', url: 'https://vercel.com',
    impact: 'medium',
  },
  {
    id: '4', category: 'security',
    title: 'Prompt Injection Mitigations — OWASP LLM Top 10 Update',
    summary: 'OWASP updates LLM security guidance with structured output enforcement, tool call sandboxing, and multi-agent trust boundary recommendations.',
    date: '2026-03-11', source: 'OWASP', url: 'https://owasp.org',
    impact: 'high',
  },
  {
    id: '5', category: 'tools',
    title: 'Prisma 6 — Turso SQLite Edge Support',
    summary: 'Prisma 6 ships native Turso / libSQL adapter. SQLite at the edge with branching and embedded replicas — critical for local-first agent architectures.',
    date: '2026-03-10', source: 'Prisma', url: 'https://prisma.io',
    impact: 'medium',
  },
  {
    id: '6', category: 'models',
    title: 'OpenAI GPT-5 — Function Calling v3',
    summary: 'Parallel function calls, typed return schemas, and auto-retry for malformed tool outputs. Reduces agent reliability engineering by ~60% in early benchmarks.',
    date: '2026-03-09', source: 'OpenAI', url: 'https://openai.com',
    impact: 'medium',
  },
  {
    id: '7', category: 'infra',
    title: 'Next.js 15.2 — Partial Prerendering Stable',
    summary: 'PPR ships stable — static shell + streaming dynamic holes. Eliminates the loading spinner anti-pattern for authenticated dashboards.',
    date: '2026-03-08', source: 'Vercel / Next.js', url: 'https://nextjs.org',
    impact: 'medium',
  },
  {
    id: '8', category: 'protocols',
    title: 'A2A Protocol Draft — Agent-to-Agent Auth',
    summary: 'Google publishes Agent-to-Agent authentication spec with JWT + DID-based identity. Enables cryptographically verified inter-agent messaging across providers.',
    date: '2026-03-07', source: 'Google DeepMind', url: 'https://deepmind.google',
    impact: 'high',
  },
]

const CATEGORY_META: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  all:       { label: 'All',       icon: Layers,    color: 'text-gray-400' },
  models:    { label: 'Models',    icon: Cpu,        color: 'text-purple-400' },
  infra:     { label: 'Infra',     icon: Zap,        color: 'text-blue-400' },
  security:  { label: 'Security',  icon: Shield,     color: 'text-red-400' },
  protocols: { label: 'Protocols', icon: Radio,      color: 'text-green-400' },
  tools:     { label: 'Tools',     icon: TrendingUp, color: 'text-yellow-400' },
}

const IMPACT_COLOR = {
  high:   'text-red-400 bg-red-900/20 border-red-800/40',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40',
  low:    'text-green-400 bg-green-900/20 border-green-800/40',
}

export default function TechUpdatesPage() {
  const [active, setActive] = useState<Category>('all')
  const [starred, setStarred] = useState<Set<string>>(new Set(ITEMS.filter(i => i.starred).map(i => i.id)))

  const filtered = ITEMS.filter(i => active === 'all' || i.category === active)

  const toggleStar = (id: string) =>
    setStarred(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">Tech Updates</h1>
          <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 rounded-full px-3 py-0.5">{ITEMS.length} items</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">Updated 2026-03-14</span>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active === cat ? 'text-white' : meta.color}`} />
                {meta.label}
              </button>
            )
          })}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filtered.map(item => {
            const catMeta = CATEGORY_META[item.category]
            const CatIcon = catMeta.icon
            return (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
                <CatIcon className={`h-4 w-4 mt-1 shrink-0 ${catMeta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-sm font-semibold text-white leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium border rounded px-2 py-0.5 ${IMPACT_COLOR[item.impact]}`}>
                        {item.impact}
                      </span>
                      <button onClick={() => toggleStar(item.id)} className="transition-colors">
                        <Star className={`h-4 w-4 ${starred.has(item.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-gray-400'}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.summary}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="font-mono">{item.date}</span>
                    <span>·</span>
                    <span>{item.source}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
