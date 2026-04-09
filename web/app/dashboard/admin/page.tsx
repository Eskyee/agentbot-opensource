'use client'

import { useEffect, useState } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'
import { isAdminEmail } from '@/app/lib/admin'

interface ServiceStatus {
  name: string
  status: 'ok' | 'degraded' | 'down'
  detail?: string
}

interface TrialExpiring {
  id: string
  email: string | null
  endsAt?: string | null
  daysLeft: number
}

interface SummaryPayload {
  serviceHealth: ServiceStatus[]
  trial: {
    active: number
    expiringSoon: TrialExpiring[]
  }
  agents: {
    totals: Record<string, number>
    recentErrors: Array<{ id: string; name: string; userId: string; updatedAt: string; status: string }>
  }
  timestamp: string
}

const statusColor: Record<ServiceStatus['status'], string> = {
  ok: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
}

export default function AdminDashboard() {
  const { data: session, status } = useCustomSession()
  const [summary, setSummary] = useState<SummaryPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      setError('Admin access required')
      return
    }
    setLoading(true)
    fetch('/api/admin/summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load admin summary')
        return res.json()
      })
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  const agentStatuses = summary?.agents.totals ?? {}
  const recentErrors = summary?.agents.recentErrors ?? []

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-black font-mono">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    )
  }

  return (
      <div className="px-6 py-8">
        <Breadcrumbs />
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">Admin control</p>
            <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight text-white">Platform summary</h1>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            {summary ? `Updated ${new Date(summary.timestamp).toLocaleTimeString()}` : 'waiting for data'}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-950/50 px-4 py-3 text-xs uppercase text-red-300">
            {error}
          </div>
        )}

        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">Service health</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {summary?.serviceHealth.map((service) => (
              <div key={service.name} className="border border-zinc-800 bg-zinc-950 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{service.name}</p>
                  <span className={`h-2 w-2 rounded-full ${statusColor[service.status]}`} />
                </div>
                <p className="mt-4 text-sm font-mono text-white">
                  {service.status === 'ok'
                    ? 'Operational'
                    : service.status === 'degraded'
                      ? 'Degraded'
                      : 'Down'}
                </p>
                {service.detail && (
                  <p className="text-[11px] text-zinc-500 mt-2">{service.detail}</p>
                )}
              </div>
            ))}
            {!summary && (
              <div className="col-span-3 h-24 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
            )}
          </div>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Trials</p>
            <div className="mt-3 text-3xl font-bold text-white">{summary?.trial.active ?? '—'}</div>
            <p className="text-[11px] text-zinc-500">Active 7-day trials</p>
            <div className="mt-4 text-xs uppercase tracking-widest text-zinc-400">
              Expiring soon
            </div>
            <ul className="mt-2 space-y-2 text-[11px] text-zinc-300">
              {summary?.trial.expiringSoon.length ? summary.trial.expiringSoon.map((trial) => (
                <li key={trial.id} className="flex items-center justify-between">
                  <span className="truncate pr-2">{trial.email || 'unknown'}</span>
                  <span>{trial.daysLeft}d</span>
                </li>
              )) : (
                <li className="text-zinc-600">None in the next 72h</li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Provisioning</p>
            <div className="mt-3 grid gap-3 text-xs font-bold uppercase tracking-[0.3em]">
              {Object.entries(agentStatuses).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-zinc-100">
                  <span>{status}</span>
                  <span>{count}</span>
                </div>
              ))}
              {!Object.keys(agentStatuses).length && (
                <div className="text-zinc-600">No agents yet</div>
              )}
            </div>
            <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-zinc-500">Recent errors</div>
            <ul className="mt-2 space-y-2 text-[11px] text-zinc-300">
              {recentErrors.length ? recentErrors.map((agent) => (
                <li key={agent.id} className="flex items-center justify-between">
                  <span className="truncate pr-2">{agent.name || agent.id}</span>
                  <span>{new Date(agent.updatedAt).toLocaleTimeString()}</span>
                </li>
              )) : (
                <li className="text-zinc-600">None</li>
              )}
            </ul>
          </div>
        </section>

        {loading && (
          <div className="animate-pulse text-xs uppercase tracking-[0.3em] text-zinc-600">
            Loading live data...
          </div>
        )}
      </div>
  )
}
