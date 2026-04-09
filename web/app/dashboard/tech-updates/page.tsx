'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cpu, Star, ExternalLink, Radio, Shield, Zap, Layers, TrendingUp, RefreshCw, type LucideIcon } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'
import { DEFAULT_OPENCLAW_GATEWAY_DASHBOARD_URL } from '@/app/lib/openclaw-config'

type Category = 'all' | 'models' | 'infra' | 'security' | 'protocols' | 'tools' | 'openclaw'

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

interface SoulData {
  root?: {
    soul?: {
      free_energy?: { F?: number; regime?: string }
      total_cycles?: number
      active_plan?: {
        goals?: Array<{ id?: string; description?: string; status?: string }>
        recent_outcomes?: Array<{ id?: string; description?: string; result?: string }>
      }
      brain?: {
        params?: number
        steps?: number
        loss?: number
        transformer?: { params?: number; steps?: number }
      }
    }
  }
}

const OPENCLAW_URL = DEFAULT_OPENCLAW_GATEWAY_DASHBOARD_URL

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

const CATEGORY_META: Record<Category, { label: string; icon: LucideIcon; color: string }> = {
  all:       { label: 'All',       icon: Layers,     color: 'text-zinc-400' },
  models:    { label: 'Models',    icon: Cpu,         color: 'text-blue-400' },
  infra:     { label: 'Infra',     icon: Zap,         color: 'text-blue-400' },
  security:  { label: 'Security',  icon: Shield,      color: 'text-red-400' },
  protocols: { label: 'Protocols', icon: Radio,       color: 'text-green-400' },
  tools:     { label: 'Tools',     icon: TrendingUp,  color: 'text-yellow-400' },
  openclaw:  { label: 'OpenClaw',  icon: Cpu,         color: 'text-purple-400' },
}

const IMPACT_STATUS = {
  high: 'error' as const,
  medium: 'idle' as const,
  low: 'active' as const,
}

