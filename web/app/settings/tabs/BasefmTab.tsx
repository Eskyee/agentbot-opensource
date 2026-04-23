'use client'

import { useState, useEffect } from 'react'
import { Loader2, Radio, ExternalLink } from 'lucide-react'

interface DjStats {
  linked: boolean
  wallet: string | null
  dj: {
    name: string | null
    slug: string | null
    avatar: string | null
    followers: number
    genres: string[]
  } | null
  stats: {
    totalShows: number
    totalListeners: number
    totalTipsUsdc: number
    isLive: boolean
  } | null
  error?: string
}

export function BasefmTab() {
  const [wallet, setWallet]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [stats, setStats]       = useState<DjStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [walletRes, statsRes] = await Promise.all([
          fetch('/api/user/basefm-wallet'),
          fetch('/api/basefm/dj-stats'),
        ])
        if (walletRes.ok) {
          const d = await walletRes.json()
          setWallet(d.wallet || '')
        }
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
      } catch {}
      setLoadingStats(false)
    }
    load()
  }, [])

  async function save() {
    setError('')
    setSaving(true)
    const res = await fetch('/api/user/basefm-wallet', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ wallet: wallet.trim() || null }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Save failed')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Refresh stats
    const statsRes = await fetch('/api/basefm/dj-stats')
    if (statsRes.ok) setStats(await statsRes.json())
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">baseFM Identity</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Link your Base wallet to connect your baseFM DJ profile. Your agent can then broadcast autonomously, appear in the schedule, and post to the baseFM community on your behalf.
        </p>
      </div>

      {/* Wallet input */}
      <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/80 p-5 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Base Wallet Address</p>
        <div className="flex gap-2">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
          />
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:border-zinc-500 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <p className="text-[10px] text-zinc-600">
          Your Base wallet is the address you use to log into baseFM. Need one?{' '}
          <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400 underline underline-offset-2">
            Create a free account on baseFM →
          </a>
        </p>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading baseFM stats…
        </div>
      ) : stats?.linked ? (
        <div className="space-y-4">
          {/* DJ profile */}
          {stats.dj && (
            <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-center gap-3 mb-3">
                {stats.dj.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stats.dj.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-white">{stats.dj.name ?? stats.wallet}</p>
                  {stats.dj.genres.length > 0 && (
                    <p className="text-[10px] text-zinc-500">{stats.dj.genres.join(' · ')}</p>
                  )}
                </div>
                {stats.stats?.isLive && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {stats.dj.slug && (
                <a
                  href={`https://basefm.space/djs/${stats.dj.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-400 uppercase tracking-widest"
                >
                  <Radio className="h-3 w-3" />
                  View DJ profile
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          )}

          {/* Stats grid */}
          {stats.stats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Shows',     value: stats.stats.totalShows },
                { label: 'Listeners', value: stats.stats.totalListeners.toLocaleString() },
                { label: 'Tips USDC', value: `$${stats.stats.totalTipsUsdc.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[16px] border border-zinc-800 bg-zinc-950/80 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{label}</p>
                  <p className="mt-1.5 text-lg font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          )}

          {stats.error && (
            <p className="text-[11px] text-amber-400">baseFM stats temporarily unavailable — {stats.error}</p>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-zinc-800 px-6 py-10 text-center">
          <Radio className="mx-auto h-6 w-6 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No baseFM wallet linked yet</p>
          <p className="mt-1 text-[11px] text-zinc-600">Add your Base wallet above to see your DJ stats here</p>
        </div>
      )}
    </div>
  )
}
