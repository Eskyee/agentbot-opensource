'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import {
  Activity, DollarSign, Cpu, Shield, MessageSquare, Bot, Clock, Server, Radio, type LucideIcon,
} from 'lucide-react'
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

interface UserOpenClaw {
  openclawUrl: string | null
  openclawInstanceId: string | null
}

interface InstanceSnapshot {
  userId: string
  status: string
  startedAt?: string
  subdomain?: string
  url?: string
  plan?: string
  openclawVersion?: string
}

interface ServiceStatus {
  name: string
  status: 'ok' | 'degraded' | 'down'
  detail?: string
}

interface ServiceHealthPayload {
  services: ServiceStatus[]
  timestamp: string
}

interface GatewayStatusPayload {
  health: 'healthy' | 'unreachable'
  sessions: {
    available: boolean
    total: number
    active: number
    error?: string | null
  }
  cron: {
    available: boolean
    total: number
    enabled: number
    error?: string | null
  }
}

const statusTone: Record<string, string> = {
  running: 'text-emerald-400',
  active: 'text-emerald-400',
  healthy: 'text-emerald-400',
  starting: 'text-amber-300',
  provisioning: 'text-amber-300',
  unreachable: 'text-red-400',
  error: 'text-red-400',
  failed: 'text-red-400',
  unknown: 'text-zinc-400',
}

const serviceDot: Record<ServiceStatus['status'], string> = {
  ok: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
}

