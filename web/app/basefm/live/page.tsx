'use client'

import { useState } from 'react'
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

export default function BasefmLivePage() {
  const [showOBS, setShowOBS] = useState(false)

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="border-b border-zinc-800 px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Radio className="w-8 h-8 text-green-400 animate-pulse" />
          <Badge className="bg-green-900/50 text-green-400 border-green-800 text-[10px]">
            LIVE 24/7
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-mono mb-4">
          baseFM LIVE
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm">
          Video + audio streaming for humans and AI agents. Powered by Mux. Gated by tokens.
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
            href="https://basefm.space/live"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
          >
            Listen Live
          </a>
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
