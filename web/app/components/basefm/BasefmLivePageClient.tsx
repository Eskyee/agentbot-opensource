'use client'

import type { ReactNode } from 'react'
import { useState, useTransition } from 'react'
import { Clock, ExternalLink, Mic, Shield, Users, Video, Zap } from 'lucide-react'
import Link from 'next/link'
import { BasefmLivePlayer, type LiveResponse } from '@/components/basefm/BasefmLivePlayer'

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
    desc: 'Hold $BASEFM or Solana Agentbot tokens for access. Community-first.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Global Audience',
    desc: '24/7 station. Listeners worldwide. Build your fanbase on Base.',
  },
]

const ACCESS_OPTIONS = [
  {
    method: '$BASEFM Token',
    requirement: '2,500,000 $BASEFM on Base',
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

export function BasefmLivePageClient({
  initialLiveData,
  initialError,
}: {
  initialLiveData: LiveResponse | null
  initialError: string | null
}) {
  const [showOBS, setShowOBS] = useState(false)
  const [isPending, startTransition] = useTransition()

  const toggleOBS = () => {
    startTransition(() => {
      setShowOBS(!showOBS)
    })
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 px-6 py-16 text-center">
        <BasefmLivePlayer
          title="🎧 baseFM Live"
          subtitle="Strictly Factory. 24/7 Autonomous Curation. AI-powered autonomous radio on Base that auto-plays the main stream when a DJ is live."
          minimal
          initialData={initialLiveData}
          initialError={initialError}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section>
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">What You Can Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="border border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
                <div className="text-green-400 mb-3">{feature.icon}</div>
                <h3 className="text-sm font-bold mb-1">{feature.title}</h3>
                <p className="text-zinc-500 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-zinc-800 p-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">How To Broadcast</h2>

          {/* Signal path: access → decks → encoder → station → world */}
          <div className="mb-8 border border-zinc-900 bg-black p-4 overflow-x-auto">
            <svg viewBox="0 0 900 150" className="w-full min-w-[600px]" role="img" aria-label="Broadcast signal path: unlock access with a token, run your normal decks and mixer, send the master into an encoder (OBS for humans, ffmpeg for agent DJs), which streams via your broadcast key to the baseFM station, where a global audience tunes in." xmlns="http://www.w3.org/2000/svg">
              {[
                { x: 6, t: 'ACCESS', s: 'token-gated', accent: false },
                { x: 186, t: 'DECKS + MIXER', s: 'Pioneer / Rekordbox', accent: false },
                { x: 366, t: 'ENCODER', s: 'OBS · ffmpeg', accent: false },
              ].map((n, i) => (
                <g key={n.t}>
                  <rect x={n.x} y="46" width="150" height="58" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                  <text x={n.x + 75} y="70" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="9" fill="#a1a1aa" letterSpacing="1">{n.t}</text>
                  <text x={n.x + 75} y="88" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" fill="#52525b">{n.s}</text>
                  {i < 3 && <><line x1={n.x + 150} y1="75" x2={n.x + 182} y2="75" stroke="#3f3f46" strokeWidth="1" /><polygon points={`${n.x + 178},71 ${n.x + 186},75 ${n.x + 178},79`} fill="#3f3f46" /></>}
                </g>
              ))}
              {/* encoder -> station (broadcast key) */}
              <line x1="516" y1="75" x2="552" y2="75" stroke="#22c55e" strokeWidth="1.5" />
              <polygon points="548,71 556,75 548,79" fill="#22c55e" />
              <text x="534" y="64" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7" fill="#22c55e">RTMP key</text>
              {/* station */}
              <rect x="558" y="38" width="160" height="74" fill="#09090b" stroke="#22c55e" strokeWidth="1.5" />
              <text x="638" y="66" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="12" fill="#ffffff" letterSpacing="1.5" fontWeight="bold">baseFM</text>
              <text x="638" y="82" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" fill="#22c55e">Mux · live player</text>
              <text x="638" y="96" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7" fill="#52525b">auto pickup</text>
              <line x1="718" y1="75" x2="750" y2="75" stroke="#3f3f46" strokeWidth="1" />
              <polygon points="746,71 754,75 746,79" fill="#3f3f46" />
              {/* global */}
              <rect x="756" y="46" width="138" height="58" fill="#09090b" stroke="#27272a" strokeWidth="1" />
              <text x="825" y="70" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="9" fill="#a1a1aa" letterSpacing="1">GLOBAL</text>
              <text x="825" y="88" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" fill="#52525b">24/7 listeners</text>
              {/* human / agent split note under encoder */}
              <text x="441" y="128" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7" fill="#52525b">OBS = humans · ffmpeg = agent DJs</text>
            </svg>
          </div>

          <div className="space-y-4">
            <Step index="1" title="Get Access" body="Hold the baseFM token on Base, or claim your Agentbot token perks on Solana. Both unlock the station path." />
            <Step index="2" title="Decks + Mixer" body="Keep your normal Pioneer / Rekordbox workflow for track selection, cueing, EQ, loops, and transitions." />
            <Step index="3" title="Broadcast Key" body="Hit &quot;Go Live&quot; in the DJ dashboard. Agentbot gives you the RTMP target, playback ID, and encoder path." />
            <Step index="4" title="Program Feed" body="Use OBS for humans, or the provided ffmpeg command for agent DJs. Send the mixer master out into the station path and the live player will pick it up automatically." />
          </div>
          <div className="mt-6">
            <a
              href="/dashboard/dj-stream"
              className="inline-block bg-green-600 hover:bg-green-500 text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
            >
              Open DJ Dashboard →
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">Access Options</h2>
          <div className="space-y-3">
            {ACCESS_OPTIONS.map((option) => (
              <div key={option.method} className="border border-zinc-800 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">{option.method}</h3>
                  <p className="text-zinc-500 text-xs">{option.requirement}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">{option.chain}</span>
                  <Badge className="bg-green-900/50 text-green-400 border-green-800 text-[10px]">{option.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            <Link href="/claim" className="underline hover:text-white">Claim Solana Agentbot credits</Link> for free streaming access.
          </div>
        </section>

        <section className="border border-zinc-800 p-6">
          <button
            onClick={toggleOBS}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-bold uppercase tracking-tighter font-mono">Encoder / OBS Settings</h2>
            <span className="text-zinc-500 text-xs">{isPending ? '...' : showOBS ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showOBS ? (
            <div className="mt-6 space-y-6">
              <div className="border border-zinc-800 p-4">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Pioneer Mental Model</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Keep deck control, cueing, beatmatch, EQ, and performance pads in Rekordbox or on your Pioneer hardware.
                  Agentbot sits after the mixer as the station and relay layer.
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Video</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(OBS_SETTINGS.video).map(([key, value]) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 p-3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">{key}</span>
                      <span className="text-sm font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Audio</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(OBS_SETTINGS.audio).map(([key, value]) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 p-3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">{key}</span>
                      <span className="text-sm font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border border-zinc-800 bg-zinc-900/50">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Program Feed Target</h3>
                <code className="text-green-400 text-sm break-all">rtmp://global-live.mux.com:5222/app</code>
                <p className="text-zinc-600 text-xs mt-2">The DJ dashboard also provides an ffmpeg broadcaster command for agent DJs and relay controls for downstream destinations.</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="border border-zinc-800 p-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-6">Tokens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-800 p-4">
              <h3 className="text-sm font-bold mb-2 text-green-400">$BASEFM (Base)</h3>
              <code className="text-zinc-500 text-xs break-all">0x9a4376bab717ac0a3901eeed8308a420c59c0ba3</code>
              <p className="text-zinc-600 text-xs mt-2">Gates live streaming. Required for DJ access.</p>
            </div>
            <div className="border border-zinc-800 p-4">
              <h3 className="text-sm font-bold mb-2 text-orange-400">$AGENTBOT (Base)</h3>
              <code className="text-zinc-500 text-xs break-all">0x986b41c76ab8b7350079613340ee692773b34ba3</code>
              <p className="text-zinc-600 text-xs mt-2">Powers AI agent infrastructure. Trade on Uniswap.</p>
              <a href="/token" className="text-orange-400 text-xs hover:underline mt-2 inline-block">View token page →</a>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-zinc-900">
           <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-zinc-500 text-xs hover:text-white flex items-center gap-1">basefm.space <ExternalLink className="w-3 h-3" />
          </a>
          <a href="/dashboard/dj-stream" className="text-zinc-500 text-xs hover:text-white">DJ Dashboard</a>
        </div>
      </div>
    </main>
  )
}

function Step({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full border border-green-500 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">{index}</div>
      <div>
        <h3 className="text-sm font-bold mb-1">{title}</h3>
        <p className="text-zinc-500 text-xs">{body}</p>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 border rounded text-[10px] uppercase tracking-widest ${className || ''}`}>
      {children}
    </span>
  )
}
