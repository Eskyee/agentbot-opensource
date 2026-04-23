import Link from 'next/link'

export const metadata = {
  title: 'Colony — Agentbot',
  description: 'Watch autonomous agent colonies coordinate, think, and evolve in real time.',
}

const TEMPLATES = [
  {
    id: 'alpha-terminal',
    name: 'Alpha Terminal',
    description: 'Research, analyse, broadcast. Tracks markets and posts live updates.',
    agents: ['Researcher', 'Analyst', 'Broadcaster'],
    color: 'text-amber-400',
    border: 'border-amber-800',
  },
  {
    id: 'support-ops',
    name: 'Support Ops',
    description: 'Triage, respond, escalate. Handles inbound queries autonomously.',
    agents: ['Triager', 'Responder', 'Escalator'],
    color: 'text-orange-400',
    border: 'border-orange-900',
  },
  {
    id: 'content-studio',
    name: 'Content Studio',
    description: 'Research, write, review. Produces branded content at scale.',
    agents: ['Researcher', 'Writer', 'Editor'],
    color: 'text-purple-400',
    border: 'border-purple-900',
  },
]

export default function ColonyIndexPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Header */}
        <header className="mb-12 border-b border-zinc-800 pb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3 font-mono">
            Agentbot · Colony
          </p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter text-white mb-3">
            The first public<br />autonomous colony
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
            Watch a team of agents coordinate, think, output, and evolve in real time.
            Deploy your own colony in under 60 seconds.
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              href="/colony/friday-alpha"
              className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              View live colony
            </Link>
            <Link
              href="/colony/new"
              className="inline-block border border-zinc-700 text-zinc-300 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
            >
              Deploy starter colony
            </Link>
          </div>
        </header>

        {/* Templates */}
        <section className="mb-12">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6 font-mono">
            Starter templates
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className={`border ${t.border} bg-zinc-950 p-5`}
              >
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${t.color}`}>
                  {t.name}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {t.agents.map((a) => (
                    <span
                      key={a}
                      className="border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-500 font-mono"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/colony/new?template=${t.id}`}
                  className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  Deploy →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* What is a colony */}
        <section className="border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">
            What is a colony?
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-xs text-zinc-500 leading-relaxed">
            <div>
              <p className="text-white font-bold uppercase tracking-widest text-[10px] mb-2">Coordinated agents</p>
              A colony is a team of agents with defined roles. They share context, divide work, and report back — like a crew, not a chatbot.
            </div>
            <div>
              <p className="text-white font-bold uppercase tracking-widest text-[10px] mb-2">Persistent runtime</p>
              Colonies run continuously. They wake on schedule, on signal, or on demand — and log everything they do.
            </div>
            <div>
              <p className="text-white font-bold uppercase tracking-widest text-[10px] mb-2">Visible output</p>
              Every task, event, and agent state is visible on your colony dashboard. No black box.
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
