'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sun, RefreshCw, Cpu, TrendingUp, Shield, Calendar, CheckCircle2, ArrowRight, type LucideIcon } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const ICON_MAP: Record<string, LucideIcon> = {
  system: Cpu,
  tasks: CheckCircle2,
  focus: ArrowRight,
  intel: TrendingUp,
  security: Shield,
  calendar: Calendar,
}

interface BriefSection {
  id: string
  title: string
  color: string
  items: string[]
}

interface BriefData {
  date: string
  generatedAt: string
  brief: BriefSection[]
}

export default function DailyBriefPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastGenerated, setLastGenerated] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['system', 'security', 'focus']))

  const fetchBrief = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/daily-brief')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error('Daily brief fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrief()
  }, [fetchBrief])

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
            onClick={fetchBrief}
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

        {loading && !data ? (
          <div className="flex flex-col py-20 gap-4 items-center">
            <RefreshCw className="h-6 w-6 text-yellow-400 animate-spin" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest">Gathering real-time data…</p>
          </div>
        ) : (
          <div className="space-y-px bg-zinc-800">
            {data?.brief.map(section => {
              const Icon = ICON_MAP[section.id] || Cpu
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
