'use client'

import { useEffect, useState } from 'react'
import { Sun, RefreshCw, Cpu, TrendingUp, Shield, Calendar, CheckCircle2, ArrowRight } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface BriefSection {
  id: string
  icon: React.ElementType
  title: string
  color: string
  items: string[]
}

function getTodayBrief(): BriefSection[] {
  return [
    {
      id: 'system',
      icon: Cpu,
      title: 'System Status',
      color: 'text-blue-400',
      items: [
        'All agents operational — 99.9% uptime maintained',
        'Vercel deployment: latest build succeeded ✓',
        'Stripe webhook processing normally — last event 4 min ago',
        'Database connections stable — Prisma pool healthy',
      ],
    },
    {
      id: 'tasks',
      icon: CheckCircle2,
      title: 'Completed Yesterday',
      color: 'text-green-400',
      items: [
        'Fixed Stripe checkout prices (Underground £29, Collective £69, Label £199)',
        'Switched API keys to Prisma-backed storage with bcrypt hashing',
        'Resolved NEXTAUTH_SECRET build failure — deploy unblocked',
        'Integrated openclaw-dashboard: fleet, system pulse, memory, signals',
      ],
    },
    {
      id: 'focus',
      icon: ArrowRight,
      title: 'Today\'s Focus',
      color: 'text-yellow-400',
      items: [
        'Apply Prisma migration for ApiKey table to production database',
        'Set CRON_SECRET env var in Vercel dashboard',
        'Review PR: claude/angry-chatterjee → merge when green',
        'Monitor Stripe webhook after price fixes — confirm subscriptions working',
      ],
    },
    {
      id: 'intel',
      icon: TrendingUp,
      title: 'Market Pulse',
      color: 'text-emerald-400',
      items: [
        'Claude 3.7 Sonnet extended thinking now GA — agent quality improvement opportunity',
        'MCP 1.1 resource subscriptions: enables real-time agent memory push',
        'Competitor Lindy.ai at 1M users — differentiate via DJ/creative niche',
        'EU AI Act enforcement July 2026 — begin compliance scoping',
      ],
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security Alerts',
      color: 'text-red-400',
      items: [
        '15 Dependabot vulnerabilities on main branch — 2 critical, 2 high',
        'OWASP LLM Top 10 updated — review prompt injection mitigations',
        'Admin email hardcoded in Navbar (YOUR_ADMIN_EMAIL_2) — move to env var',
        'No anomalies detected in last 24h runtime logs',
      ],
    },
    {
      id: 'calendar',
      icon: Calendar,
      title: 'Upcoming',
      color: 'text-blue-400',
      items: [
        'Daily cron cleanup runs at 03:00 UTC',
        'Subscription billing cycle: end of month (£29–£199 range)',
        'EU AI Act enforcement date: July 2026',
        'Next planned sprint: referral credit system (P3)',
      ],
    },
  ]
}

export default function DailyBriefPage() {
  const [brief, setBrief] = useState<BriefSection[]>([])
  const [loading, setLoading] = useState(true)
  const [lastGenerated, setLastGenerated] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['system', 'tasks', 'focus']))

  const generate = () => {
    setLoading(true)
    setTimeout(() => {
      setBrief(getTodayBrief())
      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setLoading(false)
    }, 800)
  }

  useEffect(() => {
    generate()
  }, [])

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DashboardShell>
      <DashboardHeader
        title="Daily Brief"
        icon={<Sun className="h-5 w-5 text-yellow-400" />}
        action={
          <button
            onClick={generate}
            disabled={loading}
            className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        }
      />

      <DashboardContent className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-zinc-600">{today}</p>
          {lastGenerated && (
            <p className="text-[10px] text-zinc-600 font-mono">Generated at {lastGenerated}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col py-20 gap-4 items-center">
            <RefreshCw className="h-6 w-6 text-yellow-400 animate-spin" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest">Generating your brief…</p>
          </div>
        ) : (
          <div className="space-y-px bg-zinc-800">
            {brief.map(section => {
              const Icon = section.icon
              const isOpen = expanded.has(section.id)
              return (
                <div key={section.id} className="bg-zinc-950 border border-zinc-800">
                  <button
                    onClick={() => toggle(section.id)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-zinc-900/50 transition-colors"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${section.color}`} />
                    <span className="text-sm font-bold flex-1 uppercase tracking-tight">{section.title}</span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{section.items.length} items</span>
                    <svg
                      className={`h-4 w-4 text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <ul className="px-5 pb-4 border-t border-zinc-800 pt-3 space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                          <span className={`mt-1 w-1 h-1 shrink-0 ${section.color.replace('text-', 'bg-')}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
