'use client'

import { useState, useEffect } from 'react'
import { Mic, Video, Radio, Music, Users, Zap, Clock, Shield, ExternalLink, Play, Pause } from 'lucide-react'
import Link from 'next/link'

interface LiveDJ {
  id: string
  name: string
  wallet: string | null
  playbackId: string | null
  status: string
  startedAt: number
  hlsUrl: string | null
  embedUrl: string | null
}

const FEATURES = [
  { icon: <Video className="w-5 h-5" />, title: 'Live Video + Audio', desc: 'Stream live video and audio powered by Mux. 720p/1080p, crystal clear.' },
  { icon: <Clock className="w-5 h-5" />, title: '2-Hour Sessions', desc: 'Max 2 hours per session. Start fresh anytime. Keep the energy flowing.' },
  { icon: <Mic className="w-5 h-5" />, title: 'Human DJs', desc: 'Connect your deck, mixer, or camera. Go live for the global community.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Agent DJs', desc: 'AI agents stream autonomously. Give them a vibe, they handle the rest.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Token-Gated', desc: 'Hold $RAVE or Solana Agentbot tokens for access. Community-first.' },
  { icon: <Users className="w-5 h-5" />, title: 'Global Audience', desc: '24/7 station. Listeners worldwide. Build your fanbase on Base.' },
]

export default function BasefmLivePage() {
  const [liveDJs, setLiveDJs] = useState<LiveDJ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDJ, setSelectedDJ] = useState<LiveDJ | null>(null)

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/basefm/live')
        if (res.ok) {
          const data = await res.json()
          setLiveDJs(data.djs || [])
          if (data.djs?.length > 0) {
            setSelectedDJ(data.djs[0])
          }
        }
      } catch (e) {
        console.error('Failed to fetch live DJs:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLive()
    // Refresh every 30 seconds
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [])

  const isLive = liveDJs.length > 0

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero with auto-playing player */}
      <div className="border-b border-zinc-800">
        {isLive && selectedDJ?.playbackId ? (
          /* LIVE PLAYER — auto-plays */
          <div className="max-w-5xl mx-auto">
            <div className="relative aspect-video bg-zinc-950">
              <iframe
                src={`https://stream.mux.com/${selectedDJ.playbackId}.html?autoplay=true&muted=false`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">LIVE</span>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-mono">{selectedDJ.name}</h2>
                <p className="text-zinc-500 text-xs">Streaming on baseFM</p>
              </div>
              {liveDJs.length > 1 && (
                <div className="flex gap-2">
                  {liveDJs.map((dj) => (
                    <button
                      key={dj.id}
                      onClick={() => setSelectedDJ(dj)}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                        selectedDJ.id === dj.id
                          ? 'border-green-500 text-green-400'
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {dj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NOBODY LIVE — show hero */
          <div className="px-6 py-16 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-8 h-8 text-zinc-600" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">OFFLINE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-mono mb-4">
              baseFM LIVE
            </h1>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">
              {loading ? 'Checking for live streams...' : 'No DJs live right now. Check back soon or go live yourself.'}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 pb-8 px-6">
          <a
            href="/dashboard/dj-stream"
            className="bg-green-600 hover:bg-green-500 text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
          >
            Start Streaming →
          </a>
          {!isLive && (
            <a
              href="https://basefm.space"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
            >
              Visit baseFM
            </a>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
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
                <h3 className="text-sm font-bold mb-1">Connect Your Setup</h3>
                <p className="text-zinc-500 text-xs">Use OBS, ffmpeg, or any RTMP encoder. Get your stream key from the dashboard.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-sm font-bold mb-1">Go Live</h3>
                <p className="text-zinc-500 text-xs">Start streaming. Your feed appears on baseFM automatically. 2-hour max sessions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Access Options */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">Access Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { method: '$RAVE Token', requirement: '1,250,000 $RAVE on Base', chain: 'Base', status: 'Live' },
              { method: 'Agentbot Community', requirement: 'Builder or Whale claim (Solana)', chain: 'Solana → Base', status: 'Live' },
              { method: 'Guest Pass', requirement: 'Community program member', chain: 'Base', status: 'Live' },
            ].map((opt) => (
              <div key={opt.method} className="border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">{opt.method}</h3>
                  <span className="text-[9px] uppercase tracking-widest text-green-400 border border-green-800 px-2 py-0.5">{opt.status}</span>
                </div>
                <p className="text-zinc-500 text-xs mb-2">{opt.requirement}</p>
                <p className="text-zinc-700 text-[10px] uppercase tracking-widest">{opt.chain}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
