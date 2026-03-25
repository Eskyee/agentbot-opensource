'use client'

import { useState } from 'react'

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'trigger', label: 'New Email', x: 100, y: 100 },
    { id: '2', type: 'action', label: 'Extract Data', x: 300, y: 100 },
    { id: '3', type: 'condition', label: 'Is Urgent?', x: 500, y: 100 },
    { id: '4', type: 'action', label: 'Send Alert', x: 700, y: 50 },
    { id: '5', type: 'action', label: 'Save to DB', x: 700, y: 150 }
  ])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Visual Workflows</h1>
            <p className="text-zinc-400 mt-2">Build no-code automation workflows</p>
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-100 transition-colors">
            + New Workflow
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
              + Trigger
            </button>
            <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
              + Action
            </button>
            <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
              + Condition
            </button>
          </div>

          <div className="relative bg-zinc-950 rounded-lg h-96 border border-zinc-800">
            {nodes.map(node => (
              <div
                key={node.id}
                className="absolute bg-zinc-800 border border-zinc-700 rounded-lg p-4 w-32 cursor-move"
                style={{ left: node.x, top: node.y }}
              >
                <div className="text-xs text-zinc-400 mb-1">{node.type}</div>
                <div className="text-sm font-medium">{node.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Workflow Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Email Automation', 'Data Pipeline', 'Customer Support'].map(template => (
              <div key={template} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 cursor-pointer">
                <div className="font-medium mb-2">{template}</div>
                <div className="text-xs text-zinc-400">Pre-built workflow</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
