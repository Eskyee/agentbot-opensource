'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

interface AgentStatus {
  name: string
  role: string
  status: 'running' | 'stopped' | 'provisioning' | 'failed'
  url?: string
  uptime?: string
  lastActivity?: string
}

function TeamDetailContent() {
  const params = useParams()
  const teamId = params?.teamId as string
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'agents' | 'activity' | 'config'>('agents')

  useEffect(() => {
    // Fetch team status — placeholder for now
    setLoading(false)
    setAgents([])
  }, [teamId])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Breadcrumbs />
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Team</span>
            <h1 className="text-3xl font-bold tracking-tighter uppercase mt-1 font-mono">{teamId}</h1>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-xs uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              Restart All
            </button>
            <button className="px-4 py-2 text-xs uppercase tracking-widest border border-red-900 text-red-400 hover:text-red-300 hover:border-red-700 transition-colors">
              Destroy Team
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-3">
          {['agents', 'activity', 'config'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Agents tab */}
        {activeTab === 'agents' && (
          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <div className="text-4xl mb-4">⬢</div>
                <p>No agents provisioned yet.</p>
                <a href="/dashboard/team" className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white mt-4 inline-block">
                  Deploy a team →
                </a>
              </div>
            ) : (
              agents.map(agent => (
                <div key={agent.name} className="border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'running' ? 'bg-emerald-500' :
                      agent.status === 'provisioning' ? 'bg-yellow-500 animate-pulse' :
                      agent.status === 'failed' ? 'bg-red-500' : 'bg-zinc-600'
                    }`} />
                    <div>
                      <div className="text-sm font-bold uppercase tracking-wider">{agent.role}</div>
                      <div className="text-xs text-zinc-500 font-mono">{agent.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 border ${
                      agent.status === 'running' ? 'border-emerald-900 text-emerald-400' :
                      agent.status === 'provisioning' ? 'border-yellow-900 text-yellow-400' :
                      agent.status === 'failed' ? 'border-red-900 text-red-400' : 'border-zinc-800 text-zinc-500'
                    }`}>
                      {agent.status}
                    </span>
                    {agent.url && (
                      <a href={agent.url} target="_blank" rel="noopener" className="text-xs text-zinc-500 hover:text-white">
                        Open →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="space-y-2">
            <div className="text-center py-16 text-zinc-500">
              <div className="text-4xl mb-4">◈</div>
              <p>Activity feed will appear here once agents are running.</p>
              <p className="text-xs text-zinc-600 mt-2">Real-time agent actions, task delegation, and coordination logs.</p>
            </div>
          </div>
        )}

        {/* Config tab */}
        {activeTab === 'config' && (
          <div className="border border-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Team Configuration</h3>
            <p className="text-xs text-zinc-500 mb-4">
              View and edit your team&apos;s YAML configuration. Changes apply on next restart.
            </p>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs font-mono text-zinc-400 overflow-x-auto">
{`# Team configuration will appear here
# once the team is provisioned.
#
# Edit YAML to customize:
# - Agent models
# - Tools and permissions
# - Shared memory settings
# - Task delegation rules`}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeamDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <TeamDetailContent />
    </Suspense>
  )
}
