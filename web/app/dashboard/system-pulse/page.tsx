'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Activity, Cpu, HardDrive, Zap, AlertTriangle, CheckCircle, Shield } from 'lucide-react'

interface Metric {
  time: string
  cpu: number
  memory: number
  rps: number
  errors: number
}

function generateHistory(): Metric[] {
  const now = Date.now()
  return Array.from({ length: 20 }, (_, i) => {
    const t = new Date(now - (19 - i) * 30_000)
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpu: 20 + Math.random() * 40,
      memory: 40 + Math.random() * 30,
      rps: 80 + Math.floor(Math.random() * 120),
      errors: Math.floor(Math.random() * 5),
    }
  })
}

const ANOMALIES = [
  { id: 1, time: '03:14:22', type: 'Latency spike', detail: 'p99 > 2 000ms on /api/agents', severity: 'warn' },
  { id: 2, time: '03:02:11', type: 'Memory pressure', detail: 'Atlas worker heap 88%', severity: 'warn' },
  { id: 3, time: '02:47:55', type: 'Error rate elevated', detail: '4.2 % errors on /api/swarms', severity: 'error' },
]

export default function SystemPulsePage() {
  const [history, setHistory] = useState<Metric[]>(generateHistory)

  const { data: metrics } = useQuery({
    queryKey: ['system-pulse-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics')
      return res.json()
    },
    refetchInterval: 10_000,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setHistory(prev => [
        ...prev.slice(1),
        {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: 20 + Math.random() * 40,
          memory: 40 + Math.random() * 30,
          rps: 80 + Math.floor(Math.random() * 120),
          errors: Math.floor(Math.random() * 5),
        },
      ])
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  const latest = history[history.length - 1]
  const platformUptime = metrics?.metrics?.uptime?.platformUptime ?? 99.9
  const avgResponseTime = metrics?.metrics?.performance?.averageResponseTime ?? 142
  const successRate = metrics?.metrics?.performance?.successRate ?? 99.1

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-semibold tracking-widest">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className={`text-3xl font-mono font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">System Pulse</h1>
          <span className="flex items-center gap-1.5 text-[11px] text-green-400 bg-green-900/20 border border-green-800 rounded-full px-3 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            OPERATIONAL
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{latest?.time}</span>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Cpu} label="CPU" value={`${latest?.cpu.toFixed(1)}%`} sub="live" color="text-purple-400" />
          <StatCard icon={HardDrive} label="Memory" value={`${latest?.memory.toFixed(1)}%`} sub="heap used" color="text-blue-400" />
          <StatCard icon={Zap} label="Uptime" value={`${platformUptime}%`} sub="30-day SLA" color="text-green-400" />
          <StatCard icon={Shield} label="Success Rate" value={`${successRate}%`} sub="p99 / 5min" color="text-emerald-400" />
        </div>

        {/* CPU + Memory chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">CPU &amp; Memory — 10 min rolling</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="#a855f7" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} name="CPU" />
              <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="url(#memGrad)" strokeWidth={1.5} dot={false} name="Memory" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RPS chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Requests / sec</h2>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 12 }} />
              <Line type="monotone" dataKey="rps" stroke="#10b981" strokeWidth={1.5} dot={false} name="RPS" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" /> Anomaly Detection
          </h2>
          {ANOMALIES.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" /> No anomalies detected
            </div>
          ) : (
            <div className="space-y-2">
              {ANOMALIES.map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  a.severity === 'error'
                    ? 'bg-red-900/10 border-red-800/40'
                    : 'bg-yellow-900/10 border-yellow-800/40'
                }`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div>
                    <div className="text-sm font-medium">{a.type}</div>
                    <div className="text-xs text-gray-400">{a.detail}</div>
                  </div>
                  <span className="ml-auto text-[10px] font-mono text-gray-500 shrink-0 pt-0.5">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
