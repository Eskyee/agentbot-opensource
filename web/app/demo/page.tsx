import { Metadata } from 'next'
import { DemoVideo } from '@/app/components/landing'
import { PageHero } from '@/app/components/PageHero'
import { formatPublicCount, getPublicPlatformStats } from '@/app/lib/public-platform-stats'

export const metadata: Metadata = {
  title: 'Demo — Agentbot',
  description: 'Watch Agentbot deploy a fully autonomous agent in 60 seconds. Connected to Telegram, powered by your API key, running 24/7.',
}

export const dynamic = 'force-dynamic'

const demoTemplateCount = 4

export default async function DemoPage() {
  const stats = await getPublicPlatformStats(demoTemplateCount)

  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Demo"
        title="Watch It"
        highlight="Come Alive"
        description="Deploy a fully autonomous agent in 60 seconds. Connected to your channel, powered by your key, running 24/7. No code required."
        gradient="amber"
      />
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Deployed Agents</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.totalAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Live Agents</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.liveAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Showcase Ready</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.showcaseAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Skills Installed</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.installedSkills)}</div>
            </div>
          </div>
        </div>
      </section>
      <DemoVideo />
    </main>
  )
}
