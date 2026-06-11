'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Eye, Clock, DollarSign, Zap, AlertTriangle, Activity,
  ChevronRight, ChevronDown, Filter, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface TraceStep {
  id: string
  type: string // 'llm_call' | 'tool_call' | 'decision' | 'error'
  name: string
  duration: number | null
  tokens: number | null
  cost: number | null
  status: 'success' | 'error' | 'pending'
  detail: string | null
  timestamp: string
  children?: TraceStep[]
}

interface Trace {
  id: string
  agentId: string
  agentName: string
  trigger: string
  status: 'completed' | 'error' | 'running'
  totalDuration: number | null
  totalTokens: number
  totalCost: number
  steps: TraceStep[]
  startedAt: string
  completedAt: string | null
}

interface ObservabilityStats {
  totalTraces: number
  avgDuration: number
  totalTokens: number
  totalCost: number
  errorRate: number
  topErrors: { message: string; count: number }[]
}

const stepTypeConfig: Record<string, { color: string; label: string }> = {
  llm_call: { color: 'text-orange-400', label: 'LLM' },
  tool_call: { color: 'text-orange-400', label: 'Tool' },
  decision: { color: 'text-blue-400', label: 'Decision' },
  error: { color: 'text-red-400', label: 'Error' },
  memory: { color: 'text-emerald-400', label: 'Memory' },
  search: { color: 'text-sky-400', label: 'Search' },
}

function TraceStepRow({ step, depth = 0 }: { step: TraceStep; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = stepTypeConfig[step.type] ?? { color: 'text-zinc-400', label: step.type }
  const hasChildren = step.children && step.children.length > 0

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 py-2 px-3 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors cursor-pointer',
          depth > 0 && 'bg-zinc-950/50'
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3 w-3 text-zinc-600 shrink-0" /> : <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
        ) : (
          <div className="w-3 shrink-0" />
        )}
        <span className={cn('text-[9px] uppercase tracking-widest w-12 shrink-0', cfg.color)}>
          {cfg.label}
        </span>
        <span className="text-xs font-mono text-zinc-300 flex-1 truncate">{step.name}</span>
        {step.duration != null && (
          <span className="text-[10px] font-mono text-zinc-500 w-16 text-right">
            {step.duration >= 1000 ? `${(step.duration / 1000).toFixed(1)}s` : `${step.duration}ms`}
          </span>
        )}
        {step.tokens != null && (
          <span className="text-[10px] font-mono text-orange-400 w-16 text-right">
            {step.tokens.toLocaleString()}
          </span>
        )}
        {step.cost != null && step.cost > 0 && (
          <span className="text-[10px] font-mono text-emerald-400 w-16 text-right">
            ${step.cost.toFixed(4)}
          </span>
        )}
        <span className={cn(
          'h-2 w-2 rounded-full shrink-0',
          step.status === 'success' ? 'bg-emerald-400' : step.status === 'error' ? 'bg-red-400' : 'bg-amber-400'
        )} />
      </div>
      {expanded && step.children?.map((child) => (
        <TraceStepRow key={child.id} step={child} depth={depth + 1} />
      ))}
    </>
  )
}

