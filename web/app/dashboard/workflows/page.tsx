'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

interface WorkflowNode {
  id: string
  type: string
  config: string
  position: string
}

interface Workflow {
  id: string
  name: string
  description: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
}

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', color: 'text-blue-400' },
  { type: 'action', label: 'Action', color: 'text-green-400' },
  { type: 'condition', label: 'Condition', color: 'text-yellow-400' },
  { type: 'output', label: 'Output', color: 'text-purple-400' },
]

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      const data = await res.json()
      if (res.ok) {
        setWorkflows(data.workflows)
      } else {
        setError(data.error || 'Failed to load workflows')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  const createWorkflow = async (nameOverride?: string) => {
    const workflowName = (nameOverride ?? newName).trim()
    if (!workflowName) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workflowName }),
      })
      const data = await res.json()
      if (res.ok) {
        setWorkflows(prev => [data.workflow, ...prev])
        setNewName('')
        setSelectedWorkflow(data.workflow)
      } else {
        setError(data.error || 'Failed to create workflow')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleWorkflow = async (workflow: Workflow) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      })
      if (res.ok) {
        setWorkflows(prev =>
          prev.map(w => (w.id === workflow.id ? { ...w, enabled: !w.enabled } : w))
        )
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const deleteWorkflow = async (workflow: Workflow) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, { method: 'DELETE' })
      if (res.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== workflow.id))
        if (selectedWorkflow?.id === workflow.id) setSelectedWorkflow(null)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const addNode = async (type: string) => {
    if (!selectedWorkflow) return
    const existingNodes = selectedWorkflow.nodes || []
    const yPos = existingNodes.length * 80 + 40
    const xPos = existingNodes.length * 200 + 40

    const newNodes = [
      ...existingNodes.map(n => {
        const pos = JSON.parse(n.position || '{"x":0,"y":0}')
        const cfg = JSON.parse(n.config || '{}')
        return { type: n.type, position: pos, config: cfg }
      }),
      {
        type,
        position: { x: xPos, y: yPos },
        config: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingNodes.length + 1}` },
      },
    ]

    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: newNodes }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedWorkflow(data.workflow)
        setWorkflows(prev =>
          prev.map(w => (w.id === data.workflow.id ? data.workflow : w))
        )
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Workflows"
        icon={
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        }
        count={workflows.length}
        action={
          <button
            onClick={() => setNewName('')}
            className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 transition-colors"
            id="new-workflow-btn"
          >
            + New
          </button>
        }
      />

      <DashboardContent>
        {error && (
          <div className="mb-6 border border-red-500/30 p-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800">
          {/* Workflow List */}
          <div className="bg-black lg:col-span-1">
            <div className="border-b border-zinc-800 p-4">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Your Workflows</span>
            </div>

            {/* Create new */}
            <div className="border-b border-zinc-800 p-4">
              <div className="flex gap-px">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Workflow name"
                  className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono"
                  onKeyDown={e => e.key === 'Enter' && createWorkflow()}
                />
                <button
                  onClick={() => createWorkflow()}
                  disabled={creating || !newName.trim()}
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  {creating ? '...' : 'Create'}
                </button>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="p-6 text-center text-zinc-600 text-xs">Loading...</div>
            ) : workflows.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 text-xs">
                No workflows yet. Create one above.
              </div>
            ) : (
              workflows.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorkflow(w)}
                  className={`w-full text-left p-4 border-b border-zinc-800 hover:bg-zinc-950 transition-colors ${
                    selectedWorkflow?.id === w.id ? 'bg-zinc-950' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold tracking-tight truncate">{w.name}</span>
                    <StatusPill status={w.enabled ? 'active' : 'offline'} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-600">
                    <span>{w.nodes.length} nodes</span>
                    <span>{formatDate(w.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Editor / Detail */}
          <div className="bg-black lg:col-span-2 min-h-[400px]">
            {selectedWorkflow ? (
              <div className="h-full flex flex-col">
                {/* Editor header */}
                <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold tracking-tight uppercase">{selectedWorkflow.name}</span>
                    {selectedWorkflow.description && (
                      <span className="ml-3 text-xs text-zinc-500">{selectedWorkflow.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleWorkflow(selectedWorkflow)}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-colors ${
                        selectedWorkflow.enabled
                          ? 'border-green-500/30 text-green-400 hover:border-green-500'
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                      }`}
                    >
                      {selectedWorkflow.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => deleteWorkflow(selectedWorkflow)}
                      className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Node toolbar */}
                <div className="border-b border-zinc-800 p-3 flex gap-px">
                  {NODE_TYPES.map(nt => (
                    <button
                      key={nt.type}
                      onClick={() => addNode(nt.type)}
                      className="border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                    >
                      + {nt.label}
                    </button>
                  ))}
                </div>

                {/* Canvas */}
                <div className="flex-1 relative bg-zinc-950 p-4 overflow-auto">
                  {selectedWorkflow.nodes.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-zinc-600 text-xs mb-1">No nodes yet</p>
                        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
                          Click + Trigger, + Action, or + Condition above
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {selectedWorkflow.nodes.map((node, i) => {
                        const cfg = JSON.parse(node.config || '{}')
                        const pos = JSON.parse(node.position || '{"x":0,"y":0}')
                        const nt = NODE_TYPES.find(n => n.type === node.type)
                        return (
                          <div
                            key={node.id}
                            className="border border-zinc-800 bg-black p-4 w-40 relative"
                          >
                            <span className={`block text-[10px] uppercase tracking-widest mb-1 ${nt?.color || 'text-zinc-500'}`}>
                              {node.type}
                            </span>
                            <span className="text-sm font-bold tracking-tight">
                              {cfg.label || `Node ${i + 1}`}
                            </span>
                            {i < selectedWorkflow.nodes.length - 1 && (
                              <svg className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-zinc-600 text-xs mb-2">Select a workflow</p>
                  <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
                    Or create a new one to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Templates */}
        <div className="mt-px bg-zinc-800">
          <div className="bg-black p-6">
            <SectionHeader
              label="Templates"
              title="Quick Start"
              description="Pre-built workflow templates. Clone and customize."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
              {[
                { name: 'Email Automation', desc: 'Trigger on email, extract data, route actions', type: 'trigger' },
                { name: 'Data Pipeline', desc: 'Ingest, transform, store. ETL in minutes', type: 'action' },
                { name: 'Customer Support', desc: 'Classify tickets, auto-respond, escalate', type: 'condition' },
              ].map(t => (
                <button
                  key={t.name}
                  onClick={() => createWorkflow(t.name)}
                  className="bg-black p-4 text-left hover:bg-zinc-950 transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">{t.type}</span>
                  <span className="text-sm font-bold tracking-tight block mb-1">{t.name}</span>
                  <span className="text-xs text-zinc-500">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
