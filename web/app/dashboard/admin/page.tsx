'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

interface RemoteAccessOption {
  type: string
  label: string
  description: string
  requiredFields: string[]
  optionalFields?: string[]
  setupSteps: string[]
}

interface RemoteAccessOptionsPayload {
  defaultType: string
  options: RemoteAccessOption[]
}

const statusColor: Record<ServiceStatus['status'], string> = {
  ok: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
}

export default function AdminDashboard() {
  const { data: session, status } = useCustomSession()
  const [summary, setSummary] = useState<SummaryPayload | null>(null)
  const [remoteAccess, setRemoteAccess] = useState<RemoteAccessOptionsPayload | null>(null)
  const [mimoApiKey, setMimoApiKey] = useState('')
  const [mimoGatewayToken, setMimoGatewayToken] = useState('')
  const [mimoDryRun, setMimoDryRun] = useState(false)
  const [mimoLoading, setMimoLoading] = useState(false)
  const [mimoResult, setMimoResult] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.email || (!session.user.isAdmin && !isAdminEmail(session.user.email))) {
      setError('Admin access required')
      return
    }
    setError('')
    setLoading(true)
    Promise.all([
      fetch('/api/admin/summary').then((res) => {
        if (!res.ok) throw new Error('Failed to load admin summary')
        return res.json()
      }),
      fetch('/api/remote-access/options').then((res) => {
        if (!res.ok) throw new Error('Failed to load remote access options')
        return res.json()
      }),
    ])
      .then(([summaryData, remoteAccessData]) => {
        setSummary(summaryData)
        setRemoteAccess(remoteAccessData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session, status])

  const agentStatuses = summary?.agents.totals ?? {}
  const recentErrors = summary?.agents.recentErrors ?? []

  const applyMimoConfig = async () => {
    setMimoLoading(true)
    setMimoResult(null)
    try {
      const response = await fetch('/api/admin/openclaw/mimo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: mimoApiKey,
          gatewayToken: mimoGatewayToken || undefined,
          dryRun: mimoDryRun,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'MiMo config failed')
      }
      setMimoResult(data)
      if (!mimoDryRun) {
        setMimoApiKey('')
      }
    } catch (err) {
      setMimoResult({
        success: false,
        error: err instanceof Error ? err.message : 'MiMo config failed',
      })
    } finally {
      setMimoLoading(false)
    }
  }

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

        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">Remote access</p>
              <h2 className="mt-2 text-lg font-bold uppercase tracking-tight text-white">User choice test panel</h2>
            </div>
            <Link
              href="/blog/posts/remote-access-for-agentbot-agents"
              className="text-[10px] uppercase tracking-[0.3em] text-orange-400 hover:text-white"
            >
              Read guide
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {remoteAccess?.options.map((option) => (
              <div key={option.type} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight text-white">{option.label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-zinc-600">{option.type}</p>
                  </div>
                  {option.type === remoteAccess.defaultType && (
                    <span className="rounded border border-zinc-700 px-2 py-1 text-[9px] uppercase tracking-widest text-zinc-400">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-400">{option.description}</p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">Required</div>
                <p className="mt-1 text-xs text-zinc-300">
                  {option.requiredFields.length ? option.requiredFields.join(', ') : 'None'}
                </p>
                {option.optionalFields?.length ? (
                  <>
                    <div className="mt-3 text-[10px] uppercase tracking-[0.25em] text-zinc-600">Optional</div>
                    <p className="mt-1 text-xs text-zinc-300">{option.optionalFields.join(', ')}</p>
                  </>
                ) : null}
                <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-zinc-600">Setup check</div>
                <ol className="mt-2 space-y-2 text-[11px] leading-5 text-zinc-400">
                  {option.setupSteps.slice(0, 3).map((step, index) => (
                    <li key={`${option.type}-${index}`}>{index + 1}. {step}</li>
                  ))}
                </ol>
              </div>
            ))}
            {!remoteAccess && (
              <div className="h-40 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
            )}
          </div>
        </section>

        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">OpenClaw admin runtime</p>
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight text-white">MiMo v2.5 config smoke test</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">
                  Paste the MiMo token-plan key at runtime. Agentbot updates your managed OpenClaw config on Railway,
                  restarts the service, and checks the gateway status. The key is never rendered back in the UI.
                </p>
              </div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                <input
                  type="checkbox"
                  checked={mimoDryRun}
                  onChange={(event) => setMimoDryRun(event.target.checked)}
                  className="h-4 w-4 accent-orange-500"
                />
                Dry run
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">MiMo API key</span>
                <input
                  type="password"
                  value={mimoApiKey}
                  onChange={(event) => setMimoApiKey(event.target.value)}
                  placeholder="tp-..."
                  className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">Gateway token override</span>
                <input
                  type="password"
                  value={mimoGatewayToken}
                  onChange={(event) => setMimoGatewayToken(event.target.value)}
                  placeholder="Optional; uses registration token if empty"
                  className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={applyMimoConfig}
                disabled={mimoLoading || !mimoApiKey.trim()}
                className="rounded border border-orange-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300 hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                {mimoLoading ? 'Testing...' : mimoDryRun ? 'Dry Run Config' : 'Apply + Smoke Test'}
              </button>
              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
                Primary model: xiaomi-coding/mimo-v2.5-pro
              </span>
            </div>

            {mimoResult && (
              <pre className="mt-5 max-h-64 overflow-auto rounded border border-zinc-800 bg-black p-3 text-[11px] text-zinc-300">
                {JSON.stringify(mimoResult, null, 2)}
              </pre>
            )}
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
