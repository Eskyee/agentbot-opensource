'use client';

import { useState } from 'react';

type MusicType = 'ambient' | 'electronic' | 'acoustic' | 'beat' | 'custom';

interface MusicRequestBody {
  type: MusicType;
  prompt: string;
  duration: number;
  provider?: string;
}

export default function MusicGenerator() {
  const [type, setType] = useState<MusicType>('electronic');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [provider, setProvider] = useState('lyria');
  const [loading, setLoading] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMusic = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want the music to sound like');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const body: MusicRequestBody = {
        type,
        prompt,
        duration,
        provider,
      };
      
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to generate music');
      }
      
      setMusicUrl(data.url);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono px-6 py-32">
      <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-6">AI Music Generator</h1>
      <p className="text-zinc-400 mb-8">Create original music with Google Lyria or MiniMax. Powered by OpenClaw v2026.4.5</p>

      <div className="mb-4">
        <label className="block mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Music Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MusicType)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono"
        >
          <option value="ambient">Ambient / Atmospheric</option>
          <option value="electronic">Electronic / Techno</option>
          <option value="acoustic">Acoustic / Organic</option>
          <option value="beat">Beat / Hip Hop</option>
          <option value="custom">Custom Prompt</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono"
        >
          <option value="lyria">Google Lyria</option>
          <option value="minimax">MiniMax</option>
          <option value="comfy">ComfyUI Workflow</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Duration (seconds)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 font-mono"
        >
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">60 seconds</option>
          <option value="90">90 seconds</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the music you want... e.g., 'upbeat techno with pulsing bass and ethereal synths'"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono h-32"
        />
      </div>

      {error && (
        <div className="border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={generateMusic}
        disabled={loading}
        className="w-full bg-white text-black p-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
      >
        {loading ? 'Generating...' : 'Generate Music'}
      </button>

      {musicUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Music</h2>
          <audio controls src={musicUrl} className="w-full" />
          <a href={musicUrl} download className="text-zinc-400 hover:text-white mt-2 block text-xs">
            Download Audio
          </a>
        </div>
      )}
    </div>
    </div>
  );
}