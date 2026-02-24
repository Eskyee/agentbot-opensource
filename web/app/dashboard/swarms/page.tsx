'use client'

import { useState, useEffect } from 'react'

export default function SwarmsPage() {
  const [swarms, setSwarms] = useState([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/swarms')
      .then(r => r.json())
      .then(d => setSwarms(d.swarms || []))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Swarms</h1>
            <p className="text-gray-400 mt-2">Deploy multiple agents that work together</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            + Create Swarm
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {swarms.map((swarm: any) => (
            <div key={swarm.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{swarm.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{swarm.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  {swarm.agents.length} agents
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {swarm.agents.map((agent: any, i: number) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm font-medium mb-1">{agent.role}</div>
                    <div className="text-xs text-gray-400">{agent.model}</div>
                    <div className="text-xs text-gray-500 mt-2">{agent.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {swarms.length === 0 && (
          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400">No swarms created yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-white hover:underline"
            >
              Create your first swarm →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
