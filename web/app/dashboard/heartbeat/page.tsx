'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, Wifi } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { EmptyState } from '@/app/components/shared/EmptyState'
import StatusPill from '@/app/components/shared/StatusPill'

interface HeartbeatSettings {
  frequency: string
  enabled: boolean
  lastHeartbeat: string | null
  nextHeartbeat: string | null
}

const FREQS = ['1h', '3h', '6h', '12h', 'off']

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatNext(iso: string | null, enabled: boolean): string {
  if (!enabled) return 'Disabled'
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Soon'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h`
}

export default function HeartbeatPage() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [hb, setHb] = useState<HeartbeatSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load agent instance + heartbeat settings
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        // Prefer the OpenClaw instance ID; fall back to first Prisma agent
        let id: string | null = null

        const [openclawRes, agentsRes] = await Promise.all([
          fetch('/api/user/openclaw').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/agents').then(r => r.ok ? r.json() : null).catch(() => null),
        ])

        id = openclawRes?.openclawInstanceId || agentsRes?.agents?.[0]?.id || null

        if (!id) {
          if (!cancelled) setLoading(false)
          return
        }

        if (!cancelled) setAgentId(id)

        // Get heartbeat settings for this agent (show defaults if none saved yet)
        const hbRes = await fetch(`/api/heartbeat?agentId=${id}`)
        const hbData = hbRes.ok ? await hbRes.json() : null
        if (!cancelled) {
          setHb(hbData?.heartbeat ?? {
            frequency: '3h',
            enabled: true,
            lastHeartbeat: null,
            nextHeartbeat: null,
          })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const setFrequency = async (freq: string) => {
    if (!agentId || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          frequency: freq === 'off' ? '3h' : freq,
          enabled: freq !== 'off',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setHb(data.heartbeat)
      }
    } catch {
      setError('Failed to save heartbeat settings')
    } finally {
      setSaving(false)
    }
  }

  const activeFreq = hb?.enabled === false ? 'off' : (hb?.frequency || '3h')

  return (
    <DashboardShell>
      <DashboardHeader
        title="Heartbeat Monitor"
        icon={<Activity className="h-5 w-5 text-zinc-500" />}
      />

      <DashboardContent className="space-y-px max-w-2xl">
        {/* Error */}
        {error && (
          <div className="border border-red-800 bg-zinc-950 p-4 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <EmptyState
            icon={<Activity className="h-8 w-8 text-zinc-600 animate-pulse" />}
            title="Loading heartbeat data…"
          />
        )}

        {/* No agent deployed */}
        {!loading && !agentId && !error && (
          <EmptyState
            icon={<Wifi className="h-8 w-8 text-zinc-600" />}
            title="No agent deployed yet"
            description="Deploy your OpenClaw agent to monitor its heartbeat"
          />
        )}

        {/* Heartbeat card */}
        {agentId && hb && (
          <>
            {/* Status row */}
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">Agent Pulse</p>
                  <p className="text-[10px] text-zinc-600 font-mono">{agentId}</p>
                </div>
                <StatusPill
                  status={hb.enabled ? 'active' : 'idle'}
                  label={hb.enabled ? 'On schedule' : 'Paused'}
                />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Last seen
                  </div>
                  <div className="text-sm text-zinc-300">{formatRelative(hb.lastHeartbeat)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Next in</div>
                  <div className="text-sm text-zinc-300">{formatNext(hb.nextHeartbeat, hb.enabled)}</div>
                </div>
              </div>

              {/* Frequency selector */}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Frequency</div>
                <div className="flex gap-2 flex-wrap">
                  {FREQS.map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      disabled={saving}
                      className={`border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 ${
                        activeFreq === freq
                          ? 'bg-white text-black border-white'
                          : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Credits */}
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex justify-between text-xs mb-3">
                <span className="text-zinc-400 uppercase tracking-widest">Daily heartbeat pool</span>
                <span className="text-zinc-400">200 of 200 remaining</span>
              </div>
              <div className="h-1.5 bg-zinc-800 overflow-hidden">
                <div className="h-full bg-white" style={{ width: '0%' }} />
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">
                Separate from your daily credits — heartbeats never eat into your quota.
              </p>
            </div>
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
