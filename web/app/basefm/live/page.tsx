'use client'

import { useEffect, useState } from 'react'
import { Mic, Video, Radio, Music, Users, Zap, Clock, Shield, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: <Video className="w-5 h-5" />,
    title: 'Live Video + Audio',
    desc: 'Stream live video and audio powered by Mux. 720p/1080p, crystal clear.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: '2-Hour Sessions',
    desc: 'Max 2 hours per session. Start fresh anytime. Keep the energy flowing.',
  },
  {
    icon: <Mic className="w-5 h-5" />,
    title: 'Human DJs',
    desc: 'Connect your deck, mixer, or camera. Go live for the global community.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Agent DJs',
    desc: 'AI agents stream autonomously. Give them a vibe, they handle the rest.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Token-Gated',
    desc: 'Hold $RAVE or Solana Agentbot tokens for access. Community-first.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Global Audience',
    desc: '24/7 station. Listeners worldwide. Build your fanbase on Base.',
  },
]

const ACCESS_OPTIONS = [
  {
    method: '$RAVE Token',
    requirement: '1,250,000 $RAVE on Base',
    chain: 'Base',
    status: 'Live',
  },
  {
    method: 'Agentbot Community',
    requirement: 'Builder or Whale claim (Solana)',
    chain: 'Solana → Base',
    status: 'Live',
  },
  {
    method: 'Guest Pass',
    requirement: 'Community program member',
    chain: 'Base',
    status: 'Live',
  },
]

const OBS_SETTINGS = {
  video: {
    resolution: '1280x720 or 1920x1080',
    bitrate: '2500-4500 kbps',
    fps: '30',
    encoder: 'H.264',
    keyframe: '2 seconds',
  },
  audio: {
    bitrate: '256-320 kbps',
    encoder: 'AAC',
    sampleRate: '44.1 kHz',
    channels: 'Stereo',
  },
}

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

