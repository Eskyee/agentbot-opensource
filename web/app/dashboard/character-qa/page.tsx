'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Play, AlertCircle, CheckCircle, XCircle, TrendingDown } from 'lucide-react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'

interface EvalDimension {
  name: string
  score: number
  label: string
}

interface EvalResult {
  id: string
  timestamp: string
  probeSet: string
  overallScore: number
  dimensions: EvalDimension[]
  probesRun: number
  driftDetected: boolean
  summary: string
}

interface QAData {
  results?: EvalResult[]
  latest?: EvalResult
  error?: string
  status?: string
}

const DIMENSIONS = ['voice', 'emotion', 'knowledge', 'refusal'] as const

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-bold">{score}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function CharacterQAPage() {
  const [data, setData] = useState<QAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [probeSet, setProbeSet] = useState('default')

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/openclaw/character-qa')
      const d = await res.json()
      setData(d)
    } catch {
      setData({ error: 'Failed to connect to agent', status: 'unreachable' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults() }, [fetchResults])

  const runEval = async () => {
    setRunning(true)
    try {
      await fetch('/api/openclaw/character-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ probeSet, dimensions: [...DIMENSIONS] }),
      })
      setTimeout(fetchResults, 5000)
    } catch { /* silent */ } finally {
      setRunning(false)
    }
  }

  const noAgent = data?.status === 'no_agent'
  const unreachable = data?.status === 'unreachable'
  const results = data?.results || []
  const latest = data?.latest || results[0]

  return (
    <DashboardShell>
      <DashboardHeader title="Character QA" subtitle="OpenClaw 2026.4.9 — Persona Eval & Drift Detection" />
      <DashboardContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : noAgent ? (
          <div className="text-center py-20 text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No agent deployed. Deploy an agent to run character evals.</p>
          </div>
        ) : unreachable ? (
          <div className="text-center py-20 text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Agent is unreachable. It may be starting up.</p>
            <button onClick={fetchResults} className="mt-4 text-xs border border-zinc-700 px-3 py-1 rounded hover:border-zinc-500">Retry</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Score */}
            {latest && (
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Overall Score</div>
                  <div className={`text-3xl font-bold ${latest.overallScore >= 80 ? 'text-green-400' : latest.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {latest.overallScore}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Probes Run</div>
                  <div className="text-2xl font-bold">{latest.probesRun}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Probe Set</div>
                  <div className="text-lg font-bold capitalize">{latest.probeSet}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Drift</div>
                  <div className="flex items-center gap-2 mt-1">
                    {latest.driftDetected ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-bold text-sm">Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-bold text-sm">Stable</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dimension Breakdown */}
            {latest?.dimensions && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-bold text-sm uppercase tracking-tight mb-4">Dimension Scores</h3>
                <div className="space-y-3">
                  {latest.dimensions.map(d => (
                    <ScoreBar key={d.name} score={d.score} label={d.label || d.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 items-center flex-wrap">
              <button onClick={runEval} disabled={running}
                className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50 flex items-center gap-2">
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Eval
              </button>
              <select value={probeSet} onChange={e => setProbeSet(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="default">Default Probes</option>
                <option value="adversarial">Adversarial</option>
                <option value="edge-case">Edge Cases</option>
                <option value="persona-boundary">Persona Boundary</option>
              </select>
              <button onClick={fetchResults}
                className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:border-zinc-600 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Eval History */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold text-sm uppercase tracking-tight mb-4">Eval History</h3>
              {results.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <p>No evaluations run yet. Hit &quot;Run Eval&quot; to test your agent&apos;s persona.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map(r => (
                    <div key={r.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.overallScore >= 80 ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : r.overallScore >= 50 ? (
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold">{r.overallScore}/100</div>
                          <div className="text-xs text-zinc-500 truncate">
                            {new Date(r.timestamp).toLocaleString()} &middot; {r.probeSet} &middot; {r.probesRun} probes
                          </div>
                        </div>
                      </div>
                      {r.driftDetected && (
                        <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-0.5 rounded flex-shrink-0">
                          DRIFT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {latest?.summary && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="font-bold text-sm uppercase tracking-tight mb-2">Summary</h3>
                <p className="text-sm text-zinc-400">{latest.summary}</p>
              </div>
            )}

            <div className="text-xs text-zinc-600 text-center">
              Character QA is part of OpenClaw 2026.4.9. Run <code className="text-zinc-500">openclaw eval --character</code> in CI to gate deployments.
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
