'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import { DollarSign, TrendingDown, TrendingUp, Zap, Clock } from 'lucide-react'

interface AgentCost {
  name: string
  tokens: number
  cost: number
  calls: number
  avgCostPerCall: number
}

const AGENTS: AgentCost[] = [
  { name: 'Atlas',      tokens: 2_840_000, cost: 8.52,  calls: 1247, avgCostPerCall: 0.0068 },
  { name: 'Watchtower', tokens: 920_000,  cost: 2.76,  calls:  412, avgCostPerCall: 0.0067 },
  { name: 'DJ Bot',     tokens: 480_000,  cost: 1.44,  calls:  189, avgCostPerCall: 0.0076 },
  { name: 'Swarm-1',   tokens: 320_000,  cost: 0.96,  calls:   98, avgCostPerCall: 0.0098 },
]

const DAILY: { date: string; cost: number; tokens: number }[] = [
  { date: 'Mar 8',  cost: 1.12, tokens: 374_000 },
  { date: 'Mar 9',  cost: 0.87, tokens: 290_000 },
  { date: 'Mar 10', cost: 1.43, tokens: 477_000 },
  { date: 'Mar 11', cost: 1.89, tokens: 630_000 },
  { date: 'Mar 12', cost: 1.24, tokens: 413_000 },
  { date: 'Mar 13', cost: 1.67, tokens: 557_000 },
  { date: 'Mar 14', cost: 1.46, tokens: 487_000 },
]

const MODEL_BREAKDOWN = [
  { model: 'claude-3-7-sonnet', percent: 68, cost: 9.18 },
  { model: 'claude-3-5-haiku',  percent: 24, cost: 3.24 },
  { model: 'gpt-4o-mini',       percent:  8, cost: 1.08 },
]

const totalCost = AGENTS.reduce((s, a) => s + a.cost, 0)
const totalTokens = AGENTS.reduce((s, a) => s + a.tokens, 0)
const totalCalls = AGENTS.reduce((s, a) => s + a.calls, 0)

const StatCard = ({
  icon: Icon, label, value, sub, trend, color = 'text-blue-400',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; trend?: 'up' | 'down'; color?: string
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-semibold tracking-widest">
        <Icon className={`h-4 w-4 ${color}`} />{label}
      </div>
      {trend === 'up'   && <TrendingUp   className="h-4 w-4 text-red-400" />}
      {trend === 'down' && <TrendingDown className="h-4 w-4 text-green-400" />}
    </div>
    <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
)

export default function CostPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'mtd'>('7d')

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">Cost Tracking</h1>
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
          {(['7d', '30d', 'mtd'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === 'mtd' ? 'MTD' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="7-Day Cost"    value={`$${totalCost.toFixed(2)}`}            sub="all agents"          color="text-green-400" trend="down" />
          <StatCard icon={Zap}        label="Tokens Used"   value={`${(totalTokens / 1_000_000).toFixed(1)}M`} sub="input + output" color="text-blue-400" />
          <StatCard icon={Clock}      label="API Calls"     value={totalCalls.toLocaleString()}            sub="last 7 days"         color="text-purple-400" />
          <StatCard icon={DollarSign} label="Avg / Call"    value={`$${(totalCost / totalCalls).toFixed(4)}`} sub="blended"          color="text-yellow-400" />
        </div>

        {/* Daily cost chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Daily Spend ($)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={DAILY}>
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
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Cost']}
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="cost" stroke="#10b981" fill="url(#costGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-agent breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Cost by Agent</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={AGENTS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Cost']}
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
              />
              <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Model Cost Split</h2>
          <div className="space-y-3">
            {MODEL_BREAKDOWN.map(m => (
              <div key={m.model} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-mono">{m.model}</span>
                  <span className="text-gray-400">${m.cost.toFixed(2)} · {m.percent}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Agent Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
              <tr>
                <th className="px-5 py-3 text-left">Agent</th>
                <th className="px-5 py-3 text-right">Tokens</th>
                <th className="px-5 py-3 text-right">Calls</th>
                <th className="px-5 py-3 text-right">$/Call</th>
                <th className="px-5 py-3 text-right font-bold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {AGENTS.map(a => (
                <tr key={a.name} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium">{a.name}</td>
                  <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">{(a.tokens / 1_000).toFixed(0)}K</td>
                  <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">{a.calls.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">${a.avgCostPerCall.toFixed(4)}</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-green-400">${a.cost.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-700 bg-gray-800/30">
                <td className="px-5 py-3 font-bold text-gray-300">Total</td>
                <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">{(totalTokens / 1_000_000).toFixed(1)}M</td>
                <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">{totalCalls.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-gray-400 font-mono text-xs">—</td>
                <td className="px-5 py-3 text-right font-mono font-bold text-white">${totalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
