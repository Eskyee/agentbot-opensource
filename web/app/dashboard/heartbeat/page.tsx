'use client'

import { useEffect, useState } from 'react'

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
        const response = await fetch('/api/heartbeat')
        if (!response.ok) {
          throw new Error('Failed to fetch heartbeat')
        }
        const data = await response.json()
        setAgents(data.agents || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    fetchHeartbeat()
    const interval = setInterval(fetchHeartbeat, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && agents.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Heartbeat Monitor</h1>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Agent Heartbeat Monitor</h1>
        <p className="text-gray-400 mb-8">Real-time status of all deployed agents</p>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-300">Error: {error}</p>
          </div>
        )}

        {agents.length === 0 ? (
          <div className="text-gray-400">No agents running yet</div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name || agent.id}</h3>
                    <p className="text-sm text-gray-400">ID: {agent.id}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      agent.status === 'active'
                        ? 'bg-green-900/30 text-green-300'
                        : agent.status === 'stopped'
                          ? 'bg-yellow-900/30 text-yellow-300'
                          : 'bg-red-900/30 text-red-300'
                    }`}
                  >
                    {agent.status}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Port</p>
                    <p className="text-white">{agent.port}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Uptime</p>
                    <p className="text-white">{agent.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Heartbeat</p>
                    <p className="text-white">{agent.lastHeartbeat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
