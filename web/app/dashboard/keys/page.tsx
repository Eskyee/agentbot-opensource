'use client'

import { useEffect, useState } from 'react'

interface APIKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
  status: 'active' | 'revoked'
}

export default function KeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/keys')
      if (!response.ok) throw new Error('Failed to fetch keys')
      const data = await response.json()
      setKeys(data.keys || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setKeys([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Key name is required')
      return
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (!response.ok) throw new Error('Failed to create key')
      
      const data = await response.json()
      setKeys([...keys, data.key])
      setNewKeyName('')
      setShowNewKeyForm(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key')
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to revoke key')
      
      setKeys(keys.filter((k) => k.id !== keyId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key')
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newSet = new Set(visibleKeys)
    if (newSet.has(keyId)) {
      newSet.delete(keyId)
    } else {
      newSet.add(keyId)
    }
    setVisibleKeys(newSet)
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(keyId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const maskKey = (key: string) => {
    return key.substring(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.substring(key.length - 4)
  }

  if (loading && keys.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">API Keys</h1>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">API Keys</h1>
            <p className="text-gray-400">Manage your API keys for programmatic access</p>
          </div>
          <button
            onClick={() => setShowNewKeyForm(!showNewKeyForm)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            + New Key
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {showNewKeyForm && (
          <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateKey}
                  className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  Create Key
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyForm(false)
                    setNewKeyName('')
                  }}
                  className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {keys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{key.name}</h3>
                    <p className="text-sm text-gray-500">ID: {key.id}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      key.status === 'active'
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}
                  >
                    {key.status}
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-gray-300 font-mono">
                      {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="p-2 hover:bg-gray-700 rounded transition text-xs"
                      >
                        {visibleKeys.has(key.id) ? '👁️ Hide' : '🔒 Show'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.key, key.id)}
                        className="p-2 hover:bg-gray-700 rounded transition text-xs"
                      >
                        {copiedId === key.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-white">{new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Used</p>
                    <p className="text-white">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>

                {key.status === 'active' && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="text-red-400 hover:text-red-300 transition text-sm"
                  >
                    🗑️ Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
