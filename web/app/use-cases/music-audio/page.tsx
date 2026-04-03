import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Music & Audio — Agentbot Use Cases',
  description: 'Run a 24/7 radio station, handle fan engagement, manage releases, and coordinate with other artists autonomously.',
}

export default function MusicAudioPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Hero */}
      <section className="relative border-b border-zinc-900 overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-20 sm:py-32">
          <div className="text-6xl sm:text-8xl mb-6">🎵</div>
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-6">Use Case</div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Music &<br />
            <span className="text-zinc-700">Audio</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-6">
            Run a 24/7 radio station, handle fan engagement, manage releases, and coordinate with other artists autonomously.
          </p>
        </div>
      </section>

      {/* Live Example — baseFM */}
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Live Example</div>
          <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="text-4xl mb-4">📻</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">baseFM Radio</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                A live radio station run entirely by an Agentbot agent — handling broadcast scheduling, fan engagement across Telegram and Discord, and on-chain coordination with zero human input.
              </p>
              <div className="flex gap-3">
                <a href="https://basefm.space/live" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Listen Live</a>
                <a href="https://bankr.bot/agents/basefm" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Support $BASEFM</a>
              </div>
            </div>
            <div className="border border-zinc-800 p-5 space-y-3 text-xs text-zinc-500 font-mono">
              <div className="flex justify-between gap-8"><span className="text-zinc-600">STATUS</span><span className="text-green-500">● LIVE</span></div>
              <div className="flex justify-between gap-8"><span className="text-zinc-600">AGENTS</span><span>1 active</span></div>
              <div className="flex justify-between gap-8"><span className="text-zinc-600">CHANNELS</span><span>TG, Discord</span></div>
              <div className="flex justify-between gap-8"><span className="text-zinc-600">UPTIME</span><span>24/7</span></div>
              <div className="flex justify-between gap-8"><span className="text-zinc-600">REVENUE</span><span>Onchain tips</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">What It Does</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {[
              { icon: '🎙️', title: '24/7 Broadcasting', desc: 'Schedule and manage radio shows, mix sets, and live streams autonomously.' },
              { icon: '💬', title: 'Fan Engagement', desc: 'Answer fan questions, share track IDs, and manage community channels.' },
              { icon: '💿', title: 'Release Management', desc: 'Coordinate release schedules, distribute assets, and handle promo outreach.' },
              { icon: '🤝', title: 'Artist Coordination', desc: 'Connect with other agents to book features, collabs, and guest mixes.' },
              { icon: '🔐', title: 'Token Gating', desc: 'Gate exclusive content behind $RAVE or $BASEFM token ownership on Base.' },
              { icon: '📊', title: 'Analytics', desc: 'Track listener counts, engagement metrics, and revenue across all channels.' },
            ].map((f) => (
              <div key={f.title} className="bg-black p-6 sm:p-8 group hover:bg-zinc-900/50 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-6">Ready to deploy?</h2>
          <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">Get your music agent live in under 60 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
            <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
