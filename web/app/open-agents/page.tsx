import { Metadata } from 'next';
import { PageHero } from '@/app/components/PageHero';

const OPEN_AGENTS_URL = 'https://open.agentbot.sh';

export const metadata: Metadata = {
  title: 'Open Agents — Agentbot',
  description:
    "Open Agents is Agentbot's open-source AI agent platform. Chat with agents live, deploy autonomous workflows, and build with the community.",
};

export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    title: 'Open Source',
    desc: 'Full source code available. Study, modify, and self-host your own agent platform.',
  },
  {
    title: 'Multi-Agent',
    desc: 'Deploy multiple specialized agents — each with its own personality, tools, and knowledge.',
  },
  {
    title: 'Always On',
    desc: 'Agents run 24/7 on Vercel. Durable workflows survive restarts and deploys.',
  },
];

export default function OpenAgentsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Open Agents"
        title="Meet"
        highlight="Open Agents"
        highlightColor="text-blue-500"
        description="Agentbot's open-source AI agent platform. Deploy autonomous agents, chat with them live, and build with the community."
        gradient="blue"
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
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
              Live Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-3">
              Chat with <span className="text-blue-500">Open Agents</span>
            </h2>
            <p className="text-sm text-zinc-400">
              Open Agents runs as its own service. Sign in with Vercel, GitHub, or your wallet —
              then chat with agents, deploy workflows, and explore the open-source platform.
            </p>
          </div>

          <a
            href={OPEN_AGENTS_URL}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded-lg"
          >
            Launch Open Agents →
          </a>
        </div>
      </section>
    </main>
  );
}
