'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Workflow, Plus, Play, Pause, Trash2, Save, GripVertical,
  Zap, Bot, MessageSquare, Globe, Clock, GitBranch, CheckCircle,
  ArrowRight, Settings, Copy, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'agent' | 'condition' | 'action' | 'delay' | 'output'
  label: string
  config: Record<string, unknown>
  x: number
  y: number
}

interface WorkflowEdge {
  id: string
  from: string
  to: string
  label?: string
}

interface WorkflowDef {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  lastRun: string | null
  runCount: number
}

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'text-orange-400', desc: 'Webhook, cron, message, or event' },
  { type: 'agent', label: 'Agent', icon: Bot, color: 'text-orange-400', desc: 'Run an agent with a prompt' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-blue-400', desc: 'Branch based on output' },
  { type: 'action', label: 'Action', icon: Globe, color: 'text-emerald-400', desc: 'API call, tool use, or side effect' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'text-amber-400', desc: 'Wait before next step' },
  { type: 'output', label: 'Output', icon: MessageSquare, color: 'text-sky-400', desc: 'Send message, webhook, or store' },
]

function NodeCard({
  node,
  selected,
  onSelect,
  onDelete,
}: {
  node: WorkflowNode
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const nodeType = nodeTypes.find((t) => t.type === node.type)
  const Icon = nodeType?.icon ?? Bot
  const color = nodeType?.color ?? 'text-zinc-400'

  return (
    <div
      onClick={onSelect}
      className={cn(
        'border bg-zinc-950 p-3 cursor-pointer transition-all w-56',
        selected ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-zinc-800 hover:border-zinc-600'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{nodeType?.label}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-zinc-700 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="text-xs font-bold text-white">{node.label}</div>
      {(node.config as Record<string, unknown>)?.prompt ? (
        <div className="text-[10px] text-zinc-600 mt-1 line-clamp-2">{String((node.config as Record<string, unknown>).prompt)}</div>
      ) : null}
    </div>
  )
}

function WorkflowCanvas({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  onDeleteNode,
  onAddNode,
}: {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: string | null
  onSelectNode: (id: string | null) => void
  onDeleteNode: (id: string) => void
  onAddNode: (type: string) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-[#050505] relative overflow-auto min-h-[500px]"
      onClick={() => onSelectNode(null)}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #1f1f1f 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Nodes */}
      <div className="relative p-8 flex flex-wrap gap-6 items-start">
        {nodes.map((node, i) => (
          <div key={node.id} className="relative">
            {/* Edge indicator */}
            {i > 0 && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                <ArrowRight className="h-4 w-4 text-zinc-700" />
              </div>
            )}
            <NodeCard
              node={node}
              selected={selectedNode === node.id}
              onSelect={() => onSelectNode(node.id)}
              onDelete={() => onDeleteNode(node.id)}
            />
          </div>
        ))}

        {/* Add node button */}
        <div className="relative group">
          <button
            onClick={(e) => { e.stopPropagation(); onAddNode('agent') }}
            className="border border-dashed border-zinc-700 bg-transparent p-3 w-56 h-24 flex items-center justify-center hover:border-orange-500 hover:bg-orange-500/5 transition-all"
          >
            <div className="text-center">
              <Plus className="h-5 w-5 text-zinc-600 mx-auto mb-1" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Add Step</span>
            </div>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Workflow className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">Build Your First Workflow</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Drag triggers, agents, conditions, and actions to create automated workflows.
              Your agents will execute them on autopilot.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function NodeConfigPanel({
  node,
  onUpdate,
}: {
  node: WorkflowNode
  onUpdate: (updates: Partial<WorkflowNode>) => void
}) {
  const nodeType = nodeTypes.find((t) => t.type === node.type)
  const Icon = nodeType?.icon ?? Bot

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', nodeType?.color)} />
        <span className="text-xs font-bold text-white uppercase tracking-tight">{nodeType?.label} Config</span>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Label</label>
        <input
          value={node.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
        />
      </div>

      {node.type === 'agent' && (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Prompt</label>
            <textarea
              value={String(node.config.prompt || '')}
              onChange={(e) => onUpdate({ config: { ...node.config, prompt: e.target.value } })}
              rows={3}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none resize-none"
              placeholder="Tell the agent what to do..."
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Model</label>
            <select
              value={String(node.config.model || 'mimo-v2.5-pro')}
              onChange={(e) => onUpdate({ config: { ...node.config, model: e.target.value } })}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
            >
              <option value="mimo-v2.5-pro">MiMo V2.5 Pro</option>
              <option value="mimo-v2.5">MiMo V2.5</option>
              <option value="claude-opus-4-6">Claude Opus</option>
              <option value="gpt-5">GPT-5</option>
            </select>
          </div>
        </>
      )}

      {node.type === 'trigger' && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Trigger Type</label>
          <select
            value={String(node.config.triggerType || 'webhook')}
            onChange={(e) => onUpdate({ config: { ...node.config, triggerType: e.target.value } })}
            className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
          >
            <option value="webhook">Webhook</option>
            <option value="cron">Cron Schedule</option>
            <option value="message">Incoming Message</option>
            <option value="event">Platform Event</option>
          </select>
        </div>
      )}

      {node.type === 'condition' && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Condition</label>
          <input
            value={String(node.config.condition || '')}
            onChange={(e) => onUpdate({ config: { ...node.config, condition: e.target.value } })}
            className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
            placeholder="e.g. output contains 'error'"
          />
        </div>
      )}

      {node.type === 'delay' && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1.5">Duration</label>
          <input
            value={String(node.config.duration || '5m')}
            onChange={(e) => onUpdate({ config: { ...node.config, duration: e.target.value } })}
            className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
            placeholder="5m, 1h, 24h"
          />
        </div>
      )}

      <div className="text-[10px] text-zinc-600">{nodeType?.desc}</div>
    </div>
  )
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient()
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: workflows, isLoading } = useQuery<WorkflowDef[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/workflows')
      if (!res.ok) throw new Error('Failed to load workflows')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/dashboard/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: '' }),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setShowNew(false)
      setNewName('')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (workflow: WorkflowDef) => {
      const res = await fetch('/api/dashboard/workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
  })

  const list = workflows ?? []
  const active = list.find((w) => w.id === selectedWorkflow)
  const activeNodes = active?.nodes ?? []
  const activeEdges = active?.edges ?? []
  const selectedNodeData = activeNodes.find((n) => n.id === selectedNode)

  const handleAddNode = useCallback((type: string) => {
    if (!active) return
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type as WorkflowNode['type'],
      label: nodeTypes.find((t) => t.type === type)?.label ?? 'Step',
      config: {},
      x: activeNodes.length * 280,
      y: 0,
    }
    const updated = {
      ...active,
      nodes: [...activeNodes, newNode],
    }
    setSelectedWorkflow(updated.id)
    // Auto-save
    saveMutation.mutate(updated)
  }, [active, activeNodes, saveMutation])

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!active) return
    const updated = {
      ...active,
      nodes: activeNodes.filter((n) => n.id !== nodeId),
      edges: activeEdges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    }
    saveMutation.mutate(updated)
    if (selectedNode === nodeId) setSelectedNode(null)
  }, [active, activeNodes, activeEdges, selectedNode, saveMutation])

  const handleUpdateNode = useCallback((updates: Partial<WorkflowNode>) => {
    if (!active || !selectedNode) return
    const updated = {
      ...active,
      nodes: activeNodes.map((n) => n.id === selectedNode ? { ...n, ...updates } : n),
    }
    saveMutation.mutate(updated)
  }, [active, selectedNode, activeNodes, saveMutation])

  return (
    <DashboardShell className="flex flex-col h-screen overflow-hidden">
      <DashboardHeader
        title="Workflows"
        subtitle="Visual agent orchestration — build multi-step automated workflows"
        icon={<Workflow className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            {active && (
              <button
                onClick={() => saveMutation.mutate(active)}
                className="flex items-center gap-2 text-[11px] border border-zinc-700 text-zinc-300 px-4 py-1.5 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 text-[11px] bg-white text-black px-4 py-1.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New Workflow
            </button>
          </div>
        }
      />

      <DashboardContent className="flex-1 overflow-hidden min-h-0">
        {/* New workflow modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-950 border border-zinc-700 w-full max-w-md p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mb-4">New Workflow</h2>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none mb-4"
                placeholder="Workflow name..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate(newName)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => newName.trim() && createMutation.mutate(newName)}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="flex-1 bg-white text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-px bg-zinc-800 h-full">
          {/* Left: workflow list */}
          <div className="w-64 bg-zinc-950 border-r border-zinc-800 overflow-y-auto shrink-0">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                Workflows ({list.length})
              </span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : list.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500">No workflows yet.</p>
              </div>
            ) : (
              list.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => { setSelectedWorkflow(wf.id); setSelectedNode(null) }}
                  className={cn(
                    'px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900/30 transition-colors',
                    selectedWorkflow === wf.id && 'bg-zinc-900/50 border-l-2 border-l-orange-500'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{wf.name}</span>
                    <span className={cn(
                      'text-[9px] uppercase tracking-widest px-1.5 py-0.5',
                      wf.status === 'active' ? 'text-emerald-400 border border-emerald-400/20'
                        : wf.status === 'paused' ? 'text-amber-400 border border-amber-400/20'
                        : 'text-zinc-500 border border-zinc-800'
                    )}>
                      {wf.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">
                    {wf.nodes.length} steps · {wf.runCount} runs
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            {active ? (
              <>
                <WorkflowCanvas
                  nodes={activeNodes}
                  edges={activeEdges}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  onDeleteNode={handleDeleteNode}
                  onAddNode={handleAddNode}
                />
                {/* Node type palette */}
                <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 flex gap-2 overflow-x-auto">
                  {nodeTypes.map((nt) => {
                    const Icon = nt.icon
                    return (
                      <button
                        key={nt.type}
                        onClick={() => handleAddNode(nt.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors shrink-0"
                      >
                        <Icon className={cn('h-3 w-3', nt.color)} />
                        {nt.label}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                  <Workflow className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">
                    Select or Create a Workflow
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mb-6">
                    Build multi-step agent workflows with triggers, conditions, and actions.
                  </p>
                  <button
                    onClick={() => setShowNew(true)}
                    className="text-[11px] bg-white text-black px-5 py-2 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    Create Workflow
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: node config */}
          {selectedNodeData && (
            <div className="w-72 bg-zinc-950 border-l border-zinc-800 overflow-y-auto shrink-0">
              <NodeConfigPanel
                node={selectedNodeData}
                onUpdate={handleUpdateNode}
              />
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
