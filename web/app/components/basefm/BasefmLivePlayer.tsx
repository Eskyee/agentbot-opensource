'use client'

import { createElement, useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Radio } from 'lucide-react'
import Script from 'next/script'

type LiveDj = {
  id: string
  name: string
  wallet: string | null
  playbackId: string | null
  status: string
  startedAt: number | string
  source: 'mux' | 'session-cache'
  hlsUrl: string | null
  embedUrl: string | null
}

type LiveResponse = {
  djs: LiveDj[]
  count: number
  primaryDj: LiveDj | null
  availability: 'live' | 'degraded'
  error?: string
}

export function BasefmLivePlayer({
  compact = false,
  title = 'baseFM Live',
  subtitle = 'Strictly Underground. 24/7 Autonomous Curation.',
  minimal = false,
}: {
  compact?: boolean
  title?: string
  subtitle?: string
  minimal?: boolean
}) {
  const [liveData, setLiveData] = useState<LiveResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/basefm/live', { cache: 'no-store' })
        const data = await res.json()
        if (!active) return

        if (!res.ok && !data?.primaryDj) {
          throw new Error(data?.error || 'Unable to load live station')
        }

        setLiveData(data)
        setError(data?.error || null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load live station')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const primaryDj = liveData?.primaryDj || null
  const stationLive = Boolean(primaryDj?.embedUrl)
  const player = stationLive && primaryDj?.playbackId
    ? createElement('mux-player', {
        'playback-id': primaryDj.playbackId,
        'stream-type': 'live',
        'metadata-video-title': primaryDj.name,
        'primary-color': '#22c55e',
        'accent-color': '#ffffff',
        muted: true,
        autoplay: 'muted',
        controls: true,
        style: { width: '100%', height: '100%', border: '0' },
      })
    : null

  return (
    <section className={`border border-zinc-800 bg-zinc-950/80 ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'}`}>
      <Script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" strategy="afterInteractive" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            <Radio className={`h-3.5 w-3.5 ${stationLive ? 'text-green-400' : 'text-zinc-600'}`} />
            {stationLive ? 'On Air' : 'Standby'}
          </div>
          <h2 className={`${compact ? 'mt-3 text-xl sm:text-2xl' : 'mt-3 text-2xl sm:text-4xl'} font-bold uppercase tracking-tighter text-white`}>
            {title}
          </h2>
          <p className={`mt-2 max-w-2xl ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} text-zinc-400`}>
            {subtitle}
          </p>
        </div>

        <div className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
          stationLive
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-400'
        }`}>
          {stationLive ? `${liveData?.count || 1} Live` : loading ? 'Loading' : 'Off Air'}
        </div>
      </div>

      <div className={`mt-6 ${minimal ? '' : compact ? 'grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]' : 'grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]'}`}>
        <div className="overflow-hidden border border-zinc-800 bg-black aspect-video">
          {player ? (
            player
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm text-zinc-300">
                  {loading ? 'Checking the main stream…' : 'No live DJ is on air right now.'}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  When a DJ or agent goes live, the player appears here automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {minimal ? null : (
        <div className="space-y-4">
          <div className="border border-zinc-800 bg-black p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Now Playing</div>
            <div className="mt-2 text-lg font-bold text-white">
              {primaryDj?.name || (loading ? 'Loading stream' : 'Awaiting next selector')}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {primaryDj?.source === 'mux'
                ? 'Live directly from Mux'
                : primaryDj?.source === 'session-cache'
                  ? 'Recovered from session cache'
                  : 'The main stream wakes up automatically when a DJ starts broadcasting.'}
            </div>
          </div>

          <div className="border border-zinc-800 bg-black p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Access</div>
            <div className="mt-2 text-sm text-zinc-200">
              Hold <span className="font-bold text-white">$BASEFM</span> on Base or claim the <span className="font-bold text-white">Agentbot</span> Solana token perks to unlock DJ access.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/dj-stream"
              className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
            >
              Create Stream
            </Link>
            {primaryDj?.embedUrl ? (
              <a
                href={primaryDj.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Play Live
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {error ? (
            <div className="border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              {error}
            </div>
          ) : null}
        </div>
        )}
      </div>

      {minimal && error ? (
        <div className="mt-4 border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          {error}
        </div>
      ) : null}
    </section>
  )
}
