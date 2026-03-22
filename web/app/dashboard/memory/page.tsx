'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain, Plus, Trash2, Tag, Clock, FileText, Lightbulb, AlertCircle, Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentInput, AgentTextarea } from '@/app/components/shared/AgentInput'
import { EmptyState } from '@/app/components/shared/EmptyState'

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
  bg: string
}> = {
  fact: {
    label: 'Fact',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-800/40',
  },
  decision: {
    label: 'Decision',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20 border-yellow-800/40',
  },
  note: {
    label: 'Note',
    icon: FileText,
    color: 'text-zinc-400',
    bg: 'bg-zinc-900/40 border-zinc-700/40',
  },
  alert: {
    label: 'Alert',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/20 border-red-800/40',
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
      const res = await fetch('/api/memory')
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
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest"
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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          {FILTER_OPTIONS.map(({ key, label }) => (
            <Badge
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors capitalize ${
                filter === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </Badge>
          ))}
        </div>

        {/* Add form */}
        {addOpen && (
          <div className="bg-zinc-900 border border-blue-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest">
              New Memory
            </h3>
            <div className="flex gap-2 flex-wrap">
              {KIND_OPTIONS.map((k) => {
                const meta = KIND_META[k]
                return (
                  <Badge
                    key={k}
                    variant={newKind === k ? 'default' : 'outline'}
                    className={`cursor-pointer capitalize ${
                      newKind === k
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-zinc-700 text-zinc-400'
                    }`}
                    onClick={() => setNewKind(k)}
                  >
                    {meta.label}
                  </Badge>
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
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest"
                onClick={addEntry}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Memory entries */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <EmptyState title="No memories match your filter." />
          )}
          {filtered.map((entry, i) => {
            const meta = KIND_META[entry.kind]
            const Icon = meta.icon
            return (
              <div
                key={entry.id}
                className={`border rounded-xl p-4 flex gap-4 ${meta.bg}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-100 leading-relaxed">
                    {entry.content}
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] border-zinc-700 text-zinc-400 gap-1"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
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
