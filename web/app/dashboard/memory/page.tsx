'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Brain, Plus, Trash2, Tag, Clock, FileText, Lightbulb, AlertCircle } from 'lucide-react'

type MemoryKind = 'fact' | 'decision' | 'note' | 'alert'

interface MemoryEntry {
  id: string
  kind: MemoryKind
  content: string
  tags: string[]
  createdAt: string
}

const KIND_META: Record<MemoryKind, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  fact:     { label: 'Fact',     icon: FileText,   color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-800/40' },
  decision: { label: 'Decision', icon: Lightbulb,  color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/40' },
  note:     { label: 'Note',     icon: FileText,   color: 'text-gray-400',   bg: 'bg-gray-900/40 border-gray-700/40' },
  alert:    { label: 'Alert',    icon: AlertCircle, color: 'text-red-400',   bg: 'bg-red-900/20 border-red-800/40' },
}

const SEED_ENTRIES: MemoryEntry[] = [
  { id: '1', kind: 'fact',     content: 'User prefers GBP currency for all billing flows.', tags: ['billing', 'ux'], createdAt: new Date(Date.now() - 3600_000 * 2).toISOString() },
  { id: '2', kind: 'decision', content: 'Switched Stripe checkout to 303 redirect instead of JSON response to support server component links.', tags: ['stripe', 'architecture'], createdAt: new Date(Date.now() - 3600_000 * 5).toISOString() },
  { id: '3', kind: 'note',     content: 'openclaw-dashboard uses SQLite locally — adapted to Postgres for serverless compatibility.', tags: ['openclaw', 'db'], createdAt: new Date(Date.now() - 3600_000 * 8).toISOString() },
  { id: '4', kind: 'alert',    content: 'NEXTAUTH_SECRET must not throw at module eval time — reverted to env var fallback.', tags: ['auth', 'build'], createdAt: new Date(Date.now() - 3600_000 * 10).toISOString() },
]

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  return `${m}m ago`
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>(SEED_ENTRIES)
  const [filter, setFilter] = useState<MemoryKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newKind, setNewKind] = useState<MemoryKind>('note')
  const [newTags, setNewTags] = useState('')

  // Fetch real memory from API
  const { data: apiMemory } = useQuery({
    queryKey: ['agent-memory'],
    queryFn: async () => {
      const res = await fetch('/api/memory')
      return res.json()
    },
    staleTime: 30_000,
  })

  const filtered = entries
    .filter(e => filter === 'all' || e.kind === filter)
    .filter(e => !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const addEntry = () => {
    if (!newContent.trim()) return
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      kind: newKind,
      content: newContent.trim(),
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => [entry, ...prev])
    setNewContent('')
    setNewTags('')
    setAddOpen(false)
  }

  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))

  return (
    <div className="mt-[4rem] min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold tracking-tight">Memory Log</h1>
          <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 rounded-full px-3 py-0.5">{entries.length} entries</span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Memory
        </button>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Filters + search */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search memories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {(['all', 'fact', 'decision', 'note', 'alert'] as const).map(k => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === k
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Add form */}
        {addOpen && (
          <div className="bg-gray-900 border border-blue-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest">New Memory</h3>
            <div className="flex gap-2 flex-wrap">
              {(['fact', 'decision', 'note', 'alert'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setNewKind(k)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    newKind === k ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Memory content…"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button onClick={addEntry} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm rounded-lg transition-colors">Save</button>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Memory entries */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No memories match your filter.</div>
          )}
          {filtered.map(entry => {
            const meta = KIND_META[entry.kind]
            const Icon = meta.icon
            return (
              <div key={entry.id} className={`border rounded-xl p-4 flex gap-4 ${meta.bg}`}>
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-100 leading-relaxed">{entry.content}</div>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />{formatRelative(entry.createdAt)}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
