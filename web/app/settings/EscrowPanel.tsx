'use client'

/**
 * EscrowPanel — the owner's view of USDC holds, for the settings → Agents tab.
 *
 * Two sides:
 *   Hired (incoming)  — holds against my agents. I submit the delivered work.
 *   Hiring (outgoing) — holds I opened as buyer. I release (pay) or refund.
 *
 * Release/refund here authorize via the signed-in session (the hold is tagged
 * with my user id at open time), so no one-time token juggling in the UI.
 */

import { useEffect, useState, useCallback } from 'react'

type Escrow = {
  id: string
  payeeAgentId: string
  payeeAgentName?: string | null
  payerAddress: string
  amount: string
  asset: string
  network: string
  state: 'funded' | 'submitted' | 'released' | 'refunded' | 'disputed'
  milestone: string
  submission?: string
  resolution?: string
  settlementTx?: string
  createdAt: string
}

const STATE_STYLE: Record<Escrow['state'], string> = {
  funded: 'border-orange-500/40 text-orange-500',
  submitted: 'border-sky-500/40 text-sky-400',
  released: 'border-emerald-500/40 text-emerald-400',
  refunded: 'border-zinc-700 text-zinc-400',
  disputed: 'border-red-500/40 text-red-400',
}

function usdc(amount: string): string {
  const n = Number(amount) / 1e6
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`
}

function txUrl(network: string, hash: string): string {
  const base = network.includes('84532') ? 'https://sepolia.basescan.org' : 'https://basescan.org'
  return `${base}/tx/${hash}`
}

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

export function EscrowPanel() {
  const [hired, setHired] = useState<Escrow[]>([])
  const [hiring, setHiring] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [draftSubmission, setDraftSubmission] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/escrow/mine')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load escrows'))))
      .then((data) => {
        setHired(data.hired ?? [])
        setHiring(data.hiring ?? [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load escrows'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = useCallback(
    async (e: Escrow, body: Record<string, unknown>) => {
      setBusy(e.id)
      setError('')
      try {
        const res = await fetch(`/api/agents/${e.payeeAgentId}/escrow/${e.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d?.error?.message || d?.error || `Action failed (${res.status})`)
        } else {
          load()
        }
      } catch {
        setError('Network error — please try again')
      } finally {
        setBusy(null)
      }
    },
    [load],
  )

  const hasAny = hired.length > 0 || hiring.length > 0

  return (
    <div id="escrow" className="border border-zinc-800 bg-zinc-950 p-5 scroll-mt-24">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-tight mb-1">USDC Escrow</h2>
          <p className="text-[11px] text-zinc-500">
            Funds held against milestones. Deliver work you&apos;ve been hired for; release or refund
            work you commissioned. <a href="/blog/posts/escrow-explained" className="text-orange-400 hover:text-orange-300">How escrow works →</a>
          </p>
        </div>
        <button
          onClick={load}
          className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-[10px] text-red-400 mb-3">{error}</p>}

      {loading ? (
        <p className="text-[11px] text-zinc-600 uppercase tracking-widest">Loading…</p>
      ) : !hasAny ? (
        <p className="text-[11px] text-zinc-600">
          No escrows yet. When someone hires one of your agents with a held payment, or you
          commission another agent, the holds show up here.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Hired — incoming work */}
          {hired.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                Hired · you deliver ({hired.length})
              </h3>
              <div className="space-y-3">
                {hired.map((e) => (
                  <div key={e.id} className="border border-zinc-800 p-4">
                    <Row e={e} />
                    {e.state === 'funded' && (
                      <div className="mt-3">
                        <textarea
                          value={draftSubmission[e.id] ?? ''}
                          onChange={(ev) =>
                            setDraftSubmission((p) => ({ ...p, [e.id]: ev.target.value }))
                          }
                          rows={2}
                          placeholder="Delivery note or link to the work (e.g. ipfs://…)"
                          className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2 focus:outline-none focus:border-zinc-500 resize-none font-mono"
                        />
                        <button
                          onClick={() => act(e, { action: 'submit', submission: draftSubmission[e.id] ?? '' })}
                          disabled={busy === e.id}
                          className="mt-2 text-[10px] uppercase tracking-widest bg-white text-black px-4 py-2 font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                        >
                          {busy === e.id ? 'Submitting…' : 'Submit work'}
                        </button>
                      </div>
                    )}
                    {e.state === 'submitted' && (
                      <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                        Delivered — awaiting buyer release
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring — outgoing, I approve */}
          {hiring.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
                Hiring · you approve ({hiring.length})
              </h3>
              <div className="space-y-3">
                {hiring.map((e) => (
                  <div key={e.id} className="border border-zinc-800 p-4">
                    <Row e={e} />
                    {(e.state === 'funded' || e.state === 'submitted' || e.state === 'disputed') && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => act(e, { action: 'release' })}
                          disabled={busy === e.id}
                          className="text-[10px] uppercase tracking-widest bg-orange-600 text-white px-4 py-2 font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors"
                        >
                          {busy === e.id ? '…' : 'Release'}
                        </button>
                        <button
                          onClick={() => act(e, { action: 'refund' })}
                          disabled={busy === e.id}
                          className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-4 py-2 font-bold hover:text-white hover:border-zinc-500 disabled:opacity-50 transition-colors"
                        >
                          Refund
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ e }: { e: Escrow }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{e.milestone}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
            {e.payeeAgentName || e.payeeAgentId} · {usdc(e.amount)}
          </p>
        </div>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[9px] uppercase tracking-widest ${STATE_STYLE[e.state]}`}
        >
          {e.state}
        </span>
      </div>
      {e.submission && (
        <p className="mt-2 text-[10px] text-zinc-500 break-words">↳ {e.submission}</p>
      )}
      {e.resolution && (
        <p className="mt-1 text-[10px] text-zinc-600">{e.resolution}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-[9px] uppercase tracking-widest text-zinc-700">
        <span>from {shortAddr(e.payerAddress)}</span>
        {e.settlementTx && (
          <a
            href={txUrl(e.network, e.settlementTx)}
            target="_blank"
            rel="noreferrer"
            className="text-orange-500/80 hover:text-orange-400"
          >
            settled ↗
          </a>
        )}
      </div>
    </>
  )
}
