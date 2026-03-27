'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, Wifi } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { EmptyState } from '@/app/components/shared/EmptyState'
import StatusPill from '@/app/components/shared/StatusPill'

interface Agent {
  id: string
  name: string
  status: 'active' | 'stopped' | 'error'
  port: number
  lastHeartbeat: string
  uptime: string
}

export default function HeartbeatPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeartbeat = async () => {
      try {
        setLoading(true)
        const agentsRes = await fetch('/api/agents')
        if (!agentsRes.ok) throw new Error('Failed to fetch agents')
        const agentsData = await agentsRes.json()
        const agentList = agentsData.agents || []

        if (agentList.length === 0) {
          setAgents([])
          setError(null)
          return
        }

        const agentsWithHeartbeat = await Promise.all(
          agentList.map(async (agent: any) => {
            try {
              const hbRes = await fetch(`/api/heartbeat?agentId=${agent.id}`)
              const hbData = hbRes.ok ? await hbRes.json() : null
              const hb = hbData?.heartbeat || {}
              return {
                id: agent.id,
                name: agent.name || agent.id,
                status: (agent.status === 'running' || agent.status === 'active') ? 'active' as const
                  : agent.status === 'stopped' ? 'stopped' as const
                  : 'error' as const,
                port: agent.websocketUrl ? parseInt(new URL(agent.websocketUrl).port) || 443 : 0,
                lastHeartbeat: hb.lastHeartbeat
                  ? new Date(hb.lastHeartbeat).toLocaleString()
                  : 'Never',
                uptime: hb.enabled ? `Every ${hb.frequency}` : 'Disabled',
              }
            } catch {
              return {
                id: agent.id,
                name: agent.name || agent.id,
                status: 'error' as const,
                port: 0,
                lastHeartbeat: 'Error',
                uptime: 'Unknown',
              }
            }
          })
        )

        setAgents(agentsWithHeartbeat)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    fetchHeartbeat()
    const interval = setInterval(fetchHeartbeat, 10000)
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

      <DashboardContent className="space-y-6">
        {/* Status summary */}
        {agents.length > 0 && (
          <div className="flex gap-4">
            <StatusPill status="active" label={`${statusCounts['active'] || 0} Active`} size="sm" />
            <StatusPill status="idle" label={`${statusCounts['stopped'] || 0} Stopped`} size="sm" />
            <StatusPill status="error" label={`${statusCounts['error'] || 0} Error`} size="sm" />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="border border-red-800 bg-zinc-950 p-4 text-red-400 text-xs">
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
          <div className="space-y-px bg-zinc-800">
            {agents.map((agent) => {
              const statusMap = { active: 'active' as const, stopped: 'idle' as const, error: 'error' as const }
              return (
                <div key={agent.id} className="bg-zinc-950 border border-zinc-800 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-tight">{agent.name || agent.id}</h3>
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {agent.id}</p>
                    </div>
                    <StatusPill status={statusMap[agent.status]} size="sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Port</div>
                      <div className="text-xs text-zinc-300 font-mono">{agent.port}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Uptime</div>
                      <div className="text-xs text-zinc-300 font-mono">{agent.uptime}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last Pulse
                      </div>
                      <div className="text-xs text-zinc-300 font-mono">{agent.lastHeartbeat}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
