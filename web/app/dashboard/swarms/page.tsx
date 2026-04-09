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
import { EmptyState } from '@/app/components/shared/EmptyState'
import StatusPill from '@/app/components/shared/StatusPill'

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
            className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Swarm
          </Button>
        }
      />

      <DashboardContent>
        {swarms.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-zinc-600" />}
            title="No swarms created yet"
            description="Deploy multiple agents that work together"
            action={
              <Button
                variant="outline"
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4"
                onClick={() => setShowCreate(true)}
              >
                Create your first swarm →
              </Button>
            }
          />
        ) : (
          <div className="space-y-px bg-zinc-800">
            {swarms.map((swarm: any) => (
              <div key={swarm.id} className="bg-zinc-950 border border-zinc-800 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">{swarm.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{swarm.description}</p>
                  </div>
                  <StatusPill status="active" label={`${swarm.agents.length} agents`} size="sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
                  {swarm.agents.map((agent: any, i: number) => (
                    <div
                      key={i}
                      className="bg-zinc-950 border border-zinc-800 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-zinc-600" />
                        <span className="text-xs font-bold uppercase tracking-tight">{agent.role}</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{agent.model}</div>
                      <div className="text-xs text-zinc-500 mt-2 font-mono">
                        {agent.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
