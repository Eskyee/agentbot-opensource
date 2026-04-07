'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Plus, Trash2, Tag, Clock, FileText, Lightbulb, AlertCircle, Search,
  Server, Shield, Cpu, Zap, type LucideIcon,
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
import { AGENTBOT_BACKEND_URL, SOUL_SERVICE_URL, X402_GATEWAY_URL } from '@/app/lib/platform-urls'

type MemoryKind = 'fact' | 'decision' | 'note' | 'alert'

interface MemoryEntry {
  id: string
  kind: MemoryKind
  content: string
  tags: string[]
  createdAt: string
  source: 'agent' | 'system'
}

const KIND_META: Record<MemoryKind, {
  label: string
  icon: LucideIcon
  color: string
  status: 'active' | 'idle' | 'error' | 'offline'
}> = {
  fact: { label: 'Fact', icon: FileText, color: 'text-blue-400', status: 'active' },
  decision: { label: 'Decision', icon: Lightbulb, color: 'text-yellow-400', status: 'idle' },
  note: { label: 'Note', icon: FileText, color: 'text-zinc-400', status: 'offline' },
  alert: { label: 'Alert', icon: AlertCircle, color: 'text-red-400', status: 'error' },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  return `${m}m ago`
}

function inferKind(key: string): MemoryKind {
  const k = key.toLowerCase()
  if (k.includes('alert') || k.includes('error') || k.includes('warning') || k.includes('security')) return 'alert'
  if (k.includes('decision') || k.includes('switch') || k.includes('chose') || k.includes('fix')) return 'decision'
  if (k.includes('note') || k.includes('todo') || k.includes('log')) return 'note'
  return 'fact'
}

function inferTags(key: string, value: string): string[] {
  const tags: string[] = []
  const combined = `${key} ${value}`.toLowerCase()
  const tagMap: Record<string, string[]> = {
    auth: ['auth', 'session', 'login', 'token', 'secret'],
    billing: ['stripe', 'checkout', 'price', 'billing', 'subscription'],
    deploy: ['deploy', 'build', 'vercel', 'render', 'railway'],
    infra: ['health', 'status', 'service', 'uptime', 'docker'],
    security: ['security', 'vulnerability', 'encrypt', 'key'],
    ux: ['ui', 'design', 'layout', 'component', 'page'],
  }
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(kw => combined.includes(kw))) tags.push(tag)
  }
  if (tags.length === 0) tags.push('general')
  return tags.slice(0, 3)
}

const FILTER_OPTIONS: Array<{ key: MemoryKind | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'fact', label: 'Fact' },
  { key: 'decision', label: 'Decision' },
  { key: 'note', label: 'Note' },
  { key: 'alert', label: 'Alert' },
]

const KIND_OPTIONS: MemoryKind[] = ['fact', 'decision', 'note', 'alert']

