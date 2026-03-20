'use client'

import { useState } from 'react'
import Link from 'next/link'

interface StreamingPlatform {
  id: string
  name: string
  icon: string
  connected: boolean
  stats: { listeners: number; streams: number; revenue: string; topTrack: string }
}

const platforms: StreamingPlatform[] = [
  { id: 'spotify', name: 'Spotify', icon: '🟢', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'soundcloud', name: 'SoundCloud', icon: '🟠', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'bandcamp', name: 'Bandcamp', icon: '🔵', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'apple-music', name: 'Apple Music', icon: '🔴', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'beatport', name: 'Beatport', icon: '🟣', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'youtube-music', name: 'YouTube Music', icon: '⚪', connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
]

export default function StreamingPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState(platforms)

  const handleConnect = (id: string) => {
    setConnectedPlatforms(prev =>
      prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p)
    )
  }

  const totalListeners = connectedPlatforms.filter(p => p.connected).reduce((acc, p) => acc + p.stats.listeners, 0)
  const totalStreams = connectedPlatforms.filter(p => p.connected).reduce((acc, p) => acc + p.stats.streams, 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Streaming Integrations</h1>
              <p className="text-zinc-400 text-sm mt-1">Connect your streaming platforms to track performance</p>
            </div>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Back to Dashboard</Link>
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Connected Platforms</div>
              <div className="text-2xl font-bold text-white">{connectedPlatforms.filter(p => p.connected).length}/{connectedPlatforms.length}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Listeners</div>
              <div className="text-2xl font-bold text-green-400">{totalListeners.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Streams</div>
              <div className="text-2xl font-bold text-orange-400">{totalStreams.toLocaleString()}</div>
            </div>
          </div>

          {/* Platform Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedPlatforms.map(platform => (
              <div key={platform.id} className={`bg-zinc-900 rounded-xl p-5 border transition-colors ${platform.connected ? 'border-green-500/30' : 'border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h3 className="font-bold">{platform.name}</h3>
                      <span className={`text-xs ${platform.connected ? 'text-green-400' : 'text-zinc-500'}`}>
                        {platform.connected ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                  </div>
                </div>

                {platform.connected && (
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500">Listeners</div>
                      <div className="font-mono">{platform.stats.listeners.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Streams</div>
                      <div className="font-mono">{platform.stats.streams.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Revenue</div>
                      <div className="font-mono text-green-400">{platform.stats.revenue}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Top Track</div>
                      <div className="truncate">{platform.stats.topTrack}</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleConnect(platform.id)}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                    platform.connected
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {platform.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
            <p className="text-sm text-zinc-400">
              Streaming integrations require OAuth authentication with each platform. Your agent will automatically track plays, listeners, and royalties once connected.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