export default function BasefmLivePage() {
  const [showOBS, setShowOBS] = useState(false)
  const [liveData, setLiveData] = useState<LiveResponse | null>(null)
  const [loadingLive, setLoadingLive] = useState(true)
  const [liveError, setLiveError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadLive = async () => {
      try {
        const response = await fetch('/api/basefm/live', { cache: 'no-store' })
        const data = await response.json()

        if (!active) return

        if (!response.ok && !data?.primaryDj) {
          throw new Error(data?.error || 'Unable to load baseFM live state')
        }

        setLiveData(data)
        setLiveError(data?.error || null)
      } catch (error) {
        if (!active) return
        setLiveError(error instanceof Error ? error.message : 'Unable to load baseFM live state')
      } finally {
        if (active) setLoadingLive(false)
      }
    }

    loadLive()
    const interval = setInterval(loadLive, 15000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const primaryDj = liveData?.primaryDj || null
  const liveDjs = liveData?.djs || []
  const stationLive = Boolean(primaryDj?.embedUrl)

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="border-b border-zinc-800 px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Radio className={`w-8 h-8 ${stationLive ? 'text-green-400 animate-pulse' : 'text-zinc-500'}`} />
          <Badge className={stationLive ? 'bg-green-900/50 text-green-400 border-green-800 text-[10px]' : 'bg-zinc-900 text-zinc-400 border-zinc-700 text-[10px]'}>
            {stationLive ? 'ON AIR' : 'STANDBY'}
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-mono mb-4">
          baseFM LIVE
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm">
          Video + audio streaming for humans and AI agents, surfaced live on BaseFM with Mux underneath.
          Underground radio on Base.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <a
            href="/dashboard/dj-stream"
            className="bg-green-600 hover:bg-green-500 text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
          >
            Start Streaming →
          </a>
          <a
            href={primaryDj?.embedUrl || '#live-player'}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
          >
            {stationLive ? 'Watch Live' : 'Live Player'}
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section id="live-player" className="border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Now Playing</p>
              <h2 className="mt-2 text-2xl font-bold uppercase tracking-tighter font-mono">
                {primaryDj ? primaryDj.name : loadingLive ? 'Loading live station' : 'No DJ live right now'}
              </h2>
            </div>
            <Badge className={stationLive ? 'bg-green-900/50 text-green-400 border-green-800 text-[10px]' : 'bg-zinc-900 text-zinc-400 border-zinc-700 text-[10px]'}>
              {stationLive ? `${liveData?.count || 1} LIVE` : 'OFF AIR'}
            </Badge>
          </div>

          {stationLive && primaryDj?.embedUrl ? (
            <div className="space-y-4">
              <div className="overflow-hidden border border-zinc-800 bg-black aspect-video">
                <iframe
                  src={primaryDj.embedUrl}
                  title={`baseFM live stream for ${primaryDj.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">DJ</div>
                  <div className="mt-2 text-sm font-bold text-white">{primaryDj.name}</div>
                </div>
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Playback</div>
                  <div className="mt-2 text-xs font-mono text-zinc-300 break-all">{primaryDj.playbackId}</div>
                </div>
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Source</div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-zinc-300">
                    {primaryDj.source === 'mux' ? 'Mux live' : 'Session cache'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={primaryDj.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
                >
                  Open Player
                  <ExternalLink className="w-3 h-3" />
                </a>
                {primaryDj.hlsUrl ? (
                  <a
                    href={primaryDj.hlsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  >
                    HLS Feed
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 bg-black px-6 py-10 text-center">
              <p className="text-sm text-zinc-300">
                {loadingLive ? 'Checking the station…' : 'No live DJ is on air right now.'}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                When a DJ or agent goes live, the player appears here automatically.
              </p>
            </div>
          )}

          {liveError ? (
            <div className="mt-4 border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              {liveError}
            </div>
          ) : null}

          {liveDjs.length > 1 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {liveDjs.slice(1).map((dj) => (
                <div key={dj.id} className="border border-zinc-800 bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{dj.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                        {dj.source === 'mux' ? 'Live now' : 'Cached live state'}
                      </div>
                    </div>
                    {dj.embedUrl ? (
                      <a
                        href={dj.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 underline hover:text-white"
                      >
                        Watch
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Features Grid */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">What You Can Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
                <div className="text-green-400 mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-zinc-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Stream */}
        <section className="border border-zinc-800 p-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">How to Stream</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="text-sm font-bold mb-1">Get Access</h3>
                <p className="text-zinc-500 text-xs">Hold $RAVE tokens, claim Agentbot community credits, or get a guest pass.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="text-sm font-bold mb-1">Connect Wallet</h3>
                <p className="text-zinc-500 text-xs">Connect your Coinbase Wallet on Base. We verify your token balance automatically.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-sm font-bold mb-1">Get Stream Key</h3>
                <p className="text-zinc-500 text-xs">Hit &quot;Go Live&quot; on the dashboard. We give you an RTMP URL + stream key.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="text-sm font-bold mb-1">Open OBS & Stream</h3>
                <p className="text-zinc-500 text-xs">Paste the URL + key into OBS. Start streaming. 2-hour max per session.</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="/dashboard/dj-stream"
              className="inline-block bg-green-600 hover:bg-green-500 text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
            >
              Go to Dashboard →
            </a>
          </div>
        </section>

        {/* Access Options */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">Access Options</h2>
          <div className="space-y-3">
            {ACCESS_OPTIONS.map((opt) => (
              <div key={opt.method} className="border border-zinc-800 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">{opt.method}</h3>
                  <p className="text-zinc-500 text-xs">{opt.requirement}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">{opt.chain}</span>
                  <Badge className="bg-green-900/50 text-green-400 border-green-800 text-[10px]">{opt.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            <Link href="/claim" className="underline hover:text-white">Claim Solana Agentbot credits</Link> for free streaming access.
          </div>
        </section>

        {/* OBS Settings */}
        <section className="border border-zinc-800 p-6">
          <button
            onClick={() => setShowOBS(!showOBS)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold uppercase tracking-tighter font-mono">OBS Settings</h2>
            <span className="text-zinc-500 text-xs">{showOBS ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showOBS && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Video</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(OBS_SETTINGS.video).map(([key, val]) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 p-3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">{key}</span>
                      <span className="text-sm font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Audio</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(OBS_SETTINGS.audio).map(([key, val]) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 p-3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">{key}</span>
                      <span className="text-sm font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border border-zinc-800 bg-zinc-900/50">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Stream URL</h3>
                <code className="text-green-400 text-sm break-all">rtmp://global-live.mux.com:5222/app</code>
                <p className="text-zinc-600 text-xs mt-2">Stream key is generated when you go live from the dashboard.</p>
              </div>
            </div>
          )}
        </section>

        {/* Token Info */}
        <section className="border border-zinc-800 p-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">Tokens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-800 p-4">
              <h3 className="text-sm font-bold mb-2 text-green-400">$BASEFM (Base)</h3>
              <code className="text-zinc-500 text-xs break-all">0x9a4376bab717ac0a3901eeed8308a420c59c0ba3</code>
              <p className="text-zinc-600 text-xs mt-2">Gates live streaming. Required for DJ access.</p>
            </div>
            <div className="border border-zinc-800 p-4">
              <h3 className="text-sm font-bold mb-2 text-purple-400">Agentbot (Solana)</h3>
              <code className="text-zinc-500 text-xs break-all">9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump</code>
              <p className="text-zinc-600 text-xs mt-2">Community token. Holders get baseFM access + free credits.</p>
            </div>
          </div>
        </section>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-zinc-900">
          <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-zinc-500 text-xs hover:text-white flex items-center gap-1">
            basefm.space <ExternalLink className="w-3 h-3" />
          </a>
          <a href="/basefm" className="text-zinc-500 text-xs hover:text-white">$BASEFM Token</a>
          <a href="/claim" className="text-zinc-500 text-xs hover:text-white">Claim Credits</a>
          <a href="/dashboard/dj-stream" className="text-zinc-500 text-xs hover:text-white">DJ Dashboard</a>
        </div>
      </div>
    </main>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 border rounded text-[10px] uppercase tracking-widest ${className || ''}`}>
      {children}
    </span>
  )
}
