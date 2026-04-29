'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, XCircle, Clock, Radio } from 'lucide-react'

interface Campaign {
  id:               string
  advertiser_name:  string
  advertiser_email: string
  advertiser_url:   string | null
  contact_handle:   string | null
  title:            string
  description:      string | null
  category:         string
  slot_type:        string
  scheduled_slots:  number
  broadcasts_done:  number
  starts_at:        string | null
  ends_at:          string | null
  amount_pence:     number | null
  status:           string
  admin_notes:      string | null
  playback_id:      string | null
  mux_upload_id:    string | null
  created_at:       string
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-zinc-500',
  paid:            'text-amber-400',
  approved:        'text-orange-400',
  live:            'text-green-400',
  complete:        'text-zinc-500',
  rejected:        'text-red-400',
  refunded:        'text-zinc-500',
}

function fmt(pence: number | null) {
  if (!pence) return '—'
  return `£${(pence / 100).toFixed(2)}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CampaignRow({ c, onAction }: { c: Campaign; onAction: () => void }) {
  const [loading,     setLoading]     = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [notes,       setNotes]       = useState(c.admin_notes || '')
  const [expanded,    setExpanded]    = useState(false)

  async function act(action: string, extra?: Record<string, unknown>) {
    setLoading(true)
    await fetch(`/api/ads/campaigns/${c.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, notes, ...extra }),
    })
    onAction()
    setLoading(false)
  }

  return (
    <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/80">
      <button
        className="w-full px-5 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{c.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{c.advertiser_name} · {c.advertiser_email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${STATUS_COLORS[c.status] || 'text-zinc-400'}`}>
              {c.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-zinc-600">{fmt(c.amount_pence)}</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-600">
          <span className="uppercase tracking-[0.14em]">{c.slot_type}</span>
          <span>{c.scheduled_slots} slots · {c.broadcasts_done} done</span>
          <span className="capitalize">{c.category}</span>
          <span>{fmtDate(c.created_at)}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-5 pb-5 pt-4 space-y-4">
          {c.description && (
            <p className="text-xs text-zinc-400">{c.description}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 text-xs text-zinc-500">
            {c.advertiser_url  && <span>URL: <a href={c.advertiser_url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{c.advertiser_url}</a></span>}
            {c.contact_handle  && <span>Handle: {c.contact_handle}</span>}
            {c.playback_id     && <span>Playback: <a href={`https://stream.mux.com/${c.playback_id}.m3u8`} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Play</a></span>}
            {c.mux_upload_id   && <span className="font-mono">Upload: {c.mux_upload_id}</span>}
            <span>Starts: {fmtDate(c.starts_at)}</span>
            <span>Ends: {fmtDate(c.ends_at)}</span>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white resize-none focus:border-zinc-600 focus:outline-none"
            />
          </div>

          {c.status === 'paid' && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1">Broadcast Start Date</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => act('approve', scheduleDate ? { startsAt: scheduleDate } : {})}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300 transition-colors hover:border-green-400/60 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  onClick={() => act('reject')}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition-colors hover:border-red-400/60 disabled:opacity-50"
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {c.status === 'live' && (
            <button
              onClick={() => act('complete')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-600"
            >
              <CheckCircle className="h-3 w-3" />
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [filter,    setFilter]    = useState('all')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/ads/campaigns')
    if (res.status === 403) { setError('Admin access required'); setLoading(false); return }
    if (!res.ok)            { setError('Failed to load campaigns'); setLoading(false); return }
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const statuses = ['all', 'pending_payment', 'paid', 'approved', 'live', 'complete', 'rejected']
  const visible  = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter)

  const stats = {
    paid:     campaigns.filter((c) => c.status === 'paid').length,
    approved: campaigns.filter((c) => c.status === 'approved').length,
    live:     campaigns.filter((c) => c.status === 'live').length,
    revenue:  campaigns.filter((c) => !['pending_payment', 'rejected'].includes(c.status))
      .reduce((sum, c) => sum + (c.amount_pence ?? 0), 0),
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Ad Campaigns</h1>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-zinc-600" />
            <span className="text-xs text-zinc-500">{campaigns.length} total</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Awaiting Review', value: stats.paid,     color: 'text-amber-400' },
            { label: 'Approved',        value: stats.approved, color: 'text-orange-400'  },
            { label: 'Live Now',        value: stats.live,     color: 'text-green-400' },
            { label: 'Revenue',         value: fmt(stats.revenue), color: 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-[20px] border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{label}</p>
              <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                filter === s
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-zinc-800 px-6 py-12 text-center">
            <Clock className="mx-auto h-7 w-7 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No campaigns in this state.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((c) => (
              <CampaignRow key={c.id} c={c} onAction={load} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
