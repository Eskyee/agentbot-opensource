'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import {
  FlaskConical,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart2,
  Target,
  Zap,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Trash2,
  Plus,
  Settings,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalSuite {
  id: string
  name: string
  description: string
  type: 'capability' | 'regression' | 'custom'
  domain: string
  taskCount: number
  lastRun: string | null
  lastResult: {
    passRate: number
    passAt1: number
    passAt3: number
    trials: number
  } | null
}

interface EvalRun {
  id: string
  suiteId: string
  suiteName: string
  status: 'running' | 'passed' | 'failed' | 'error'
  startedAt: string
  completedAt: string | null
  passRate: number
  trials: number
  passAt1: number
  passAt3: number
  model: string
  agentId: string | null
}

interface AgentBenchmark {
  agentId: string
  agentName: string
  model: string
  elo: number
  passAt1: number
  problemsAttempted: number
  lastBenchmark: string
  capabilityProfile: {
    overall: number
    strongest: string
    weakest: string
    capabilities: Array<{
      name: string
      score: number
      attempts: number
    }>
  } | null
}

interface Diagnostics {
  overview: {
    total_outcomes: number
    completed: number
    failed: number
    success_rate: string
  }
  error_distribution: Array<{ category: string; count: number }>
  stagnation: {
    cycles_since_commit: number
    risk_level: string
    cycles_until_reset: number
  }
  capability_bottleneck: {
    capability: string
    success_rate: string
    attempts: number
  } | null
  recommendations: string[]
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'flat'
  icon?: React.ReactNode
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
          {trend === 'flat' && <Minus className="h-3 w-3 text-zinc-500" />}
          <span className="text-xs text-zinc-500">{sub}</span>
        </div>
      )}
    </div>
  )
}

function PassRateBar({ rate, size = 'sm' }: { rate: number; size?: 'sm' | 'lg' }) {
  const pct = Math.round(rate * 100)
  const color =
    pct >= 95 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'bg-zinc-800 overflow-hidden',
          size === 'lg' ? 'w-32 h-2' : 'w-20 h-1.5',
        )}
      >
        <div className={cn('h-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={cn(
          'font-mono',
          size === 'lg' ? 'text-sm' : 'text-xs',
          pct >= 95 ? 'text-emerald-400' : pct >= 80 ? 'text-amber-400' : 'text-red-400',
        )}
      >
        {pct}%
      </span>
    </div>
  )
}

