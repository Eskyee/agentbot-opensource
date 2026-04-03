import Link from 'next/link'
import { MarketplaceClient } from '@/app/components/MarketplaceClient'
import { formatPublicCount, getPublicPlatformStats } from '@/app/lib/public-platform-stats'

export const metadata = {
  title: 'Marketplace — Agentbot',
  description: 'Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.',
}

export const dynamic = 'force-dynamic'

const templates = [
  {
    name: 'the-strategist',
    role: 'Mission Planning Agent',
    description: 'Advanced reasoning for complex crew operations. Powered by DeepSeek R1. Plans tours, logistics, and resource allocation.',
    skills: ['Mission Planning', 'Logistics', 'Resource Analysis', 'A2A Coordination'],
    popular: true,
    tier: 'Label',
    brain: 'DeepSeek R1'
  },
  {
    name: 'crew-manager',
    role: 'Operations & Finance Agent',
    description: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    skills: ['Royalty Splits', 'Talent Booking', 'Treasury Guard', 'USDC Payments'],
    popular: true,
    tier: 'Underground',
    brain: 'Llama 3.3'
  },
  {
    name: 'sound-system',
    role: 'Automation & Feedback Agent',
    description: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    skills: ['Mux Monitor', 'RAVE Gating', 'Fast Feedback', 'Live Traces'],
    popular: true,
    tier: 'Free',
    brain: 'Mistral 7B'
  },
  {
    name: 'the-developer',
    role: 'Logic & Scripting Agent',
    description: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    skills: ['Code Gen', 'Scripting', 'Contract Audit', 'Skill Builder'],
    popular: false,
    tier: 'Collective',
    brain: 'Qwen 2.5'
  }
]

export default async function MarketplacePage() {
  const stats = await getPublicPlatformStats(templates.length)

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Verified Fleet</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
            Agent <span className="text-zinc-700">Marketplace</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
          </p>
        </div>

        <section className="mb-10 sm:mb-12 grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Verified Templates</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.templates)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Ready to deploy</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Deployed Agents</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.totalAgents)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Tracked in platform</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Live Agents</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.liveAgents)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Active in fleet</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Showcase Ready</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.showcaseAgents)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Public signal</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Skills Installed</div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.installedSkills)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">Across deployments</div>
          </div>
        </section>

        <MarketplaceClient templates={templates} />

        <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Platform Integrity</span>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">The Purge</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We have archived all legacy and unoptimized agents. The current fleet is strictly tuned for <strong className="text-zinc-300">OpenClaw Multi-tenancy</strong> and <strong className="text-zinc-300">Base Onchain Economy</strong>. If it doesn&apos;t make you profit, it isn&apos;t here.
            </p>
          </div>
        </div>

        <div className="mt-24 sm:mt-32 pt-12 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">Agentbot Marketplace</div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
            <Link href="/token" className="hover:text-white transition-colors">Token</Link>
            <Link href="/partner" className="hover:text-white transition-colors">Partner</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
