'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { Activity, DollarSign, Zap, Shield, MessageSquare, Bot, Clock, Database } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

interface CostSummary {
  totalCost: number
  totalTokens: number
  totalCalls: number
  avgCostPerCall: number
}

interface DailyCost {
  date: string
  cost: number
  tokens: number
}

interface AgentCost {
  name: string
  tokens: number
  cost: number
  calls: number
  model: string
}

interface ModelBreakdown {
  model: string
  percent: number
  cost: number
}

interface Metrics {
  agents: { total: number; active: number; inactive: number; failed: number }
  messages: { today: number; thisWeek: number; thisMonth: number }
  deployments: { total: number; successful: number; failed: number }
  uptime: { platformUptime: number; averageAgentUptime: number }
  performance: { averageResponseTime: number; successRate: number; errorRate: number }
  storage: { used: number; total: number; percentUsed: number }
}

export default function SystemPulsePage() {
  const [costPeriod, setCostPeriod] = useState('7d')

  const { data: metricsData } = useQuery({
    queryKey: ['system-pulse-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const { data: costData } = useQuery({
    queryKey: ['cost-dashboard', costPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/cost?period=${costPeriod}`)
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const metrics: Metrics | undefined = metricsData?.metrics
  const costSummary: CostSummary | undefined = costData?.summary
  const daily: DailyCost[] = costData?.daily || []
  const agents: AgentCost[] = costData?.agents || []
  const modelBreakdown: ModelBreakdown[] = costData?.modelBreakdown || []
  const isMockData = costData?.isMockData ?? true

  const StatCard = ({
    icon: Icon,
    label,
    value,
    sub,
    color = 'text-blue-400',
  }: {
    icon: React.ElementType
    label: string
    value: string | number
    sub?: string
    color?: string
  }) => (
    <div className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="System Pulse"
        icon={<Activity className="h-5 w-5 text-blue-400" />}
        action={
          <div className="flex items-center gap-3">
            <StatusPill status="active" label="Operational" size="sm" />
            {isMockData && (
              <span className="text-[10px] text-yellow-400 bg-yellow-900/20 border border-yellow-800 px-2 py-0.5 font-mono uppercase tracking-widest">
                Sample Data
              </span>
            )}
            <div className="flex items-center gap-px bg-zinc-800">
              {['7d', '30d'].map(p => (
                <button
                  key={p}
                  onClick={() => setCostPeriod(p)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                    costPeriod === p
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        {/* Stat cards — row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          <StatCard
            icon={DollarSign}
            label="Total Cost"
            value={`$${(costSummary?.totalCost ?? 0).toFixed(2)}`}
            sub={`${costPeriod} spend`}
            color="text-emerald-400"
          />
          <StatCard
            icon={MessageSquare}
            label="API Calls"
            value={costSummary?.totalCalls?.toLocaleString() ?? '0'}
            sub={`${costPeriod} total`}
            color="text-blue-400"
          />
          <StatCard
            icon={Zap}
            label="Uptime"
            value={`${metrics?.uptime?.platformUptime ?? 99.9}%`}
            sub="30-day SLA"
            color="text-green-400"
          />
          <StatCard
            icon={Shield}
            label="Success Rate"
            value={`${metrics?.performance?.successRate ?? 99.1}%`}
            sub={`avg ${metrics?.performance?.averageResponseTime ?? 142}ms`}
            color="text-emerald-400"
          />
        </div>

        {/* Stat cards — row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          <StatCard
            icon={Bot}
            label="Agents"
            value={metrics?.agents?.total ?? agents.length}
            sub={`${metrics?.agents?.active ?? 0} active`}
            color="text-purple-400"
          />
          <StatCard
            icon={MessageSquare}
            label="Messages Today"
            value={metrics?.messages?.today?.toLocaleString() ?? '—'}
            sub={`${metrics?.messages?.thisWeek ?? 0} this week`}
            color="text-blue-400"
          />
          <StatCard
            icon={Database}
            label="Storage"
            value={`${metrics?.storage?.percentUsed ?? 0}%`}
            sub={`${metrics?.storage?.used ?? 0} / ${metrics?.storage?.total ?? 0} MB`}
            color="text-orange-400"
          />
          <StatCard
            icon={Clock}
            label="Avg Response"
            value={`${metrics?.performance?.averageResponseTime ?? 142}ms`}
            sub={`err rate ${metrics?.performance?.errorRate ?? 0.9}%`}
            color="text-cyan-400"
          />
        </div>

        {/* Cost over time chart */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Cost Over Time — {costPeriod}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="#10b981" fill="url(#costGrad)" strokeWidth={2} dot={false} name="Cost" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tokens per day */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Tokens Per Day
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
                formatter={(value: any) => [Number(value).toLocaleString(), 'Tokens']}
              />
              <Bar dataKey="tokens" fill="#6366f1" name="Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent breakdown */}
        {agents.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
              Agent Cost Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                    <th className="text-left py-2 px-3">Agent</th>
                    <th className="text-right py-2 px-3">Calls</th>
                    <th className="text-right py-2 px-3">Tokens</th>
                    <th className="text-right py-2 px-3">Cost</th>
                    <th className="text-right py-2 px-3">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a.name} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-zinc-300">{a.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">{a.calls.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">{a.tokens.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">${a.cost.toFixed(4)}</td>
                      <td className="py-3 px-3 text-right text-zinc-600">{a.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Model breakdown */}
        {modelBreakdown.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
              Model Usage
            </h2>
            <div className="space-y-3">
              {modelBreakdown.map(m => (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500 w-40 truncate">{m.model}</span>
                  <div className="flex-1 bg-zinc-800 h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 w-12 text-right">{m.percent}%</span>
                  <span className="text-xs font-mono text-emerald-400 w-16 text-right">${m.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
