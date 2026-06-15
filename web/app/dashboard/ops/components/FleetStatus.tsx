'use client'

import { useState, useEffect, useCallback } from 'react'

interface FleetNode {
  id: string
  did: string
  status: 'running' | 'idle' | 'error' | 'advisory'
  region: string
  task: string
  cpu: number
  mem: number
  p50: number
  model?: string
}

interface FleetStatusProps {
  onSelect?: (agentId: string) => void
  selected?: string | null
}

const STATUS_STYLES: Record<string, { badge: string; dot: string; border: string }> = {
  running: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500', border: 'border-l-green-500' },
  idle: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', border: 'border-l-yellow-500' },
  error: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500', border: 'border-l-red-500' },
  advisory: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-500', border: 'border-l-blue-500' },
}

function getBarColor(pct: number): string {
  if (pct < 60) return 'bg-green-500'
  if (pct <= 85) return 'bg-yellow-500'
  return 'bg-red-500'
}

function truncateDID(did: string): string {
  if (did.length <= 24) return did
  return `${did.slice(0, 12)}…${did.slice(-4)}`
}

function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: FleetNode
  selected: boolean
  onClick: () => void
}) {
  const style = STATUS_STYLES[node.status] || STATUS_STYLES.idle

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-l-2 transition-all ${
        selected
          ? `${style.border} bg-zinc-900 border border-zinc-600`
          : `${style.border} bg-zinc-950 border border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700`
      }`}
    >
      {/* Top row: name + status badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 ${node.status === 'running' ? 'animate-pulse' : ''} ${style.dot}`} />
          <span className="text-xs font-mono font-medium text-zinc-200">{node.id}</span>
        </div>
        <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-mono border ${style.badge}`}>
          {node.status}
        </span>
      </div>

      {/* DID */}
      <div className="text-[10px] font-mono text-zinc-600 mb-2">{truncateDID(node.did)}</div>

      {/* Region + Task */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[10px] font-mono text-zinc-500">
          <span className="text-zinc-600">rgn</span> {node.region}
        </span>
        <span className="text-[10px] font-mono text-zinc-500 truncate">
          <span className="text-zinc-600">task</span> {node.task}
        </span>
      </div>

      {/* CPU + MEM bars side by side */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-600">CPU</span>
            <span className="text-[10px] font-mono text-zinc-400">{node.cpu}%</span>
          </div>
          <div className="h-1 bg-zinc-800 w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(node.cpu)}`}
              style={{ width: `${node.cpu}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-600">MEM</span>
            <span className="text-[10px] font-mono text-zinc-400">{node.mem}%</span>
          </div>
          <div className="h-1 bg-zinc-800 w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(node.mem)}`}
              style={{ width: `${node.mem}%` }}
            />
          </div>
        </div>
      </div>

      {/* p50 + model */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-600">
          p50 <span className="text-zinc-400">{node.p50}ms</span>
        </span>
        {node.model && (
          <span className="text-[10px] font-mono text-zinc-600">{node.model}</span>
        )}
      </div>
    </button>
  )
}

/* Empty state when no agents are deployed */
function EmptyFleet() {
  return (
    <div className="p-6">
      <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
        <div className="text-2xl mb-3">◈</div>
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 mb-2">
          No Fleet Nodes
        </div>
        <div className="text-[11px] text-zinc-500 mb-4 max-w-[32ch] mx-auto leading-relaxed">
          Deploy your first agent to see it here with live CPU, memory, and latency metrics.
        </div>
        <a
          href="/dashboard"
          className="inline-block border border-zinc-600 hover:border-white text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-2 transition-colors"
        >
          Deploy Agent →
        </a>
      </div>

      {/* Preview of what it'll look like */}
      <div className="mt-4 opacity-40 pointer-events-none">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Preview</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'agent-01', status: 'running', region: 'fra-1', task: 'exec:swap', cpu: 42, mem: 61, p50: 87 },
            { id: 'agent-02', status: 'idle', region: 'iad-1', task: 'idle', cpu: 5, mem: 18, p50: 0 },
          ].map((n) => (
            <div key={n.id} className="p-2 border-l-2 border-l-green-500/30 bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1 h-1 bg-zinc-600" />
                <span className="text-[10px] font-mono text-zinc-600">{n.id}</span>
              </div>
              <div className="flex gap-2 text-[9px] font-mono text-zinc-700">
                <span>rgn {n.region}</span>
                <span>cpu {n.cpu}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FleetStatus({ onSelect, selected }: FleetStatusProps) {
  const [nodes, setNodes] = useState<FleetNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/fleet')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setNodes(data.nodes || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFleet()
    const interval = setInterval(fetchFleet, 15000)
    return () => clearInterval(interval)
  }, [fetchFleet])

  const running = nodes.filter(n => n.status === 'running').length
  const errorCount = nodes.filter(n => n.status === 'error').length

  return (
    <div className="bg-zinc-950 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Fleet Nodes · <span className="text-zinc-300">{nodes.length}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {running > 0 && (
            <span className="text-green-400">{running} running</span>
          )}
          {errorCount > 0 && (
            <span className="text-red-400">{errorCount} error</span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <div className="p-4 text-xs text-red-500 font-mono">{error}</div>
      )}
      {!loading && !error && nodes.length === 0 && <EmptyFleet />}
      {!loading && !error && nodes.length > 0 && (
        <div className="p-2 grid grid-cols-2 gap-2">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selected === node.id}
              onClick={() => onSelect?.(node.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
