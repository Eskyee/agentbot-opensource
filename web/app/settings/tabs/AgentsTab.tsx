'use client'

import Link from 'next/link'
import { useState } from 'react'

export function AgentsTab({
  agents,
  onRename,
  onDelete,
}: {
  agents: { id: string; name: string; status: string }[]
  onRename: (id: string, name: string) => void
  onDelete?: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const startEdit = (agent: { id: string; name: string }) => {
    setEditingId(agent.id)
    setDraft(agent.name)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft('')
    setError('')
  }

  const deleteAgent = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete?.(id)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to delete agent')
      }
    } catch {
      alert('Network error. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const saveRename = async (id: string) => {
    const name = draft.trim()
    if (!name) { setError('Name cannot be empty'); return }
    if (name.length > 64) { setError('Max 64 chars'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to rename'); return }
      onRename(id, name)
      setEditingId(null)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (agents.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <p className="text-zinc-400 text-sm mb-4">No agents deployed yet.</p>
        <Link
          href="/marketplace"
          className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          Deploy from Marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-xl font-semibold">Your Agents</h2>
        <Link
          href="/marketplace"
          className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          + Deploy New
        </Link>
      </div>

      {agents.map((agent) => (
        <div key={agent.id} className="border border-zinc-800 bg-zinc-900/50 p-4">
          {editingId === agent.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError('') }}
                maxLength={64}
                autoFocus
                className="w-full border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(agent.id)
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => saveRename(agent.id)}
                  disabled={saving}
                  className="bg-white text-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-zinc-700 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <span className="font-mono font-bold text-sm text-white truncate block">{agent.name}</span>
                <span className={`text-[10px] uppercase tracking-widest mt-0.5 block ${
                  agent.status === 'running' || agent.status === 'active' ? 'text-green-400' :
                  agent.status === 'error' || agent.status === 'failed' ? 'text-red-400' :
                  'text-zinc-500'
                }`}>{agent.status}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(agent)}
                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-white hover:text-white transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteAgent(agent.id, agent.name)}
                  disabled={deletingId === agent.id}
                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:border-red-500 hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                >
                  {deletingId === agent.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

