'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  status: 'active' | 'inactive' | 'deploying' | 'error'
  created: string
  subdomain?: string
  url?: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key-12345'}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async () => {
    if (!newAgentName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || 'dev-secret-key-12345'}`
        },
        body: JSON.stringify({
          name: newAgentName,
          config: {}
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewAgentName('')
        fetchAgents()
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'deploying': return 'text-yellow-500'
      case 'inactive': return 'text-gray-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '●'
      case 'deploying': return '◐'
      case 'inactive': return '○'
      case 'error': return '✕'
      default: return '○'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🦞</Link>
            <h1 className="text-xl font-semibold">StartClaw</h1>
          </div>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
            <Link href="/agents" className="text-white">Agents</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white">Docs</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Your Agents</h2>
            <p className="mt-2 text-gray-400">Deploy and manage your AI agents</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-lobster-500 px-6 py-3 font-semibold hover:bg-lobster-400 transition-all"
          >
            + Create Agent
          </button>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading agents...</div>
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
            <p className="text-gray-400 mb-6">Create your first agent to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-lobster-500 px-6 py-3 font-semibold hover:bg-lobster-400 transition-all"
            >
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 hover:border-lobster-500/50 transition-all"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <div className={`mt-2 flex items-center gap-2 text-sm ${getStatusColor(agent.status)}`}>
                      <span>{getStatusIcon(agent.status)}</span>
                      <span className="capitalize">{agent.status}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white">⋮</button>
                </div>

                {agent.url && (
                  <div className="mb-4 rounded-lg bg-black/50 p-3">
                    <div className="text-xs text-gray-500 mb-1">URL</div>
                    <a
                      href={agent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-lobster-400 hover:underline break-all"
                    >
                      {agent.subdomain}
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800">
                    Configure
                  </button>
                  <button className="flex-1 rounded-lg bg-lobster-500 px-4 py-2 text-sm hover:bg-lobster-400">
                    Deploy
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {new Date(agent.created).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-xl font-semibold mb-4">Create New Agent</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Agent Name</label>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="my-awesome-agent"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-lobster-500 focus:outline-none"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewAgentName('')
                }}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createAgent}
                className="flex-1 rounded-lg bg-lobster-500 px-4 py-2 hover:bg-lobster-400 disabled:opacity-50"
                disabled={creating || !newAgentName.trim()}
              >
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
