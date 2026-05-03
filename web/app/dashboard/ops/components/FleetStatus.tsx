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

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  running: { badge: 'bg-green-500/20 text-green-400', dot: 'bg-green-500' },
  idle: { badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' },
  error: { badge: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' },
  advisory: { badge: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' },
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
      className={`w-full text-left p-3 bg-zinc-950 border transition-colors ${
        selected ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top row: name + status badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className="text-xs font-mono text-zinc-200">{node.id}</span>
        </div>
        <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-mono ${style.badge}`}>
          {node.status}
        </span>
      </div>

      {/* DID */}
      <div className="text-[10px] font-mono text-zinc-600 mb-2 truncate">{truncateDID(node.did)}</div>

      {/* Region + Task */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-mono text-zinc-500">
          <span className="text-zinc-600">rgn</span> {node.region}
        </span>
        <span className="text-[10px] font-mono text-zinc-500 truncate">
          <span className="text-zinc-600">task</span> {node.task}
        </span>
      </div>

      {/* CPU bar */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-zinc-600">CPU</span>
          <span className="text-[10px] font-mono text-zinc-500">{node.cpu}%</span>
        </div>
        <div className="h-1 bg-zinc-800 w-full">
          <div className={`h-full ${getBarColor(node.cpu)}`} style={{ width: `${node.cpu}%` }} />
        </div>
      </div>

      {/* Mem bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-zinc-600">MEM</span>
          <span className="text-[10px] font-mono text-zinc-500">{node.mem}%</span>
        </div>
        <div className="h-1 bg-zinc-800 w-full">
          <div className={`h-full ${getBarColor(node.mem)}`} style={{ width: `${node.mem}%` }} />
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

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
        Fleet Nodes · {nodes.length}
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading fleet...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && nodes.length === 0 && (
        <div className="text-xs text-zinc-600">No fleet nodes detected</div>
      )}
      <div className="space-y-2">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            selected={selected === node.id}
            onClick={() => onSelect?.(node.id)}
          />
        ))}
      </div>
    </div>
  )
}
