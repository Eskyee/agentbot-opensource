import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'

const EVE_URL = 'https://eve.agentbot.sh'

export const metadata: Metadata = {
  title: 'Eve — Agentbot',
  description:
    'Eve is Agentbot’s durable agent, built on Vercel’s open-source eve framework. Chat with her live — she can look up plans, channels, and more.',
}

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    title: 'Filesystem-first',
    desc: 'Eve is just a directory — markdown instructions, TypeScript tools, skills. No glue code.',
  },
  {
    title: 'Durable by default',
    desc: 'Runs as a durable workflow, so long-running tasks survive restarts and deploys.',
  },
  {
    title: 'Real tools',
    desc: 'Eve calls typed tools to look up live Agentbot plans and channels — never guesses.',
  },
]

export default function EvePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Eve"
        title="Meet"
        highlight="Eve"
        description="Agentbot’s durable agent, built on Vercel’s open-source eve framework. Each agent is a directory of files — instructions in markdown, tools in TypeScript. Talk to her live below."
        gradient="green"
      />

      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
          <div className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">{f.title}</div>
                <p className="mt-2 text-sm text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Live Agent</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-3">
              Chat with <span className="text-green-500">Eve</span>
            </h2>
            <p className="text-sm text-zinc-400">
              Eve runs as her own durable service. Ask her about plans, channels, or how to deploy your
              own 24/7 agent.
            </p>
          </div>

          <a
            href={EVE_URL}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded-lg"
          >
            Launch Eve →
          </a>
        </div>
      </section>
    </main>
  )
}