function SuiteCard({
  suite,
  onRun,
  running,
}: {
  suite: EvalSuite
  onRun: (id: string) => void
  running: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const lastResult = suite.lastResult

  return (
    <div className="border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white truncate">
                {suite.name}
              </h3>
              <span
                className={cn(
                  'text-[9px] uppercase tracking-widest px-1.5 py-0.5 border',
                  suite.type === 'regression'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-orange-500/30 text-orange-400',
                )}
              >
                {suite.type}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 px-1.5 py-0.5">
                {suite.domain}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-2">{suite.description}</p>
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
              <span>{suite.taskCount} tasks</span>
              {suite.lastRun && (
                <span>Last run {new Date(suite.lastRun).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRun(suite.id)}
              disabled={running}
              className="flex items-center gap-1.5 border border-white bg-white text-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {running ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {running ? 'Running' : 'Run'}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="border border-zinc-800 text-zinc-500 p-1.5 hover:text-white hover:border-zinc-600 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {lastResult && (
          <div className="mt-3 pt-3 border-t border-zinc-900 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Pass Rate</div>
              <PassRateBar rate={lastResult.passRate} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">pass@1</div>
              <PassRateBar rate={lastResult.passAt1} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">pass@3</div>
              <PassRateBar rate={lastResult.passAt3} />
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-zinc-900 p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
            Suite Details
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-zinc-800 bg-black p-2">
              <span className="text-zinc-500">Domain:</span>{' '}
              <span className="text-zinc-300">{suite.domain}</span>
            </div>
            <div className="border border-zinc-800 bg-black p-2">
              <span className="text-zinc-500">Type:</span>{' '}
              <span className="text-zinc-300">{suite.type}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BenchmarkCard({ benchmark }: { benchmark: AgentBenchmark }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-zinc-800 bg-zinc-950/40">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {benchmark.agentName}
            </h3>
            <span className="text-[10px] text-zinc-500">{benchmark.model}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">{benchmark.elo}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">ELO</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">pass@1</div>
            <div className="text-sm font-mono text-white">{benchmark.passAt1.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Problems</div>
            <div className="text-sm font-mono text-white">{benchmark.problemsAttempted}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Overall</div>
            <div className="text-sm font-mono text-white">
              {benchmark.capabilityProfile?.overall.toFixed(1) ?? '—'}%
            </div>
          </div>
        </div>

        {benchmark.capabilityProfile && (
          <div className="space-y-1.5">
            {benchmark.capabilityProfile.capabilities.map((cap) => (
              <div key={cap.name} className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 w-24 truncate">
                  {cap.name}
                </span>
                <div className="flex-1 h-1.5 bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full',
                      cap.score >= 90
                        ? 'bg-emerald-500'
                        : cap.score >= 75
                          ? 'bg-amber-500'
                          : 'bg-red-500',
                    )}
                    style={{ width: `${cap.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">{cap.score}%</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-900 p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Capabilities</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-zinc-800 bg-black p-2">
              <span className="text-zinc-500">Strongest:</span>{' '}
              <span className="text-emerald-400">{benchmark.capabilityProfile?.strongest}</span>
            </div>
            <div className="border border-zinc-800 bg-black p-2">
              <span className="text-zinc-500">Weakest:</span>{' '}
              <span className="text-red-400">{benchmark.capabilityProfile?.weakest}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvalsPage() {
  const [suites, setSuites] = useState<EvalSuite[]>([])
  const [benchmark, setBenchmark] = useState<AgentBenchmark | null>(null)
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [agentsListed, setAgentsListed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [runningSuite, setRunningSuite] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'capability' | 'regression'>('all')
  const [tab, setTab] = useState<'suites' | 'benchmarks' | 'runs'>('suites')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/evals/status')
      if (!res.ok) throw new Error('Failed to load eval status')
      const data = await res.json()
      setSuites(data.suites || [])
      setBenchmark(data.benchmark || null)
      setDiagnostics(data.diagnostics || null)
      setAgentsListed(data.agentsListed || 0)
    } catch (err: any) {
      console.error('Failed to fetch eval status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredSuites = useMemo(() => {
    if (filter === 'all') return suites
    return suites.filter((s) => s.type === filter)
  }, [suites, filter])

  const overallStats = useMemo(() => {
    const regressionSuites = suites.filter((s) => s.type === 'regression')
    const capabilitySuites = suites.filter((s) => s.type === 'capability')
    const avgRegression =
      regressionSuites.reduce((acc, s) => acc + (s.lastResult?.passRate ?? 0), 0) /
      (regressionSuites.length || 1)
    const avgCapability =
      capabilitySuites.reduce((acc, s) => acc + (s.lastResult?.passRate ?? 0), 0) /
      (capabilitySuites.length || 1)
    return {
      totalSuites: suites.length,
      totalTasks: suites.reduce((acc, s) => acc + s.taskCount, 0),
      avgRegression: Math.round(avgRegression * 100),
      avgCapability: Math.round(avgCapability * 100),
      elo: benchmark?.elo ?? '—',
      passAt1: benchmark?.passAt1.toFixed(1) ?? '—',
    }
  }, [suites, benchmark])

  const handleRun = useCallback(async (suiteId: string) => {
    setRunningSuite(suiteId)
    try {
      const res = await fetch('/api/evals/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suiteId }),
      })
      if (!res.ok) throw new Error('Failed to start eval')
      const data = await res.json()
      toast.success(`Benchmark triggered · ELO ${data.current_elo ?? '?'}`)
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to start eval')
    } finally {
      setRunningSuite(null)
    }
  }, [fetchData])

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader
          title="Evals & Benchmarks"
          subtitle="Agent quality evaluation, regression testing, and performance benchmarking."
          icon={<FlaskConical className="h-5 w-5 text-orange-500" />}
        />
        <DashboardContent className="max-w-7xl space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-zinc-800 bg-zinc-950/40 p-4 h-24 animate-pulse" />
            ))}
          </div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Evals & Benchmarks"
        subtitle="Agent quality evaluation, regression testing, and performance benchmarking."
        icon={<FlaskConical className="h-5 w-5 text-orange-500" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-1.5 border border-zinc-700 text-zinc-400 px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            <button
              onClick={() => handleRun('benchmark')}
              disabled={runningSuite === 'benchmark'}
              className="flex items-center gap-1.5 border border-white bg-white text-black px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              {runningSuite === 'benchmark' ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Run Benchmark
            </button>
          </div>
        }
      />

      <DashboardContent className="max-w-7xl space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Suites"
            value={overallStats.totalSuites}
            icon={<FlaskConical className="h-3 w-3" />}
          />
          <StatCard
            label="Total Tasks"
            value={overallStats.totalTasks}
            icon={<Target className="h-3 w-3" />}
          />
          <StatCard
            label="Regression"
            value={`${overallStats.avgRegression}%`}
            sub="avg pass rate"
            trend={overallStats.avgRegression >= 95 ? 'up' : 'down'}
            icon={<Shield className="h-3 w-3" />}
          />
          <StatCard
            label="Capability"
            value={`${overallStats.avgCapability}%`}
            sub="avg pass rate"
            trend={overallStats.avgCapability >= 80 ? 'up' : 'down'}
            icon={<Zap className="h-3 w-3" />}
          />
          <StatCard
            label="ELO"
            value={overallStats.elo}
            sub="benchmark rating"
            icon={<BarChart2 className="h-3 w-3" />}
          />
          <StatCard
            label="pass@1"
            value={`${overallStats.passAt1}%`}
            sub="success rate"
            icon={<CheckCircle2 className="h-3 w-3" />}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border border-zinc-800 w-fit">
          {(['suites', 'benchmarks', 'diagnostics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                tab === t
                  ? 'bg-zinc-900 text-orange-500'
                  : 'text-zinc-500 hover:text-white',
              )}
            >
              {t === 'suites' ? 'Eval Suites' : t === 'benchmarks' ? 'Benchmarks' : 'Diagnostics'}
            </button>
          ))}
        </div>

        {/* Eval Suites Tab */}
        {tab === 'suites' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-zinc-500" />
              {(['all', 'capability', 'regression'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-colors',
                    filter === f
                      ? 'border-orange-500/50 text-orange-500'
                      : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {filteredSuites.length === 0 ? (
              <div className="border border-zinc-800 p-12 text-center">
                <FlaskConical className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No eval suites found</p>
                <p className="text-zinc-500 text-xs mt-1">Run a benchmark to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSuites.map((suite) => (
                  <SuiteCard
                    key={suite.id}
                    suite={suite}
                    onRun={handleRun}
                    running={runningSuite === suite.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Benchmarks Tab */}
        {tab === 'benchmarks' && (
          <div className="space-y-4">
            {benchmark ? (
              <BenchmarkCard benchmark={benchmark} />
            ) : (
              <div className="border border-zinc-800 p-12 text-center">
                <BarChart2 className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No benchmark data</p>
                <p className="text-zinc-500 text-xs mt-1">Run a benchmark to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Diagnostics Tab */}
        {tab === 'diagnostics' && (
          <div className="space-y-4">
            {diagnostics ? (
              <>
                {/* Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Total Outcomes"
                    value={diagnostics.overview.total_outcomes}
                  />
                  <StatCard
                    label="Completed"
                    value={diagnostics.overview.completed}
                    sub={`${diagnostics.overview.success_rate} success`}
                    trend={parseFloat(diagnostics.overview.success_rate) >= 0.8 ? 'up' : 'down'}
                  />
                  <StatCard
                    label="Failed"
                    value={diagnostics.overview.failed}
                  />
                  <StatCard
                    label="Cycles Since Commit"
                    value={diagnostics.stagnation.cycles_since_commit}
                    sub={`Risk: ${diagnostics.stagnation.risk_level}`}
                    trend={diagnostics.stagnation.risk_level === 'low' ? 'up' : 'down'}
                  />
                </div>

                {/* Error Distribution */}
                {diagnostics.error_distribution.length > 0 && (
                  <div className="border border-zinc-800 bg-zinc-950/40 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
                      Error Distribution
                    </div>
                    <div className="space-y-2">
                      {diagnostics.error_distribution.map((err) => (
                        <div key={err.category} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 w-32 truncate">{err.category}</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-red-500"
                              style={{
                                width: `${(err.count / diagnostics.overview.total_outcomes) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
                            {err.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capability Bottleneck */}
                {diagnostics.capability_bottleneck && (
                  <div className="border border-zinc-800 bg-zinc-950/40 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                      Capability Bottleneck
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Capability</div>
                        <div className="text-sm text-white mt-1">
                          {diagnostics.capability_bottleneck.capability}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Success Rate</div>
                        <div className="text-sm text-amber-400 mt-1">
                          {diagnostics.capability_bottleneck.success_rate}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Attempts</div>
                        <div className="text-sm text-white mt-1">
                          {diagnostics.capability_bottleneck.attempts}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {diagnostics.recommendations.length > 0 && (
                  <div className="border border-zinc-800 bg-zinc-950/40 p-5">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                      Recommendations
                    </div>
                    <div className="space-y-2">
                      {diagnostics.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="border border-zinc-800 bg-black p-3 text-xs text-zinc-400"
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-zinc-800 p-12 text-center">
                <AlertTriangle className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No diagnostics data</p>
                <p className="text-zinc-500 text-xs mt-1">Agent may not be connected</p>
              </div>
            )}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