// Generate system memory entries from live infrastructure
async function fetchSystemMemories(): Promise<MemoryEntry[]> {
  const entries: MemoryEntry[] = []
  const now = new Date().toISOString()

  const checks = [
    { name: 'Agentbot API', url: `${AGENTBOT_BACKEND_URL}/health`, icon: Server },
    { name: 'x402 Gateway', url: `${X402_GATEWAY_URL}/health`, icon: Zap },
    { name: 'Tempo Soul', url: `${SOUL_SERVICE_URL}/health`, icon: Cpu },
    { name: 'Borg-0', url: `${SOUL_SERVICE_URL}/health`, icon: Shield },
  ]

  for (const check of checks) {
    try {
      const res = await fetch(check.url, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const body = await res.json()
        entries.push({
          id: `sys-${check.name.toLowerCase().replace(/\s/g, '-')}`,
          kind: 'fact',
          content: `${check.name} healthy — ${body.version ? `v${body.version}` : body.status || 'ok'}${body.soul_status ? `, soul: ${body.soul_status}` : ''}${body.provisioning ? `, provisioning: ${body.provisioning}` : ''}`,
          tags: ['infra', check.name.toLowerCase().split(' ')[0]],
          createdAt: now,
          source: 'system',
        })
      } else {
        entries.push({
          id: `sys-${check.name.toLowerCase().replace(/\s/g, '-')}`,
          kind: 'alert',
          content: `${check.name} degraded — HTTP ${res.status}`,
          tags: ['infra', 'alert'],
          createdAt: now,
          source: 'system',
        })
      }
    } catch {
      entries.push({
        id: `sys-${check.name.toLowerCase().replace(/\s/g, '-')}`,
        kind: 'alert',
        content: `${check.name} unreachable — connection timeout`,
        tags: ['infra', 'alert'],
        createdAt: now,
        source: 'system',
      })
    }
  }

  return entries
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MemoryKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newKind, setNewKind] = useState<MemoryKind>('note')
  const [newTags, setNewTags] = useState('')
  const [lastGenerated, setLastGenerated] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch both agent memory and system memory in parallel
      const [agentRes, systemEntries] = await Promise.all([
        fetch('/api/memory?agentId=all').then(r => r.ok ? r.json() : null).catch(() => null),
        fetchSystemMemories(),
      ])

      const agentEntries: MemoryEntry[] = []

      // Convert agent memory key-value pairs to structured entries
      if (agentRes?.memory) {
        for (const [key, value] of Object.entries(agentRes.memory)) {
          const val = typeof value === 'string' ? value : JSON.stringify(value)
          agentEntries.push({
            id: `agent-${key}`,
            kind: inferKind(key),
            content: `${key}: ${val}`,
            tags: inferTags(key, val),
            createdAt: agentRes.lastUpdated || new Date().toISOString(),
            source: 'agent',
          })
        }
      }

      // Combine: agent memories first, then system status
      setEntries([...agentEntries, ...systemEntries])
      setLastGenerated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error('Memory fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = entries
    .filter(e => filter === 'all' || e.kind === filter)
    .filter(e => !search || e.content.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const agentCount = entries.filter(e => e.source === 'agent').length
  const systemCount = entries.filter(e => e.source === 'system').length

  return (
    <DashboardShell>
      <DashboardHeader
        title="Memory Log"
        icon={<Brain className="h-5 w-5 text-blue-400" />}
        count={entries.length}
        action={
          <div className="flex items-center gap-2">
            <Button
              className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Memory
            </Button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-3 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        }
      />

      <DashboardContent className="space-y-5">
        {lastGenerated && (
          <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
            <span>{agentCount} agent memories · {systemCount} system checks</span>
            <span>Updated {lastGenerated}</span>
          </div>
        )}

        {/* Filters + search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search memories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
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
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">New Memory</h3>
            <div className="flex gap-2 flex-wrap">
              {KIND_OPTIONS.map(k => {
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
              onChange={e => setNewContent(e.target.value)}
              rows={3}
            />
            <AgentInput
              placeholder="Tags (comma-separated)"
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200"
                onClick={() => {
                  if (!newContent.trim()) return
                  const entry: MemoryEntry = {
                    id: Date.now().toString(),
                    kind: newKind,
                    content: newContent.trim(),
                    tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
                    createdAt: new Date().toISOString(),
                    source: 'agent',
                  }
                  setEntries(prev => [entry, ...prev])
                  setNewContent('')
                  setNewTags('')
                  setAddOpen(false)
                }}
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

        {/* Loading */}
        {loading && entries.length === 0 ? (
          <div className="flex flex-col py-20 gap-4 items-center">
            <Brain className="h-6 w-6 text-blue-400 animate-pulse" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest">Loading memory…</p>
          </div>
        ) : (
          /* Memory entries */
          <div className="space-y-px bg-zinc-800">
            {filtered.length === 0 && (
              <div className="bg-zinc-950 p-8">
                <EmptyState title="No memories match your filter." />
              </div>
            )}
            {filtered.map(entry => {
              const meta = KIND_META[entry.kind]
              const Icon = meta.icon
              return (
                <div key={entry.id} className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col sm:flex-row gap-4">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusPill status={meta.status} label={meta.label} size="sm" />
                      {entry.source === 'system' && (
                        <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1.5 py-0.5 uppercase tracking-widest">
                          live
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed">{entry.content}</div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[10px] border border-zinc-700 text-zinc-500 px-2 py-0.5">
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
                      onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
