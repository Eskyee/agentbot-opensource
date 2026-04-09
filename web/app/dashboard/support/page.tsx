'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

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
  down: 'bg-red-500',
}

export default function SupportPlaybook() {
  const { data: session, status } = useCustomSession()
  const [summary, setSummary] = useState<DiagnosticSnapshot | null>(null)
  const [walletStatuses, setWalletStatuses] = useState<{
    address: string
    formatted: number
    healthy: boolean
    alertCommand: string
  }[]>([])
  const [walletMeta, setWalletMeta] = useState<{
    configured: boolean
    monitoredAddresses: string[]
    chain: string
    threshold: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

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

  const fetchWalletMonitor = useCallback(() => {
    if (!session?.user?.id) return
    setWalletLoading(true)
    fetch('/api/wallet-monitor/status')
      .then((res) => {
        if (!res.ok) throw new Error('Wallet monitor failed')
        return res.json()
      })
      .then((data) => {
        setWalletStatuses(data.statuses ?? [])
        setWalletMeta({
          configured: Boolean(data.configured),
          monitoredAddresses: Array.isArray(data.monitoredAddresses) ? data.monitoredAddresses : [],
          chain: data.chain || 'unknown',
          threshold: Number(data.threshold || 0),
        })
      })
      .catch((err) => setError(err.message || 'Failed to load wallet monitor'))
      .finally(() => setWalletLoading(false))
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
        <Breadcrumbs />
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
          <div className="mt-6 text-xs uppercase tracking-[0.3em] text-zinc-600">Running diagnostics...</div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">Wallet monitor</p>
            <button
              onClick={fetchWalletMonitor}
              className="px-3 py-2 border border-zinc-800 text-zinc-300 hover:text-white rounded uppercase tracking-[0.3em]"
            >
              {walletLoading ? 'Checking…' : 'Check balances'}
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            {walletMeta && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Monitor config</p>
                    <p className="text-xs text-zinc-300 mt-1">
                      {walletMeta.configured
                        ? `${walletMeta.chain} · threshold ${walletMeta.threshold} pathUSD · ${walletMeta.monitoredAddresses.length} wallet${walletMeta.monitoredAddresses.length === 1 ? '' : 's'}`
                        : 'No Tempo wallet addresses are configured'}
                    </p>
                  </div>
                </div>
                {walletMeta.monitoredAddresses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {walletMeta.monitoredAddresses.map((address) => (
                      <span
                        key={address}
                        className="border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono text-zinc-400"
                      >
                        {address}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {walletStatuses.length ? (
              walletStatuses.map((wallet) => (
                <div
                  key={wallet.address}
                  className={`rounded-lg border border-zinc-800 px-4 py-3 ${
                    wallet.healthy ? 'bg-zinc-950' : 'bg-red-950/40 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 uppercase tracking-[0.3em]">Wallet</span>
                    <span
                      className={`h-2 w-2 rounded-full ${wallet.healthy ? 'bg-emerald-400' : 'bg-red-500'}`}
                    />
                  </div>
                  <p className="text-sm font-mono text-white mt-2">{wallet.address}</p>
                  <p className="text-xs text-zinc-400 mt-1">{wallet.formatted.toFixed(2)} pathUSD</p>
                  {!wallet.healthy && (
                    <p className="text-[10px] text-red-300 mt-2">Low balance. {wallet.alertCommand}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-6 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                {walletLoading
                  ? 'Fetching wallet balances…'
                  : walletMeta && !walletMeta.configured
                    ? 'No Tempo wallet configured yet. Set TEMPO_NODE_WALLETS, TEMPO_FEE_PAYER_KEY, or MPP_FEE_PAYER_KEY.'
                    : 'No wallet data yet. Check balances to view statuses.'}
              </div>
            )}
          </div>
        </section>
      </div>
  )
}
