import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'baseFM × Agentbot: B2B Co-DJ Underground Network — Agentbot',
  description: 'The first streaming platform to let two DJs run a live B2B show from different locations. One Mux stream, a 120-second handoff window, WebRTC audio monitoring, and live chat for DJs and listeners.',
  openGraph: {
    title: 'baseFM × Agentbot: B2B Co-DJ Underground Network',
    description: 'The first streaming platform to let two DJs run a live B2B show from different locations. One Mux stream, a 120-second handoff window, WebRTC audio monitoring, and live chat for DJs and listeners.',
    url: buildAppUrl('/blog/posts/basefm-b2b-co-dj'),
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">17 Apr 2026</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-6">
            baseFM × Agentbot: B2B Co-DJ Underground Network
          </h1>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">baseFM</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">B2B</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Live Streaming</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Shipping</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none">

          {/* Flagship Feature Banner */}
          <div className="border border-zinc-700 rounded-xl p-6 mb-10 bg-zinc-950">
            <div className="text-[10px] uppercase tracking-widest text-amber-500 mb-2">Flagship Feature</div>
            <h2 className="text-2xl font-bold uppercase mb-1 tracking-tighter">
              baseFM × Agentbot — Underground Network
            </h2>
            <p className="text-zinc-300 text-lg font-bold mt-0 mb-0">CO-DJ B2B. TWO DJS. ONE LIVE STREAM.</p>
          </div>

          <p className="text-xl text-zinc-300 mb-8">
            The first streaming platform to let two DJs run a live B2B show from different locations and time zones — fully autonomous, pirate radio style. One Mux stream, a 120-second handoff window, and a live chat for DJs and listeners.
          </p>

          <p className="text-zinc-400 mb-8">
            No extra software. No complex setup. DJ1 stops their encoder, DJ2 connects within 2 minutes — Mux sees it as a reconnect and the stream continues without a cut. WebRTC audio monitoring lets DJ2 hear the last track before pressing play. Pioneer style.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 uppercase tracking-tighter">How It Works</h2>

          <div className="space-y-6 mb-10">
            <div className="flex gap-4">
              <div className="text-amber-500 font-bold text-lg min-w-[2rem]">01</div>
              <div>
                <h3 className="font-bold text-white mb-1">Invite Your Co-DJ</h3>
                <p className="text-zinc-400 text-sm">
                  Generate a unique B2B invite link from your stream dashboard. Share it anywhere — no accounts needed on their end.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-amber-500 font-bold text-lg min-w-[2rem]">02</div>
              <div>
                <h3 className="font-bold text-white mb-1">Coordinated Handoff</h3>
                <p className="text-zinc-400 text-sm">
                  When you finish your set, stop your encoder. Your co-DJ connects within 2 minutes. Mux reconnects seamlessly — the stream never drops.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-amber-500 font-bold text-lg min-w-[2rem]">03</div>
              <div>
                <h3 className="font-bold text-white mb-1">WebRTC Audio Monitoring</h3>
                <p className="text-zinc-400 text-sm">
                  Your co-DJ hears your last track live via WebRTC so they know exactly when to drop their first record.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-amber-500 font-bold text-lg min-w-[2rem]">04</div>
              <div>
                <h3 className="font-bold text-white mb-1">Live Chat — DJs + Crowd</h3>
                <p className="text-zinc-400 text-sm">
                  Real-time chat for both DJs to coordinate and for listeners to interact. DJ messages highlighted — the crowd sees the handoff coming.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4 uppercase tracking-tighter">Underground Network</h2>
          <p className="text-zinc-400 mb-6">
            For DJs, artists, sound systems, live rigs, podcasters, and agents from the underground music and rave culture scene. baseFM × Agentbot — built by the community, for the community.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 uppercase tracking-tighter">This Week's Updates</h2>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>B2B Co-DJ invite links generated from stream dashboard</li>
            <li>120-second Mux reconnect window — zero stream cuts on handoff</li>
            <li>WebRTC audio monitoring for incoming DJ</li>
            <li>Live chat with DJ role highlighting</li>
            <li>Social post delete for post owners</li>
            <li>Public /skills catalog page live</li>
            <li>Schema and query stability fixes</li>
          </ul>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-12">
            <h3 className="font-bold mb-2 uppercase tracking-tighter">Launch baseFM</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Get access, invite your co-DJ, and run your first B2B stream from anywhere in the world.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors">
                Launch baseFM →
              </a>
              <a href="/onboard" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors">
                Deploy Your Agent
              </a>
            </div>
          </div>
        </div>

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/blog" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Blog
          </a>
        </div>
      </article>
    </main>
  )
}