function fScoreToImpact(f: number | undefined): 'high' | 'medium' | 'low' {
  if (f === undefined) return 'low'
  if (f > 0.5) return 'high'
  if (f > 0.2) return 'medium'
  return 'low'
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildOpenClawItems(soulData: SoulData | null, fetchError: boolean): TechItem[] {
  if (fetchError) {
    return [{
      id: 'oc-error',
      title: 'Soul Data — Fetch Error',
      summary: 'Failed to retrieve OpenClaw soul data from /api/colony/status. Check connectivity and retry.',
      category: 'openclaw',
      date: today(),
      source: 'Borg Soul',
      url: OPENCLAW_URL,
      impact: 'high',
    }]
  }

  if (!soulData) {
    return Array.from({ length: 3 }, (_, i) => ({
      id: `oc-skeleton-${i}`,
      title: i === 0 ? 'Loading soul data...' : i === 1 ? 'Loading neural core...' : 'Loading goals...',
      summary: '\u2588'.repeat(40 + i * 10),
      category: 'openclaw' as Category,
      date: today(),
      source: 'Borg Soul',
      url: OPENCLAW_URL,
      impact: 'low' as const,
    }))
  }

  const soul = soulData.root?.soul
  const fe = soul?.free_energy
  const brain = soul?.brain
  const plan = soul?.active_plan
  const items: TechItem[] = []

  // Fitness score
  items.push({
    id: 'oc-fitness',
    title: 'Borg Soul — Fitness Score',
    summary: `F=${fe?.F ?? 'loading'} | ${fe?.regime ?? ''} | ${soul?.total_cycles ?? 0} cycles`,
    category: 'openclaw',
    date: today(),
    source: 'Borg Soul',
    url: OPENCLAW_URL,
    impact: fScoreToImpact(fe?.F),
  })

  // Neural core / brain metrics
  if (brain) {
    const brainSummary = [
      brain.params != null ? `params=${brain.params}` : null,
      brain.steps != null ? `steps=${brain.steps}` : null,
      brain.loss != null ? `loss=${brain.loss}` : null,
      brain.transformer?.params != null ? `tx_params=${brain.transformer.params}` : null,
      brain.transformer?.steps != null ? `tx_steps=${brain.transformer.steps}` : null,
    ].filter(Boolean).join(' | ')

    items.push({
      id: 'oc-brain',
      title: 'Neural Core',
      summary: brainSummary || 'No brain metrics available',
      category: 'openclaw',
      date: today(),
      source: 'Borg Soul',
      url: OPENCLAW_URL,
      impact: 'medium',
    })
  }

  // Active goals
  if (plan?.goals && plan.goals.length > 0) {
    plan.goals.forEach((goal, i) => {
      items.push({
        id: `oc-goal-${i}`,
        title: `Goal: ${goal.description ?? `#${i + 1}`}`,
        summary: `Status: ${goal.status ?? 'unknown'}`,
        category: 'openclaw',
        date: today(),
        source: 'Borg Soul',
        url: OPENCLAW_URL,
        impact: goal.status === 'active' ? 'high' : 'medium',
      })
    })
  }

  // Recent outcomes
  if (plan?.recent_outcomes && plan.recent_outcomes.length > 0) {
    plan.recent_outcomes.forEach((outcome, i) => {
      items.push({
        id: `oc-outcome-${i}`,
        title: `Outcome: ${outcome.description ?? `#${i + 1}`}`,
        summary: `Result: ${outcome.result ?? 'pending'}`,
        category: 'openclaw',
        date: today(),
        source: 'Borg Soul',
        url: OPENCLAW_URL,
        impact: outcome.result === 'success' ? 'high' : 'low',
      })
    })
  }

  return items
}

export default function TechUpdatesPage() {
  const [active, setActive] = useState<Category>('all')
  const [starred, setStarred] = useState<Set<string>>(new Set(ITEMS.filter(i => i.starred).map(i => i.id)))
  const [soulData, setSoulData] = useState<SoulData | null>(null)
  const [soulError, setSoulError] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchSoulData = useCallback(async () => {
    try {
      setSoulError(false)
      const res = await fetch('/api/colony/status?action=tree')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSoulData(data)
      setLastRefresh(new Date())
    } catch {
      setSoulError(true)
      setSoulData(null)
    }
  }, [])

  useEffect(() => {
    if (active === 'openclaw') {
      fetchSoulData()
      const interval = setInterval(fetchSoulData, 60_000)
      return () => clearInterval(interval)
    }
  }, [active, fetchSoulData])

  const openClawItems = active === 'openclaw' ? buildOpenClawItems(soulData, soulError) : []

  const filtered =
    active === 'openclaw'
      ? openClawItems
      : ITEMS.filter(i => active === 'all' || i.category === active)

  const itemCount = active === 'openclaw' ? openClawItems.length : ITEMS.length

  const toggleStar = (id: string) =>
    setStarred(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <DashboardShell>
      <DashboardHeader
        title="Tech Updates"
        icon={<Radio className="h-5 w-5 text-green-400" />}
        count={itemCount}
        action={
          active === 'openclaw' && lastRefresh ? (
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              <RefreshCw className="h-3 w-3" />
              Last refresh {lastRefresh.toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Updated 2026-03-14</span>
          )
        }
      />

      <DashboardContent className="space-y-5">
        {/* Category filter */}
        <div className="flex flex-wrap gap-px bg-zinc-800">
          {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  active === cat
                    ? 'bg-zinc-950 border border-zinc-700 text-white'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active === cat ? 'text-white' : meta.color}`} />
                {meta.label}
              </button>
            )
          })}
        </div>

        {/* Items */}
        <div className="space-y-px bg-zinc-800">
          {filtered.map(item => {
            const catMeta = CATEGORY_META[item.category]
            const CatIcon = catMeta.icon
            const isSkeleton = item.id.startsWith('oc-skeleton')
            return (
              <div key={item.id} className={`bg-zinc-950 border border-zinc-800 p-5 flex gap-4 ${isSkeleton ? 'animate-pulse' : ''}`}>
                <CatIcon className={`h-4 w-4 mt-1 shrink-0 ${catMeta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className={`text-sm font-bold uppercase tracking-tight leading-tight ${isSkeleton ? 'text-zinc-700' : 'text-white'}`}>{item.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={IMPACT_STATUS[item.impact]} label={item.impact} size="sm" />
                      <button onClick={() => toggleStar(item.id)} className="transition-colors">
                        <Star className={`h-4 w-4 ${starred.has(item.id) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700 hover:text-zinc-400'}`} />
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed mb-3 ${isSkeleton ? 'text-zinc-800 select-none' : 'text-zinc-500'}`}>{item.summary}</p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                    <span className="font-mono">{item.date}</span>
                    <span>·</span>
                    <span>{item.source}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-zinc-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