export default function ObservabilityPage() {
  const [period, setPeriod] = useState('7d')
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const { data: stats } = useQuery<ObservabilityStats>({
    queryKey: ['observability-stats', period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/observability?period=${period}&stats=true`)
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
  })

  const { data: traces, isLoading } = useQuery<Trace[]>({
    queryKey: ['observability-traces', period, filterType],
    queryFn: async () => {
      const params = new URLSearchParams({ period })
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/dashboard/observability?${params}`)
      if (!res.ok) throw new Error('Failed to load traces')
      return res.json()
    },
    refetchInterval: 10_000,
  })

  const traceList = traces ?? []
  const activeTrace = traceList.find((t) => t.id === selectedTrace)

  return (
    <DashboardShell className="flex flex-col h-screen overflow-hidden">
      <DashboardHeader
        title="Observability"
        subtitle="Decision traces, tool calls, latency, cost, and quality scoring"
        icon={<Eye className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              {['7d', '30d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors',
                    period === p ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              {['all', 'llm_call', 'tool_call', 'error'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors',
                    filterType === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  )}
                >
                  {t === 'all' ? 'All' : t === 'llm_call' ? 'LLM' : t === 'tool_call' ? 'Tools' : 'Errors'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="flex-1 overflow-hidden min-h-0">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-zinc-800 mb-6">
          {[
            { label: 'Traces', value: stats?.totalTraces?.toLocaleString() ?? '0', icon: Activity, color: 'text-orange-400' },
            { label: 'Avg Duration', value: stats?.avgDuration ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '—', icon: Clock, color: 'text-blue-400' },
            { label: 'Total Tokens', value: stats?.totalTokens?.toLocaleString() ?? '0', icon: Zap, color: 'text-orange-400' },
            { label: 'Total Cost', value: stats ? `$${stats.totalCost.toFixed(4)}` : '$0', icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Error Rate', value: stats ? `${(stats.errorRate * 100).toFixed(1)}%` : '—', icon: AlertTriangle, color: stats && stats.errorRate > 0.05 ? 'text-red-400' : 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 p-4 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                <s.icon className={cn('h-3 w-3', s.color)} />
                {s.label}
              </div>
              <div className={cn('text-lg font-mono font-bold', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Main content: split view */}
        <div className="flex gap-px bg-zinc-800 flex-1 min-h-0">
          {/* Left: trace list */}
          <div className="flex-1 min-w-0 bg-zinc-950 overflow-y-auto">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                Execution Traces ({traceList.length})
              </span>
              <button
                onClick={() => {}}
                className="text-zinc-600 hover:text-white transition-colors"
                title="Refresh"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : traceList.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-4xl mb-3">🔍</p>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">No traces yet</h3>
                <p className="text-xs text-zinc-500">
                  Agent execution traces will appear here as your agents process requests.
                </p>
              </div>
            ) : (
              traceList.map((trace) => (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace.id)}
                  className={cn(
                    'px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900/30 transition-colors',
                    selectedTrace === trace.id && 'bg-zinc-900/50 border-l-2 border-l-orange-500'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'h-2 w-2 rounded-full',
                        trace.status === 'completed' ? 'bg-emerald-400' : trace.status === 'error' ? 'bg-red-400' : 'bg-amber-400'
                      )} />
                      <span className="text-xs font-bold text-white">{trace.agentName}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {new Date(trace.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className="font-mono">{trace.trigger}</span>
                    {trace.totalDuration != null && (
                      <span>{(trace.totalDuration / 1000).toFixed(1)}s</span>
                    )}
                    <span>{trace.totalTokens.toLocaleString()} tokens</span>
                    <span className="text-emerald-400">${trace.totalCost.toFixed(4)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: trace detail */}
          <div className="w-[450px] bg-[#0a0a0a] border-l border-zinc-800 overflow-y-auto hidden lg:block">
            {activeTrace ? (
              <>
                <div className="px-4 py-3 border-b border-zinc-800">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Trace Detail</div>
                  <div className="text-sm font-bold text-white">{activeTrace.agentName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1">{activeTrace.trigger}</div>
                </div>
                <div className="px-4 py-3 border-b border-zinc-800 grid grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <div className="text-zinc-600 uppercase tracking-widest">Duration</div>
                    <div className="font-mono text-white">
                      {activeTrace.totalDuration != null ? `${(activeTrace.totalDuration / 1000).toFixed(1)}s` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-600 uppercase tracking-widest">Tokens</div>
                    <div className="font-mono text-orange-400">{activeTrace.totalTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-zinc-600 uppercase tracking-widest">Cost</div>
                    <div className="font-mono text-emerald-400">${activeTrace.totalCost.toFixed(4)}</div>
                  </div>
                </div>
                <div>
                  <div className="px-4 py-2 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                    Execution Steps ({activeTrace.steps.length})
                  </div>
                  {activeTrace.steps.map((step) => (
                    <TraceStepRow key={step.id} step={step} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-xs text-zinc-600">Select a trace to inspect</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top errors */}
        {stats?.topErrors && stats.topErrors.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-5 mt-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">Top Errors</h2>
            <div className="space-y-2">
              {stats.topErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-3 border border-zinc-800 bg-black p-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span className="text-xs font-mono text-zinc-400 flex-1 truncate">{err.message}</span>
                  <span className="text-[10px] font-mono text-red-400">{err.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
