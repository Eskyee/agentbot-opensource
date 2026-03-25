'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { EmptyState } from '@/app/components/shared/EmptyState'

interface Agent {
  id: string
  name: string
  status: 'active' | 'stopped' | 'error'
  port: number
  lastHeartbeat: string
  uptime: string
}

const STATUS_CONFIG = {
  active: { label: 'Active', className: 'border-green-500/30 text-green-400' },
  stopped: { label: 'Stopped', className: 'border-yellow-500/30 text-yellow-400' },
  error: { label: 'Error', className: 'border-red-500/30 text-red-400' },
}

export default function HeartbeatPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeartbeat = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/heartbeat')
        if (!response.ok) throw new Error('Failed to fetch heartbeat')
        const data = await response.json()
        setAgents(data.agents || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    fetchHeartbeat()
    const interval = setInterval(fetchHeartbeat, 5000)
    return () => clearInterval(interval)
  }, [])

  const statusCounts = agents.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Heartbeat Monitor"
        icon={<Activity className="h-5 w-5 text-blue-400" />}
        count={agents.length}
      />

      <DashboardContent className="max-w-6xl space-y-6">
        {/* Status summary */}
        {agents.length > 0 && (
          <div className="flex gap-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <Badge
                key={status}
                variant="outline"
                className={config.className}
              >
                {statusCounts[status] || 0} {config.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {/* Loading */}
        {loading && agents.length === 0 && (
          <EmptyState
            icon={<Activity className="h-8 w-8 text-zinc-600 animate-pulse" />}
            title="Loading heartbeat data…"
          />
        )}

        {/* Agent list */}
        {!loading && agents.length === 0 && !error && (
          <EmptyState
            icon={<Wifi className="h-8 w-8 text-zinc-600" />}
            title="No agents running yet"
            description="Deploy an agent to see its heartbeat status"
          />
        )}

        {agents.length > 0 && (
          <div className="space-y-4">
            {agents.map((agent) => {
              const statusConf = STATUS_CONFIG[agent.status]
              return (
                <AgentCard key={agent.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tighter">{agent.name || agent.id}</h3>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {agent.id}</p>
                    </div>
                    <Badge variant="outline" className={statusConf.className}>
                      {statusConf.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Port</div>
                      <div className="font-mono">{agent.port}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Uptime</div>
                      <div className="font-mono">{agent.uptime}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last Pulse
                      </div>
                      <div className="font-mono">{agent.lastHeartbeat}</div>
                    </div>
                  </div>
                </AgentCard>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
