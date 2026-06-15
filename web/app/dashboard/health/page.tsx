'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, Clock, DollarSign, Cpu, Zap, AlertTriangle,
  CheckCircle, XCircle, Radio, Server, Bot, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

interface AgentHealth {
  id: string
  name: string
  status: string
  model: string | null
  lastActive: string | null
  uptime: number | null
  errorRate: number
  tokensUsed: number
  costToday: number
  callsToday: number
  skills: number
  tasks: number
  tasksEnabled: number
}

interface HealthOverview {
  agents: AgentHealth[]
  totals: {
    totalAgents: number
    activeAgents: number
    totalTokens: number
    totalCost: number
    totalCalls: number
    totalErrors: number
    avgErrorRate: number
  }
  gateway: {
    status: string
    sessions: { active: number; total: number }
    cron: { enabled: number; total: number }
  } | null
  timestamp: string
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Bot }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-400', icon: CheckCircle },
  running: { color: 'text-emerald-400', bg: 'bg-emerald-400', icon: CheckCircle },
  idle: { color: 'text-amber-400', bg: 'bg-amber-400', icon: Clock },
  pending: { color: 'text-amber-400', bg: 'bg-amber-400', icon: Clock },
  error: { color: 'text-red-400', bg: 'bg-red-400', icon: XCircle },
  stopped: { color: 'text-zinc-500', bg: 'bg-zinc-500', icon: XCircle },
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-orange-400',
}: {
  icon: typeof Activity
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className={`text-2xl sm:text-3xl font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 leading-relaxed">{sub}</div>}
    </div>
  )
}

export default function HealthDashboardPage() {
  const { data, isLoading } = useQuery<HealthOverview>({
    queryKey: ['health-overview'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/health/overview')
      if (!res.ok) throw new Error('Failed to load health data')
      return res.json()
    },
    refetchInterval: 15_000,
  })

  const totals = data?.totals
  const agents = data?.agents ?? []
  const gateway = data?.gateway

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Health"
        subtitle="Real-time uptime, errors, cost, and token usage per agent"
        icon={<Activity className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            <StatusPill
              status={totals && totals.activeAgents > 0 ? 'active' : 'offline'}
              label={totals ? `${totals.activeAgents}/${totals.totalAgents} active` : '...'}
              size="sm"
            />
            {data?.timestamp && (
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
          <StatCard
            icon={Bot}
            label="Total Agents"
            value={totals?.totalAgents ?? 0}
            sub={totals ? `${totals.activeAgents} active` : '...'}
            color="text-orange-400"
          />
          <StatCard
            icon={Zap}
            label="Tokens Today"
            value={totals?.totalTokens?.toLocaleString() ?? '0'}
            sub="Combined usage"
            color="text-orange-400"
          />
          <StatCard
            icon={DollarSign}
            label="Cost Today"
            value={`$${(totals?.totalCost ?? 0).toFixed(4)}`}
            sub={`${totals?.totalCalls ?? 0} API calls`}
            color="text-emerald-400"
          />
          <StatCard
            icon={AlertTriangle}
            label="Error Rate"
            value={`${((totals?.avgErrorRate ?? 0) * 100).toFixed(1)}%`}
            sub={totals ? `${totals.totalErrors} total errors` : '...'}
            color={(totals?.avgErrorRate ?? 0) > 0.05 ? 'text-red-400' : 'text-emerald-400'}
          />
        </div>

        {/* Gateway status */}
        {gateway && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight">Gateway Status</h2>
              <div className={cn(
                'h-2 w-2 rounded-full',
                gateway.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'
              )} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Status</div>
                <div className="text-sm font-bold text-white uppercase">{gateway.status}</div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Active Sessions</div>
                <div className="text-sm font-bold text-white">{gateway.sessions.active}</div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total Sessions</div>
                <div className="text-sm font-bold text-white">{gateway.sessions.total}</div>
              </div>
              <div className="bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Cron Jobs</div>
                <div className="text-sm font-bold text-white">{gateway.cron.enabled}/{gateway.cron.total}</div>
              </div>
            </div>
          </div>
        )}

        {/* Per-agent health table */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Agent Health — Per Agent
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-xs text-zinc-500">No agents deployed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                    <th className="text-left py-2 px-3">Agent</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Model</th>
                    <th className="text-right py-2 px-3">Last Active</th>
                    <th className="text-right py-2 px-3">Calls</th>
                    <th className="text-right py-2 px-3">Tokens</th>
                    <th className="text-right py-2 px-3">Cost</th>
                    <th className="text-right py-2 px-3">Errors</th>
                    <th className="text-right py-2 px-3">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => {
                    const cfg = statusConfig[agent.status] ?? statusConfig.pending
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={agent.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-zinc-300">{agent.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={cn('h-3 w-3', cfg.color)} />
                            <span className={cn('uppercase tracking-wider', cfg.color)}>{agent.status}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-500 font-mono">{agent.model ?? '—'}</td>
                        <td className="py-3 px-3 text-right text-zinc-500">
                          {agent.lastActive
                            ? new Date(agent.lastActive).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-400">{agent.callsToday}</td>
                        <td className="py-3 px-3 text-right font-mono text-orange-400">{agent.tokensUsed.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">${agent.costToday.toFixed(4)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={cn(
                            'font-mono',
                            agent.errorRate > 0.1 ? 'text-red-400' : agent.errorRate > 0.05 ? 'text-amber-400' : 'text-zinc-500'
                          )}>
                            {(agent.errorRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-400">{agent.skills}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agent health cards */}
        {agents.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
            {agents.map((agent) => {
              const cfg = statusConfig[agent.status] ?? statusConfig.pending
              const StatusIcon = cfg.icon
              return (
                <div key={agent.id} className="bg-zinc-950 p-5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn('h-4 w-4', cfg.color)} />
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{agent.name}</span>
                    </div>
                    <span className={cn('text-[10px] uppercase tracking-widest', cfg.color)}>{agent.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="text-zinc-600 uppercase tracking-widest">Tokens</div>
                      <div className="font-mono text-white">{agent.tokensUsed.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600 uppercase tracking-widest">Cost</div>
                      <div className="font-mono text-emerald-400">${agent.costToday.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600 uppercase tracking-widest">Calls</div>
                      <div className="font-mono text-white">{agent.callsToday}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600 uppercase tracking-widest">Error Rate</div>
                      <div className={cn(
                        'font-mono',
                        agent.errorRate > 0.1 ? 'text-red-400' : agent.errorRate > 0.05 ? 'text-amber-400' : 'text-white'
                      )}>
                        {(agent.errorRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {agent.model && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-600 font-mono">{agent.model}</span>
                    </div>
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
