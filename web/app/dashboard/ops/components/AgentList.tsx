'use client'

import { useState, useEffect, useCallback } from 'react'

interface Agent {
  id: string
  name: string
  model: string
  status: string
  createdAt: string
  updatedAt: string
}

interface AgentListProps {
  onSelect?: (agentId: string) => void
  selected?: string | null
}

export function AgentList({ onSelect, selected }: AgentListProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAgents(data.agents || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'running': return 'text-green-500'
      case 'idle': case 'paused': return 'text-yellow-500'
      case 'error': case 'crashed': return 'text-red-500'
      default: return 'text-zinc-500'
    }
  }

  const getDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'running': return 'bg-green-500'
      case 'idle': case 'paused': return 'bg-yellow-500'
      case 'error': case 'crashed': return 'bg-red-500'
      default: return 'bg-zinc-600'
    }
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Agents
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading agents...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && agents.length === 0 && (
        <div className="text-xs text-zinc-600">No agents configured</div>
      )}
      <div className="space-y-1">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect?.(agent.id)}
            className={`w-full text-left px-2 py-1.5 border-l-2 border-l-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-none ${
              selected === agent.id ? 'bg-zinc-800 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(agent.status)}`} />
                <span className="text-xs font-mono text-zinc-300">{agent.name}</span>
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5 ml-3.5">
              {agent.model}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
