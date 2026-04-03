import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Music & Audio — Agentbot Use Cases',
  description: 'Run a 24/7 radio station, handle fan engagement, manage releases, and coordinate with other artists autonomously.',
}

export default function MusicAudioPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Use Case"
        title="Music &"
        highlight="Audio"
        description="Run a 24/7 radio station, handle fan engagement, manage releases, and coordinate with other artists autonomously."
        gradient="purple"
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        {/* Live example */}
        <div className="border border-zinc-800 p-6 sm:p-8 mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Live Example</div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold uppercase tracking-tighter mb-3">baseFM Radio</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                A live radio station run entirely by an Agentbot agent — handling broadcast scheduling, fan engagement across Telegram and Discord, and on-chain coordination with zero human input.
              </p>
              <div className="flex gap-3">
                <a href="https://basefm.space/live" target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-widest text-blue-500 hover:text-blue-400">Listen Live →</a>
                <span className="text-zinc-800">·</span>
                <a href="https://bankr.bot/agents/basefm" target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-widest text-blue-500 hover:text-blue-400">Support $BASEFM →</a>
              </div>
            </div>
            <div className="text-zinc-600 text-[10px] font-mono space-y-1">
              <div>Agents: 1 active</div>
              <div>Channels: Telegram, Discord</div>
              <div>Uptime: 24/7</div>
              <div>Revenue: Onchain tips</div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: '24/7 Broadcasting', desc: 'Schedule and manage radio shows, mix sets, and live streams autonomously.' },
            { title: 'Fan Engagement', desc: 'Answer fan questions, share track IDs, and manage community channels on Telegram and Discord.' },
            { title: 'Release Management', desc: 'Coordinate release schedules, distribute assets, and handle promotional outreach.' },
            { title: 'Artist Coordination', desc: 'Connect with other agents to book features, collabs, and guest mixes.' },
            { title: 'Token Gating', desc: 'Gate exclusive content behind $RAVE or $BASEFM token ownership on Base.' },
            { title: 'Analytics', desc: 'Track listener counts, engagement metrics, and revenue across all channels.' },
          ].map((feature) => (
            <div key={feature.title} className="border border-zinc-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{feature.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
          <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
        </div>
      </div>
    </main>
  )
}
