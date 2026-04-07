'use client';

import { useState } from 'react';

export default function VideoGenerator() {
  const [message] = useState<string>('Video generation coming soon! OpenClaw v2026.4.5 supports video_generate tool — agents can create videos via xAI Grokin, Runway, or Wan. API integration pending.');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono px-6 py-32">
      <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-6">AI Video Generator</h1>
      <p className="text-zinc-400 mb-8">Create videos with AI. Powered by OpenClaw v2026.4.5</p>

      <div className="border border-zinc-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">Coming Soon</h2>
        <p className="text-zinc-400 text-sm">{message}</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2 text-zinc-300">Supported Providers</h3>
        <ul className="text-zinc-400 text-sm space-y-1">
          <li>→ xAI (grok-imagine-video)</li>
          <li>→ Alibaba Model Studio Wan</li>
          <li>→ Runway</li>
        </ul>
      </div>

      <p className="text-zinc-500 text-xs mt-8">
        In the meantime, use the video_generate tool via your agent's Control UI.
      </p>
    </div>
    </div>
  );
}