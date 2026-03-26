'use client'

import { useEffect, useState } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

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

  const KeyIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )

  const EyeIcon = () => (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="square" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  const CopyIcon = () => (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )

  const TrashIcon = () => (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )

  if (loading && keys.length === 0) {
    return (
      <DashboardShell>
        <DashboardHeader title="API Keys" icon={<KeyIcon />} />
        <DashboardContent>
          <div className="text-zinc-500 text-xs">Loading...</div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="API Keys"
        icon={<KeyIcon />}
        count={keys.length}
        action={
          <button
            onClick={() => setShowNewKeyForm(!showNewKeyForm)}
            className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-4"
          >
            + New Key
          </button>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        <SectionHeader
          label="Security"
          title="Manage API Keys"
          description="Create and manage keys for programmatic access"
        />

        {error && (
          <div className="border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {showNewKeyForm && (
          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h2 className="text-sm font-bold tracking-tight uppercase">Create New API Key</h2>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full bg-zinc-950 border border-zinc-700 px-4 py-2 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateKey}
                className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-6"
              >
                Create Key
              </button>
              <button
                onClick={() => {
                  setShowNewKeyForm(false)
                  setNewKeyName('')
                }}
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {keys.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 py-12 text-center">
            <p className="text-zinc-500 text-xs">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-px bg-zinc-800">
            {keys.map((key) => (
              <div
                key={key.id}
                className="bg-zinc-950 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold tracking-tight uppercase">{key.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-widest">ID: {key.id}</p>
                  </div>
                  <StatusPill
                    status={key.status === 'active' ? 'active' : 'error'}
                    label={key.status}
                    size="sm"
                  />
                </div>

                <div className="mb-4 p-3 border border-zinc-800 bg-black">
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-zinc-300 font-mono">
                      {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-2 flex items-center gap-1"
                      >
                        {visibleKeys.has(key.id) ? <><EyeOffIcon /> Hide</> : <><EyeIcon /> Show</>}
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.key, key.id)}
                        className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-2 flex items-center gap-1"
                      >
                        {copiedId === key.id ? '✓ Copied' : <><CopyIcon /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-zinc-800 text-[10px] mb-4">
                  <div className="bg-zinc-950 p-3">
                    <div className="text-zinc-600 uppercase tracking-widest mb-1">Created</div>
                    <div className="text-white">{new Date(key.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="bg-zinc-950 p-3">
                    <div className="text-zinc-600 uppercase tracking-widest mb-1">Last Used</div>
                    <div className="text-white">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</div>
                  </div>
                </div>

                {key.status === 'active' && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    <TrashIcon /> Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
