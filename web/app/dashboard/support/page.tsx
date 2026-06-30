'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'

interface ServiceStatus {
  name: string
  status: 'ok' | 'degraded' | 'down'
  detail?: string
}

interface DiagnosticSnapshot {
  serviceHealth: ServiceStatus[]
  trialCount: number
  tokenStatus: 'present' | 'missing'
  recentErrors: Array<{ id: string; name: string; updatedAt: string; status: string }>
  gatewayUrl: string
  timestamp: string
}

const statusColor: Record<ServiceStatus['status'], string> = {
  ok: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-orange-500',
}

export default function SupportPlaybook() {
  const { data: session, status } = useCustomSession()
  const [summary, setSummary] = useState<DiagnosticSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDiagnostics = useCallback(() => {
    if (!session?.user?.id) return
    setLoading(true)
    fetch('/api/support/diagnostics')
      .then((res) => {
        if (!res.ok) throw new Error('Diagnostics failed')
        return res.json()
      })
      .then((data) => {
        setSummary(data)
        setError('')
      })
      .catch((err) => setError(err.message || 'Failed to load diagnostics'))
      .finally(() => setLoading(false))
  }, [session])



  useEffect(() => {
    if (status === 'authenticated') {
      fetchDiagnostics()
    }
  }, [status, fetchDiagnostics])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-black font-mono">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    )
  }

  return (
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">Support playbook</p>
            <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight text-white">Live diagnostics</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em]">
            <button
              onClick={fetchDiagnostics}
              className="px-3 py-2 border border-zinc-800 text-zinc-300 hover:text-white rounded uppercase tracking-[0.3em]"
            >
              Refresh
            </button>
            {!summary ? 'Awaiting data' : `Updated ${new Date(summary.timestamp).toLocaleTimeString()}`}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-orange-500 bg-red-950/50 px-4 py-3 text-xs uppercase text-red-300">
            {error}
          </div>
        )}

        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">Service health</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {summary?.serviceHealth.map((service) => (
              <div key={service.name} className="border border-zinc-800 bg-zinc-950 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{service.name}</p>
                  <span className={`h-2 w-2 rounded-full ${statusColor[service.status]}`} />
                </div>
                <p className="mt-4 text-sm font-mono text-white">
                  {service.status === 'ok' ? 'Operational' : service.status === 'degraded' ? 'Degraded' : 'Down'}
                </p>
                {service.detail && <p className="text-[11px] text-zinc-500 mt-2">{service.detail}</p>}
              </div>
            ))}
            {!summary && (
              <div className="col-span-3 h-24 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Trials</p>
            <div className="mt-3 text-4xl font-bold tracking-tight text-white">{summary?.trialCount ?? '—'}</div>
            <p className="text-[11px] text-zinc-500">Active 7-day trials</p>
            <button
              onClick={() => window.open('/dashboard/admin', '_blank')}
              className="mt-4 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white"
            >
              Open admin summary
            </button>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Gateway token</p>
            <div className="mt-3 text-3xl font-bold tracking-tight text-white">
              {summary?.tokenStatus === 'present' ? 'Present' : 'Missing'}
            </div>
            <p className="text-[11px] text-zinc-500">
              {summary?.tokenStatus === 'present'
                ? 'Token available and trimmed.'
                : 'Token missing; auto-pair refresh is required.'}
            </p>
            <div className="mt-4 text-[10px] text-zinc-500">Gateway URL: {summary?.gatewayUrl}</div>
          </div>
        </section>

        {loading && (
          <div className="mt-6 text-xs uppercase tracking-[0.3em] text-zinc-500">Running diagnostics...</div>
        )}


      </div>
  )
}
