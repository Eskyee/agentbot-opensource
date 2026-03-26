'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain, Plus, Trash2, Tag, Clock, FileText, Lightbulb, AlertCircle, Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentInput, AgentTextarea } from '@/app/components/shared/AgentInput'
import { EmptyState } from '@/app/components/shared/EmptyState'
import StatusPill from '@/app/components/shared/StatusPill'

type MemoryKind = 'fact' | 'decision' | 'note' | 'alert'

interface MemoryEntry {
  id: string
  kind: MemoryKind
  content: string
  tags: string[]
  createdAt: string
}

const KIND_META: Record<MemoryKind, {
  label: string
  icon: React.ElementType
  color: string
  status: 'active' | 'idle' | 'error' | 'offline'
}> = {
  fact: {
    label: 'Fact',
    icon: FileText,
    color: 'text-blue-400',
    status: 'active',
  },
  decision: {
    label: 'Decision',
    icon: Lightbulb,
    color: 'text-yellow-400',
    status: 'idle',
  },
  note: {
    label: 'Note',
    icon: FileText,
    color: 'text-zinc-400',
    status: 'offline',
  },
  alert: {
    label: 'Alert',
    icon: AlertCircle,
    color: 'text-red-400',
    status: 'error',
  },
}

const SEED_ENTRIES: MemoryEntry[] = [
  {
    id: '1',
    kind: 'fact',
    content: 'User prefers GBP currency for all billing flows.',
    tags: ['billing', 'ux'],
    createdAt: new Date(Date.now() - 3600_000 * 2).toISOString(),
  },
  {
    id: '2',
    kind: 'decision',
    content: 'Switched Stripe checkout to 303 redirect instead of JSON response to support server component links.',
    tags: ['stripe', 'architecture'],
    createdAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
  },
  {
    id: '3',
    kind: 'note',
    content: 'openclaw-dashboard uses SQLite locally — adapted to Postgres for serverless compatibility.',
    tags: ['openclaw', 'db'],
    createdAt: new Date(Date.now() - 3600_000 * 8).toISOString(),
  },
  {
    id: '4',
    kind: 'alert',
    content: 'NEXTAUTH_SECRET must not throw at module eval time — reverted to env var fallback.',
    tags: ['auth', 'build'],
    createdAt: new Date(Date.now() - 3600_000 * 10).toISOString(),
  },
]

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  return `${m}m ago`
}

const FILTER_OPTIONS: Array<{ key: MemoryKind | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'fact', label: 'Fact' },
  { key: 'decision', label: 'Decision' },
  { key: 'note', label: 'Note' },
  { key: 'alert', label: 'Alert' },
]

const KIND_OPTIONS: MemoryKind[] = ['fact', 'decision', 'note', 'alert']

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>(SEED_ENTRIES)
  const [filter, setFilter] = useState<MemoryKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newKind, setNewKind] = useState<MemoryKind>('note')
  const [newTags, setNewTags] = useState('')

  const { data: apiMemory } = useQuery({
    queryKey: ['agent-memory'],
    queryFn: async () => {
      const res = await fetch('/api/memory?agentId=default')
      return res.json()
    },
    staleTime: 30_000,
  })

  const filtered = entries
    .filter((e) => filter === 'all' || e.kind === filter)
    .filter(
      (e) =>
        !search ||
        e.content.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some((t) => t.includes(search.toLowerCase()))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const addEntry = () => {
    if (!newContent.trim()) return
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      kind: newKind,
      content: newContent.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [entry, ...prev])
    setNewContent('')
    setNewTags('')
    setAddOpen(false)
  }

  const deleteEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id))

  return (
    <DashboardShell>
      <DashboardHeader
        title="Memory Log"
        icon={<Brain className="h-5 w-5 text-blue-400" />}
        count={entries.length}
        action={
          <Button
            className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Memory
          </Button>
        }
      />

      <DashboardContent className="space-y-5">
        {/* Filters + search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search memories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`border text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 transition-colors ${
                filter === key
                  ? 'border-white text-white bg-white/10'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add form */}
        {addOpen && (
          <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              New Memory
            </h3>
            <div className="flex gap-2 flex-wrap">
              {KIND_OPTIONS.map((k) => {
                const meta = KIND_META[k]
                return (
                  <button
                    key={k}
                    onClick={() => setNewKind(k)}
                    className={`border text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 transition-colors ${
                      newKind === k
                        ? 'border-white text-white bg-white/10'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                    }`}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
            <AgentTextarea
              placeholder="Memory content…"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />
            <AgentInput
              placeholder="Tags (comma-separated)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
                onClick={addEntry}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Memory entries */}
        <div className="space-y-px bg-zinc-800">
          {filtered.length === 0 && (
            <div className="bg-zinc-950 p-8">
              <EmptyState title="No memories match your filter." />
            </div>
          )}
          {filtered.map((entry) => {
            const meta = KIND_META[entry.kind]
            const Icon = meta.icon
            return (
              <div
                key={entry.id}
                className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col sm:flex-row gap-4"
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusPill status={meta.status} label={meta.label} size="sm" />
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    {entry.content}
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] border border-zinc-700 text-zinc-500 px-2 py-0.5"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelative(entry.createdAt)}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