export default function SystemPulsePage() {
  const [costPeriod, setCostPeriod] = useState('7d')

  const { data: openclaw } = useQuery<UserOpenClaw>({
    queryKey: ['system-pulse-openclaw'],
    queryFn: async () => {
      const res = await fetch('/api/user/openclaw')
      if (!res.ok) throw new Error('Failed to load runtime')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const { data: instance } = useQuery<InstanceSnapshot>({
    queryKey: ['system-pulse-instance', openclaw?.openclawInstanceId],
    queryFn: async () => {
      const res = await fetch(`/api/instance/${openclaw?.openclawInstanceId}`)
      if (!res.ok) throw new Error('Failed to load instance')
      return res.json()
    },
    enabled: Boolean(openclaw?.openclawInstanceId),
    refetchInterval: 30_000,
  })

  const { data: gateway } = useQuery<GatewayStatusPayload>({
    queryKey: ['system-pulse-gateway'],
    queryFn: async () => {
      const res = await fetch('/api/gateway/status')
      if (!res.ok) throw new Error('Failed to load gateway status')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const { data: health } = useQuery<ServiceHealthPayload>({
    queryKey: ['system-pulse-health'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/health')
      if (!res.ok) throw new Error('Failed to load service health')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const { data: costData } = useQuery({
    queryKey: ['cost-dashboard', costPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/cost?period=${costPeriod}`)
      if (!res.ok) throw new Error('Failed to load cost data')
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const costSummary: CostSummary | undefined = costData?.summary
  const daily: DailyCost[] = costData?.daily || []
  const agents: AgentCost[] = costData?.agents || []
  const modelBreakdown: ModelBreakdown[] = costData?.modelBreakdown || []

  const runtimeState = instance?.status || (openclaw?.openclawUrl ? 'unknown' : 'undeployed')
  const runtimeColor = statusTone[runtimeState] || 'text-zinc-400'
  const runtimeUrl = instance?.url || openclaw?.openclawUrl || null
  const services = health?.services || []
  const servicesHealthy = services.filter((service) => service.status === 'ok').length
  const servicesTotal = services.length
  const sessionsLabel = gateway?.sessions.available
    ? `${gateway.sessions.active} active / ${gateway.sessions.total} total`
    : 'Unavailable'
  const cronLabel = gateway?.cron.available
    ? `${gateway.cron.enabled} enabled / ${gateway.cron.total} total`
    : 'Unavailable'

  const StatCard = ({
    icon: Icon,
    label,
    value,
    sub,
    color = 'text-blue-400',
  }: {
    icon: LucideIcon
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
      <div className={`text-2xl sm:text-3xl font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 leading-relaxed">{sub}</div>}
    </div>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="System Pulse"
        icon={<Activity className="h-5 w-5 text-blue-400" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              status={runtimeState === 'running' || runtimeState === 'active' ? 'active' : runtimeState === 'starting' ? 'pending' : 'offline'}
              label={runtimeState}
              size="sm"
            />
            <div className="flex items-center gap-px bg-zinc-800">
              {['7d', '30d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setCostPeriod(period)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                    costPeriod === period
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          <StatCard
            icon={Bot}
            label="OpenClaw"
            value={runtimeState}
            sub={runtimeUrl || 'No runtime deployed'}
            color={runtimeColor}
          />
          <StatCard
            icon={Cpu}
            label="Runtime Version"
            value={instance?.openclawVersion || '—'}
            sub={instance?.startedAt ? `Started ${new Date(instance.startedAt).toLocaleString()}` : 'No instance timestamp'}
            color="text-cyan-400"
          />
          <StatCard
            icon={MessageSquare}
            label="Gateway Sessions"
            value={gateway?.sessions.available ? gateway.sessions.active : '—'}
            sub={sessionsLabel}
            color={gateway?.sessions.available ? 'text-emerald-400' : 'text-zinc-400'}
          />
          <StatCard
            icon={Clock}
            label="Cron Jobs"
            value={gateway?.cron.available ? gateway.cron.enabled : '—'}
            sub={cronLabel}
            color={gateway?.cron.available ? 'text-blue-400' : 'text-zinc-400'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          <StatCard
            icon={Server}
            label="Service Health"
            value={`${servicesHealthy}/${servicesTotal || 0}`}
            sub="Platform services responding"
            color={servicesHealthy === servicesTotal && servicesTotal > 0 ? 'text-emerald-400' : 'text-amber-300'}
          />
          <StatCard
            icon={DollarSign}
            label="Total Cost"
            value={`$${(costSummary?.totalCost ?? 0).toFixed(2)}`}
            sub={`${costPeriod} spend`}
            color="text-emerald-400"
          />
          <StatCard
            icon={Radio}
            label="API Calls"
            value={costSummary?.totalCalls?.toLocaleString() ?? '0'}
            sub={`${costPeriod} total calls`}
            color="text-blue-400"
          />
          <StatCard
            icon={Shield}
            label="Tokens"
            value={costSummary?.totalTokens?.toLocaleString() ?? '0'}
            sub={costSummary ? `$${costSummary.avgCostPerCall.toFixed(4)} avg / call` : 'No token usage yet'}
            color="text-purple-400"
          />
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight">Live Service Health</h2>
            {health?.timestamp && (
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                Updated {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.name} className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">{service.name}</div>
                  <span className={`h-2 w-2 rounded-full ${serviceDot[service.status]}`} />
                </div>
                <div className="mt-3 text-sm font-mono text-white">
                  {service.status === 'ok' ? 'Operational' : service.status === 'degraded' ? 'Degraded' : 'Down'}
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">{service.detail || 'No detail'}</div>
              </div>
            ))}
          </div>
        </div>

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
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="#10b981" fill="url(#costGrad)" strokeWidth={2} dot={false} name="Cost" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Tokens Per Day
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
                formatter={(value: any) => [Number(value).toLocaleString(), 'Tokens']}
              />
              <Bar dataKey="tokens" fill="#6366f1" name="Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>

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
                  {agents.map((agent) => (
                    <tr key={agent.name} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-zinc-300">{agent.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">{agent.calls.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">{agent.tokens.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">${agent.cost.toFixed(4)}</td>
                      <td className="py-3 px-3 text-right text-zinc-600">{agent.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modelBreakdown.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
              Model Usage
            </h2>
            <div className="space-y-3">
              {modelBreakdown.map((model) => (
                <div key={model.model} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500 w-24 sm:w-40 truncate">{model.model}</span>
                  <div className="flex-1 bg-zinc-800 h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${model.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 w-12 text-right">{model.percent}%</span>
                  <span className="text-xs font-mono text-emerald-400 w-16 text-right">${model.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
