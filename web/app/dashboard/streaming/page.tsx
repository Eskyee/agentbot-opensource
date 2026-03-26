'use client';

import { useState } from 'react';
import { Radio, Music, Headphones, Disc3, Video } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

interface StreamingPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  stats: { listeners: number; streams: number; revenue: string; topTrack: string };
}

const platforms: StreamingPlatform[] = [
  { id: 'spotify', name: 'Spotify', icon: <Music className="h-5 w-5 text-green-400" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'soundcloud', name: 'SoundCloud', icon: <Headphones className="h-5 w-5 text-orange-400" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'bandcamp', name: 'Bandcamp', icon: <Disc3 className="h-5 w-5 text-blue-400" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'apple-music', name: 'Apple Music', icon: <Music className="h-5 w-5 text-red-400" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'beatport', name: 'Beatport', icon: <Radio className="h-5 w-5 text-purple-400" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
  { id: 'youtube-music', name: 'YouTube Music', icon: <Video className="h-5 w-5 text-zinc-300" />, connected: false, stats: { listeners: 0, streams: 0, revenue: '$0.00', topTrack: '-' } },
];

export default function StreamingPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState(platforms);

  const handleConnect = (id: string) => {
    setConnectedPlatforms(prev =>
      prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p)
    );
  };

  const totalListeners = connectedPlatforms.filter(p => p.connected).reduce((acc, p) => acc + p.stats.listeners, 0);
  const totalStreams = connectedPlatforms.filter(p => p.connected).reduce((acc, p) => acc + p.stats.streams, 0);

  return (
    <DashboardShell>
      <DashboardHeader title="Streaming Integrations" icon={<Radio className="h-5 w-5 text-pink-400" />} />
      <DashboardContent>
        {/* Aggregate Stats */}
        <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-3 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Connected Platforms</div>
            <div className="text-2xl font-bold tracking-tight">{connectedPlatforms.filter(p => p.connected).length}/{connectedPlatforms.length}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Total Listeners</div>
            <div className="text-2xl font-bold tracking-tight">{totalListeners.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Total Streams</div>
            <div className="text-2xl font-bold tracking-tight">{totalStreams.toLocaleString()}</div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
          {connectedPlatforms.map(platform => (
            <div key={platform.id} className="bg-zinc-950 border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {platform.icon}
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">{platform.name}</h3>
                    <StatusPill status={platform.connected ? 'active' : 'offline'} label={platform.connected ? 'Connected' : 'Not Connected'} size="sm" />
                  </div>
                </div>
              </div>

              {platform.connected && (
                <div className="grid grid-cols-2 gap-px bg-zinc-800 mb-4">
                  <div className="bg-zinc-950 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">Listeners</div>
                    <div className="text-sm font-mono mt-1">{platform.stats.listeners.toLocaleString()}</div>
                  </div>
                  <div className="bg-zinc-950 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">Streams</div>
                    <div className="text-sm font-mono mt-1">{platform.stats.streams.toLocaleString()}</div>
                  </div>
                  <div className="bg-zinc-950 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">Revenue</div>
                    <div className="text-sm font-mono text-green-400 mt-1">{platform.stats.revenue}</div>
                  </div>
                  <div className="bg-zinc-950 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">Top Track</div>
                    <div className="text-xs text-zinc-400 truncate mt-1">{platform.stats.topTrack}</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleConnect(platform.id)}
                className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  platform.connected
                    ? 'border border-red-500/30 text-red-400 hover:border-red-500'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {platform.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs text-zinc-500">
            Streaming integrations require OAuth authentication with each platform. Your agent will automatically track plays, listeners, and royalties once connected.
          </p>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
