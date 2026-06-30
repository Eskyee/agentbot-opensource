'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface AgentNode {
  id: string
  did: string
  status: string
  region: string
  task: string
  cpu: number
  mem: number
  p50: number
  model?: string
  calls24h?: number
  spend24h?: number
}

interface RunTrace {
  id: string
  workflow: string
  startedAt: string
  durationMs: number
  status: string
  steps: { ts: string; name: string; detail: string; durationMs: number }[]
}

interface AgentIdentity {
  did: string
  algo: string
  issued: string
  lastSig: string
  guard: string
  rotation: { inDays: number; auto: boolean }
  facts: { count: number; leaf: string; lag: number; lastCommit: string }
}

interface AgentDetailData {
  node?: AgentNode
  identity?: AgentIdentity
  recentRuns?: RunTrace[]
  skills?: { name: string; version: string; type: string; calls24h: number }[]
}

interface AgentDrawerProps {
  agentId: string
  onClose: () => void
}

export function AgentDrawer({ agentId, onClose }: AgentDrawerProps) {
  const [data, setData] = useState<AgentDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops/fleet/${agentId}`)
      if (!res.ok) return
      const json = await res.json()
      setData(json)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const node = data?.node
  const identity = data?.identity
  const runs = data?.recentRuns ?? []

  const statusColor = (s: string) => {
    switch (s) {
      case 'running': return 'text-green-400'
      case 'idle': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      case 'advisory': return 'text-blue-400'
      default: return 'text-zinc-400'
    }
  }

  const runStatusColor = (s: string) => {
    if (s === 'ok' || s === 'completed') return 'text-green-400'
    if (s === 'running') return 'text-blue-400'
    if (s === 'warn') return 'text-yellow-400'
    return 'text-red-400'
  }

  const fmt = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 w-[520px] max-w-full bg-[#0a0a0a] border-l border-zinc-800 flex flex-col overflow-y-auto"
        style={{ animation: 'drawerSlide 0.18s ease-out' }}
        role="dialog"
        aria-label={`Agent details: ${agentId}`}
      >
        {/* Head */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-[#0a0a0a] z-10">
          <div className="min-w-0">
            <div className="text-[9.5px] tracking-[0.22em] uppercase text-zinc-500">
              AGENT · {agentId}
            </div>
            <div className="text-[15px] font-mono font-semibold text-zinc-100 mt-0.5">
              {node?.id ?? agentId}
            </div>
            {node?.did && (
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                {node.did}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-4 shrink-0">
            <button className="px-2 py-1 border border-zinc-700 text-[9.5px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              PAUSE
            </button>
            <button className="px-2 py-1 border border-zinc-700 text-[9.5px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              SNAPSHOT
            </button>
            <button className="px-2 py-1 border border-zinc-700 bg-zinc-800 text-[9.5px] uppercase tracking-widest text-zinc-200 hover:bg-zinc-700 transition-colors">
              FOCUS
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 animate-pulse">
              Loading agent data…
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-4 border-b border-zinc-800 text-[11px] font-mono">
              {[
                {
                  k: 'STATUS',
                  v: node?.status?.toUpperCase() ?? '—',
                  cls: statusColor(node?.status ?? ''),
                  sub: 'since 14:08z',
                },
                {
                  k: 'CALLS · 24H',
                  v: node?.calls24h != null ? node.calls24h.toLocaleString() : '—',
                  cls: 'text-zinc-100',
                  sub: `p50 ${node?.p50 ?? 0}ms`,
                },
                {
                  k: 'REGION',
                  v: node?.region ?? '—',
                  cls: 'text-zinc-100',
                  sub: 'edge · railway',
                },
                {
                  k: 'SPEND · 24H',
                  v: node?.spend24h != null ? `$${node.spend24h.toFixed(2)}` : '—',
                  cls: 'text-zinc-100',
                  sub: 'budget 11%',
                },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className={`p-4 ${i < 3 ? 'border-r border-zinc-800' : ''}`}
                >
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1.5">
                    {s.k}
                  </div>
                  <div className={`text-[15px] font-semibold ${s.cls}`}>{s.v}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent Workflows */}
            <div className="border-b border-zinc-800">
              <div className="px-5 py-2.5 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-b border-zinc-800">
                RECENT WORKFLOWS
              </div>
              {runs.length === 0 ? (
                <div className="px-5 py-5 text-[11px] text-zinc-500">No runs yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr>
                        {['id', 'workflow', 'steps', 'state', 'dur', 'at'].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-2 text-left text-[9px] tracking-[0.18em] uppercase text-zinc-500 font-normal border-b border-zinc-900"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {runs.slice(0, 6).map((r, i) => (
                        <tr
                          key={r.id}
                          className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="px-5 py-2 text-zinc-500 truncate max-w-[80px]">
                            {r.id}
                          </td>
                          <td className="px-5 py-2 text-zinc-300">{r.workflow}</td>
                          <td className="px-5 py-2 text-zinc-500 tabular-nums">
                            {r.steps?.length ?? 0}
                          </td>
                          <td className={`px-5 py-2 uppercase text-[9.5px] tracking-widest ${runStatusColor(r.status)}`}>
                            {r.status}
                          </td>
                          <td className="px-5 py-2 text-zinc-500 tabular-nums">
                            {fmt(r.durationMs)}
                          </td>
                          <td className="px-5 py-2 text-zinc-500">
                            {(() => {
                              try {
                                return new Date(r.startedAt).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              } catch {
                                return '—'
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fact Tree */}
            <div className="border-b border-zinc-800">
              <div className="px-5 py-2.5 text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 border-b border-zinc-800">
                FACT TREE
              </div>
              <pre className="px-5 py-4 text-[11px] font-mono text-zinc-400 leading-[1.8] overflow-x-auto bg-zinc-950/60 whitespace-pre">
{`└ ${agentId}
  ├ identity
  │  ├ did     ${identity?.did ?? '—'}
  │  ├ algo    ${identity?.algo ?? 'ed25519'}
  │  └ leaf    ${identity?.facts?.leaf ?? '0x9c1f…ae72'}
  ├ state
  │  ├ facts   ${identity?.facts?.count?.toLocaleString() ?? '—'}
  │  ├ lag     ${identity?.facts?.lag != null ? `${identity.facts.lag}ms` : '—'}
  │  └ commit  ${identity?.facts?.lastCommit ?? '—'}
  └ policy
     └ guard   ${identity?.guard ?? 'SignatureGuard ✓'}`}
              </pre>
            </div>

            {/* Danger */}
            <div className="px-5 py-5">
              <div className="text-[9.5px] tracking-[0.18em] uppercase text-zinc-500 mb-3">
                DANGER
              </div>
              <div className="flex items-center justify-between border border-red-900/40 bg-red-950/10 px-4 py-3">
                <span className="text-[11px] text-zinc-500">
                  Decommission node — irreversible. Facts archived.
                </span>
                <button className="px-3 py-1 border border-red-800 text-[9.5px] uppercase tracking-widest text-red-500 hover:bg-red-900/30 transition-colors">
                  DECOMMISSION
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      <style>{`
        @keyframes drawerSlide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
