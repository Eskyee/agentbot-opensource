'use client'

import { useState, useEffect, useCallback } from 'react'

interface WorkflowNode {
  id: string
  type: string
  config: unknown
  position: unknown
}

interface Workflow {
  id: string
  name: string
  description?: string
  enabled: boolean
  nodes: WorkflowNode[]
}

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Workflows
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading...</div>}
      {!loading && workflows.length === 0 && (
        <div className="text-xs text-zinc-500">No workflows</div>
      )}
      <div className="space-y-1">
        {workflows.map((wf) => (
          <div key={wf.id}>
            <button
              onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
              className="w-full text-left px-2 py-1.5 border-l-2 border-l-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300">{wf.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">{wf.nodes.length} nodes</span>
                  <span className={`text-[10px] uppercase tracking-widest ${wf.enabled ? 'text-green-500' : 'text-zinc-500'}`}>
                    {wf.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </button>
            {expanded === wf.id && wf.nodes.length > 0 && (
              <div className="ml-3 border-l border-zinc-800 pl-2 py-1">
                {wf.nodes.map((node) => (
                  <div key={node.id} className="text-[10px] text-zinc-500 py-0.5">
                    <span className="text-zinc-500">{node.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
