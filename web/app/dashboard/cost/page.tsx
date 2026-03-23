'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import { DollarSign, TrendingDown, TrendingUp, Zap, Clock, Loader2 } from 'lucide-react'

interface AgentCost {
  name: string
  tokens: number
  cost: number
  calls: number
  avgCostPerCall: number
  model?: string
}

interface DailyCost {
  date: string
  cost: number
  tokens: number
}

interface ModelBreakdown {
  model: string
  percent: number
  cost: number
}

interface CostData {
  period: string
  summary: {
    totalCost: number
    totalTokens: number
    totalCalls: number
    avgCostPerCall: number
  }
  agents: AgentCost[]
  daily: DailyCost[]
  modelBreakdown: ModelBreakdown[]
  isMockData: boolean
  message?: string
}

// Fetch cost data from API
async function fetchCostData(period: string): Promise<CostData> {
  const res = await fetch(`/api/dashboard/cost?period=${period}`)
  if (!res.ok) throw new Error('Failed to fetch cost data')
  return res.json()
}

const StatCard = ({
  icon: Icon, label, value, sub, trend, color = 'text-blue-400',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; trend?: 'up' | 'down'; color?: string
}) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase font-semibold tracking-widest">
        <Icon className={`h-4 w-4 ${color}`} />{label}
      </div>
      {trend === 'up'   && <TrendingUp   className="h-4 w-4 text-red-400" />}
      {trend === 'down' && <TrendingDown className="h-4 w-4 text-green-400" />}
    </div>
    <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
    {sub && <div className="text-xs text-zinc-500">{sub}</div>}
  </div>
)

export default function CostPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'mtd'>('7d')

  const { data, isLoading, error } = useQuery({
    queryKey: ['cost', period],
    queryFn: () => fetchCostData(period),
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="mt-[4rem] min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mt-[4rem] min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Failed to load cost data</div>
      </div>
    )
  }

  const { summary, agents, daily, modelBreakdown, isMockData, message } = data

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">Cost Tracking</h1>
          {isMockData && (
            <span className="text-[10px] uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
              Sample Data
            </span>
          )}
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-1">
          {(['7d', '30d', 'mtd'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p === 'mtd' ? 'MTD' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Mock data banner */}
        {isMockData && message && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
            {message}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label={`${period === 'mtd' ? 'MTD' : period} Cost`}
            value={`$${summary.totalCost.toFixed(2)}`}
            sub="all agents"
            color="text-green-400"
            trend={summary.totalCost > 10 ? 'up' : 'down'}
          />
          <StatCard
            icon={Zap}
            label="Tokens Used"
            value={`${(summary.totalTokens / 1_000_000).toFixed(1)}M`}
            sub="input + output"
            color="text-blue-400"
          />
          <StatCard
            icon={Clock}
            label="API Calls"
            value={summary.totalCalls.toLocaleString()}
            sub={`last ${period}`}
            color="text-blue-400"
          />
          <StatCard
            icon={DollarSign}
            label="Avg / Call"
            value={`$${summary.avgCostPerCall.toFixed(4)}`}
            sub="blended"
            color="text-yellow-400"
          />
        </div>

        {/* Daily cost chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Daily Cost</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="#4ade80" fill="#4ade80" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agent breakdown table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Agent Breakdown</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Agent</th>
                <th className="px-5 py-3 text-right">Tokens</th>
                <th className="px-5 py-3 text-right">Calls</th>
                <th className="px-5 py-3 text-right">Cost</th>
                <th className="px-5 py-3 text-right">Avg/Call</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">{agent.name}</div>
                    {agent.model && <div className="text-xs text-zinc-500">{agent.model}</div>}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{(agent.tokens / 1000).toFixed(0)}K</td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{agent.calls.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-green-400">${agent.cost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-zinc-400">${agent.avgCostPerCall.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-sm font-semibold">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right font-mono">{(summary.totalTokens / 1_000_000).toFixed(1)}M</td>
                <td className="px-5 py-3 text-right font-mono">{summary.totalCalls.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-mono text-green-400">${summary.totalCost.toFixed(2)}</td>
                <td className="px-5 py-3 text-right font-mono text-zinc-400">${summary.avgCostPerCall.toFixed(4)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Model breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Model Breakdown</h2>
          <div className="space-y-3">
            {modelBreakdown.map((m) => (
              <div key={m.model} className="flex items-center gap-4">
                <div className="w-40 text-sm font-mono text-zinc-300 truncate">{m.model}</div>
                <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-zinc-400">{m.percent}%</div>
                <div className="w-20 text-right text-sm font-mono text-green-400">${m.cost.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Token usage chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Token Usage</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: any) => [`${(value / 1000).toFixed(0)}K`, 'Tokens']}
              />
              <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
