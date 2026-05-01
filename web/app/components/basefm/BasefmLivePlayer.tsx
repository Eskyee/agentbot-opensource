'use client'

import { createElement, memo, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Radio } from 'lucide-react'
import { BASEFM_DEFAULT_STREAM_IMAGE } from '@/app/lib/basefmDjSkill'
import type { BasefmDistributionState, BasefmRelayStatus } from '@/app/lib/basefmDistribution'

export type LiveDj = {
  id: string
  name: string
  city: string | null
  wallet: string | null
  playbackId: string | null
  status: string
  startedAt: number | string
  source: 'mux' | 'session-cache'
  hlsUrl: string | null
  embedUrl: string | null
}

export type LiveResponse = {
  djs: LiveDj[]
  count: number
  primaryDj: LiveDj | null
  availability: 'live' | 'degraded'
  distribution?: BasefmDistributionState
  error?: string
}

const LIVE_REFRESH_MS = 30000
const MUX_PLAYER_STYLE = { width: '100%', height: '100%', border: '0' }

const StableMuxLiveSurface = memo(function StableMuxLiveSurface({
  playbackId,
  title,
}: {
  playbackId: string
  title: string
}) {
  return createElement('mux-player', {
    'playback-id': playbackId,
    'stream-type': 'live',
    'metadata-video-title': title,
    poster: `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`,
    'primary-color': '#22c55e',
    'accent-color': '#ffffff',
    muted: true,
    autoplay: 'muted',
    controls: true,
    style: MUX_PLAYER_STYLE,
  })
})

function statusColor(status: BasefmRelayStatus) {
  if (status === 'healthy') return 'bg-green-400'
  if (status === 'degraded') return 'bg-yellow-400'
  if (status === 'failed') return 'bg-red-400'
  if (status === 'pending') return 'bg-red-500'
  return 'bg-zinc-600'
}

export function BasefmLivePlayer({
  compact = false,
  title = 'baseFM Live',
  subtitle = 'Strictly Factory. 24/7 Autonomous Curation.',
  minimal = false,
  initialData = null,
  initialError = null,
}: {
  compact?: boolean
  title?: string
  subtitle?: string
  minimal?: boolean
  initialData?: LiveResponse | null
  initialError?: string | null
}) {
  const [liveData, setLiveData] = useState<LiveResponse | null>(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(initialError)
  const livePlaybackRef = useRef<string | null>(initialData?.primaryDj?.playbackId || null)

  useEffect(() => {
    if (document.querySelector('script[data-agentbot-mux-player]')) return
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player'
    script.async = true
    script.dataset.agentbotMuxPlayer = 'true'
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    livePlaybackRef.current = liveData?.primaryDj?.playbackId || null
  }, [liveData?.primaryDj?.playbackId])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/basefm/live', { cache: 'no-store' })
        const data = await res.json()
        if (!active) return

        const nextPrimaryDj = data?.primaryDj || null
        const nextStationLive = Boolean(nextPrimaryDj?.embedUrl)

        if (!res.ok && !nextPrimaryDj) {
          throw new Error(data?.error || 'Unable to load live station')
        }

        setLiveData((current) => {
          const currentStationLive = Boolean(current?.primaryDj?.embedUrl)

          if (currentStationLive && !nextStationLive) {
            return current
          }

          return data
        })
        setError(nextStationLive ? null : data?.error || null)
      } catch (err) {
        if (!active) return
        if (!livePlaybackRef.current) {
          setError(err instanceof Error ? err.message : 'Unable to load live station')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, LIVE_REFRESH_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const primaryDj = liveData?.primaryDj || null
  const stationLive = Boolean(primaryDj?.embedUrl)
  const listenerFacingError = stationLive ? null : error
  const player = stationLive && primaryDj?.playbackId
    ? (
        <StableMuxLiveSurface
          playbackId={primaryDj.playbackId}
          title={primaryDj.name}
        />
      )
    : null

  return (
    <section className={`border border-zinc-800 bg-zinc-950/80 ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'}`}>
      <div className={`flex flex-wrap gap-3 ${minimal ? 'flex-col items-center text-center' : 'items-center justify-between'}`}>
        <div className={minimal ? 'flex flex-col items-center' : ''}>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            <Radio className={`h-3.5 w-3.5 ${stationLive ? 'text-green-400' : 'text-zinc-600'}`} />
            {stationLive ? 'On Air' : 'Standby'}
          </div>
          <h2 className={`${compact ? 'mt-3 text-xl sm:text-2xl' : 'mt-3 text-2xl sm:text-4xl'} font-bold uppercase tracking-tighter text-white`}>
            {title}
          </h2>
          <p className={`mt-2 ${minimal ? 'max-w-xl' : 'max-w-2xl'} ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} text-zinc-400`}>
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
            <div className="relative h-full w-full">
              <img
                src={BASEFM_DEFAULT_STREAM_IMAGE}
                alt="baseFM standby artwork"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <div>
                  <p className="text-sm text-zinc-100">
                    {loading ? 'Checking the main stream…' : 'No live DJ is on air right now.'}
                  </p>
                  <p className="mt-2 text-xs text-zinc-300">
                    When a DJ or agent goes live, the player appears here automatically.
                  </p>
                </div>
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
            {primaryDj?.city ? (
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-green-300">
                {primaryDj.city}
              </div>
            ) : null}
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

          {liveData?.distribution ? (
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Distribution</div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400 uppercase tracking-widest">Agentbot</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor(liveData.distribution.firstParty.status)}`} />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-300">
                      {liveData.distribution.firstParty.status}
                    </span>
                  </div>
                </div>
                {liveData.distribution.relays.map((relay) => (
                  <div key={relay.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">
                      {relay.name}
                      {relay.required ? ' required' : ' optional'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColor(relay.status)}`} />
                      <span className="text-[10px] uppercase tracking-widest text-zinc-300">{relay.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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

          {listenerFacingError ? (
            <div className="border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              {listenerFacingError}
            </div>
          ) : null}
        </div>
        )}
      </div>

      {minimal && listenerFacingError ? (
        <div className="mt-4 border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          {listenerFacingError}
        </div>
      ) : null}

      {minimal && liveData?.distribution ? (
        <div className="mt-4 border border-zinc-800 bg-black p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Distribution</div>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest">Agentbot</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColor(liveData.distribution.firstParty.status)}`} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-300">
                  {liveData.distribution.firstParty.status}
                </span>
              </div>
            </div>
            {liveData.distribution.relays.map((relay) => (
              <div key={relay.key} className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 uppercase tracking-widest">
                  {relay.name}
                  {relay.required ? ' required' : ' optional'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusColor(relay.status)}`} />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-300">{relay.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
