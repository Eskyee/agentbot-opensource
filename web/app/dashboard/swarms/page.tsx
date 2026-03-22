'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { EmptyState } from '@/app/components/shared/EmptyState'

export default function SwarmsPage() {
  const [swarms, setSwarms] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/swarms')
      .then((r) => r.json())
      .then((d) => setSwarms(d.swarms || []))
  }, [])

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Swarms"
        icon={<Users className="h-5 w-5 text-blue-400" />}
        count={swarms.length}
        action={
          <Button
            className="bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Swarm
          </Button>
        }
      />

      <DashboardContent className="max-w-6xl">
        {swarms.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-zinc-600" />}
            title="No swarms created yet"
            description="Deploy multiple agents that work together"
            action={
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest"
                onClick={() => setShowCreate(true)}
              >
                Create your first swarm →
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {swarms.map((swarm: any) => (
              <AgentCard key={swarm.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{swarm.name}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{swarm.description}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-green-500/30 text-green-400"
                  >
                    {swarm.agents.length} agents
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {swarm.agents.map((agent: any, i: number) => (
                    <div
                      key={i}
                      className="bg-black/30 border border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-medium">{agent.role}</span>
                      </div>
                      <div className="text-xs text-zinc-400">{agent.model}</div>
                      <div className="text-xs text-zinc-500 mt-2 font-mono">
                        {agent.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </AgentCard>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
