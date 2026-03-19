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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Visual Workflows</h1>
            <p className="text-gray-400 mt-2">Build no-code automation workflows</p>
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            + New Workflow
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              + Trigger
            </button>
            <button className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              + Action
            </button>
            <button className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              + Condition
            </button>
          </div>

          <div className="relative bg-gray-950 rounded-lg h-96 border border-gray-800">
            {nodes.map(node => (
              <div
                key={node.id}
                className="absolute bg-gray-800 border border-gray-700 rounded-lg p-4 w-32 cursor-move"
                style={{ left: node.x, top: node.y }}
              >
                <div className="text-xs text-gray-400 mb-1">{node.type}</div>
                <div className="text-sm font-medium">{node.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Workflow Templates</h2>
          <div className="grid grid-cols-3 gap-4">
            {['Email Automation', 'Data Pipeline', 'Customer Support'].map(template => (
              <div key={template} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 cursor-pointer">
                <div className="font-medium mb-2">{template}</div>
                <div className="text-xs text-gray-400">Pre-built workflow</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
