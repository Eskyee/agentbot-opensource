'use client'

import { useState, useEffect, useCallback } from 'react'
import { Moon, RefreshCw, Play, Settings, Clock, Brain, Sparkles, AlertCircle } from 'lucide-react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'

interface DreamEntry {
  id: string
  timestamp: string
  memoriesProcessed: number
  memoriesPromoted: number
  conceptualTags: string[]
  sourceConversations: number
  durationMs: number
}

interface DreamConfig {
  enabled: boolean
  depthHours: number
  aggressiveness: 'low' | 'medium' | 'high'
}

interface DreamData {
  entries?: DreamEntry[]
  config?: DreamConfig
  stats?: { totalDreams: number; totalPromoted: number; avgDuration: number }
  error?: string
  status?: string
}

export default function DreamsPage() {
  const [data, setData] = useState<DreamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [depthHours, setDepthHours] = useState(48)
  const [aggressiveness, setAggressiveness] = useState<'low' | 'medium' | 'high'>('medium')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchDreams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/openclaw/dreams')
      const d = await res.json()
      setData(d)
      if (d.config) {
        setDepthHours(d.config.depthHours ?? 48)
        setAggressiveness(d.config.aggressiveness ?? 'medium')
        setEnabled(d.config.enabled ?? true)
      }
    } catch {
      setData({ error: 'Failed to connect to agent', status: 'unreachable' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDreams() }, [fetchDreams])

  const triggerDream = async () => {
    setTriggering(true)
    try {
      await fetch('/api/openclaw/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', depth: depthHours }),
      })
      setTimeout(fetchDreams, 3000)
    } catch { /* silent */ } finally {
      setTriggering(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      await fetch('/api/openclaw/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', enabled, depthHours, aggressiveness }),
      })
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const noAgent = data?.status === 'no_agent'
  const unreachable = data?.status === 'unreachable'
  const entries = data?.entries || []
  const stats = data?.stats

  return (
    <DashboardShell>
      <DashboardHeader title="Dream Diary" subtitle="OpenClaw 2026.4.9 — REM Backfill & Memory Consolidation" />
      <DashboardContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : noAgent ? (
          <div className="text-center py-20 text-zinc-500">
            <Moon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No agent deployed. Deploy an agent to use dreaming.</p>
          </div>
        ) : unreachable ? (
          <div className="text-center py-20 text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Agent is unreachable. It may be starting up.</p>
            <button onClick={fetchDreams} className="mt-4 text-xs border border-zinc-700 px-3 py-1 rounded hover:border-zinc-500">Retry</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Total Dream Cycles</div>
                  <div className="text-2xl font-bold">{stats.totalDreams}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Memories Promoted</div>
                  <div className="text-2xl font-bold">{stats.totalPromoted}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase mb-1">Avg Dream Duration</div>
                  <div className="text-2xl font-bold">{stats.avgDuration ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '--'}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={triggerDream} disabled={triggering}
                className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-500/20 transition-colors disabled:opacity-50 flex items-center gap-2">
                {triggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Trigger Dream Cycle
              </button>
              <button onClick={() => setConfigOpen(!configOpen)}
                className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:border-zinc-600 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" /> Config
              </button>
              <button onClick={fetchDreams}
                className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:border-zinc-600 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Config Panel */}
            {configOpen && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-tight">Dream Configuration</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Dreaming Enabled</span>
                  <button onClick={() => setEnabled(!enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Backfill Depth (hours)</label>
                  <input type="number" value={depthHours} onChange={e => setDepthHours(Number(e.target.value))} min={1} max={168}
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm w-24 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">Aggressiveness</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <button key={level} onClick={() => setAggressiveness(level)}
                        className={`px-3 py-1 rounded text-xs font-bold ${aggressiveness === level ? 'bg-purple-500 text-white' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveConfig} disabled={saving}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            )}

            {/* Dream Timeline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" /> Dream Timeline
              </h3>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No dream cycles recorded yet. Trigger a dream cycle or wait for the next scheduled one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-purple-500/30 pl-4 pb-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Clock className="w-3 h-3" />
                        <time>{new Date(entry.timestamp).toLocaleString()}</time>
                        <span className="text-zinc-700">|</span>
                        <span>{(entry.durationMs / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="text-sm mb-2">
                        Processed <span className="text-white font-bold">{entry.memoriesProcessed}</span> memories,
                        promoted <span className="text-purple-400 font-bold">{entry.memoriesPromoted}</span> to long-term
                        from <span className="text-zinc-300">{entry.sourceConversations}</span> conversations
                      </div>
                      {entry.conceptualTags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {entry.conceptualTags.map(tag => (
                            <span key={tag} className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-zinc-600 text-center">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Dreaming is an experimental feature from OpenClaw 2026.4.9. Memory consolidation happens during idle periods.
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
