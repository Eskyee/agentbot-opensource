'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  History, Bot, Wrench, Settings, Rocket, Filter,
  ChevronDown, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface AuditEntry {
  id: string
  action: string
  category: string
  detail: string | null
  metadata: Record<string, unknown> | null
  agentId: string | null
  agentName: string | null
  createdAt: string
}

const categoryConfig: Record<string, { icon: typeof Bot; color: string; label: string }> = {
  agent: { icon: Bot, color: 'text-orange-400', label: 'Agent' },
  skill: { icon: Wrench, color: 'text-orange-400', label: 'Skill' },
  config: { icon: Settings, color: 'text-blue-400', label: 'Config' },
  deployment: { icon: Rocket, color: 'text-emerald-400', label: 'Deploy' },
}

const actionLabels: Record<string, string> = {
  config_changed: 'Configuration Changed',
  skill_installed: 'Skill Installed',
  skill_removed: 'Skill Removed',
  model_switched: 'Model Switched',
  status_changed: 'Status Changed',
  agent_created: 'Agent Created',
  agent_deleted: 'Agent Deleted',
  agent_restarted: 'Agent Restarted',
  channel_connected: 'Channel Connected',
  channel_disconnected: 'Channel Disconnected',
  webhook_created: 'Webhook Created',
  webhook_deleted: 'Webhook Deleted',
  approval_granted: 'Approval Granted',
  approval_denied: 'Approval Denied',
}

export default function ChangelogPage() {
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading } = useQuery<{
    entries: AuditEntry[]
    total: number
    hasMore: boolean
  }>({
    queryKey: ['changelog', category, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) })
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/dashboard/changelog?${params}`)
      if (!res.ok) throw new Error('Failed to load changelog')
      return res.json()
    },
  })

  const entries = data?.entries ?? []
  const total = data?.total ?? 0

  // Group entries by date
  const grouped = entries.reduce<Record<string, AuditEntry[]>>((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Changelog"
        subtitle="Audit trail of all configuration changes, skill installs, and model switches"
        icon={<History className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {total} events
            </span>
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              {['all', 'agent', 'skill', 'config', 'deployment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(0) }}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors',
                    category === cat ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  )}
                >
                  {cat === 'all' ? 'All' : categoryConfig[cat]?.label ?? cat}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">No events yet</h3>
            <p className="text-xs text-zinc-500">
              Changes to your agents, skills, and config will appear here.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-3 w-3 text-zinc-600" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{date}</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="space-y-2">
                {items.map((entry) => {
                  const cfg = categoryConfig[entry.category] ?? categoryConfig.agent
                  const Icon = cfg.icon
                  return (
                    <div
                      key={entry.id}
                      className="border border-zinc-800 bg-zinc-950 p-4 flex items-start gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className={cn('mt-0.5', cfg.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {actionLabels[entry.action] ?? entry.action}
                          </span>
                          <span className={cn(
                            'text-[9px] uppercase tracking-widest px-1.5 py-0.5 border',
                            cfg.color,
                            `border-current/20`
                          )}>
                            {cfg.label}
                          </span>
                          {entry.agentName && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {entry.agentName}
                            </span>
                          )}
                        </div>
                        {entry.detail && (
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{entry.detail}</p>
                        )}
                        {entry.metadata && typeof entry.metadata === 'object' && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(entry.metadata).map(([key, val]) => (
                              <span
                                key={key}
                                className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 border border-zinc-800"
                              >
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono shrink-0">
                        {new Date(entry.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn(
                'text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors',
                page === 0
                  ? 'border-zinc-900 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
              )}
            >
              Previous
            </button>
            <span className="text-[10px] text-zinc-600">
              Page {page + 1} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((p) => (data?.hasMore ? p + 1 : p))}
              disabled={!data?.hasMore}
              className={cn(
                'text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors',
                !data?.hasMore
                  ? 'border-zinc-900 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
              )}
            >
              Next
            </button>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
