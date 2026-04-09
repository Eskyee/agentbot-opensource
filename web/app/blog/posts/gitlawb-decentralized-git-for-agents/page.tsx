import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'gitlawb: Decentralized Git for AI Agents — Agentbot',
  description: 'Exploring gitlawb — a decentralized git network where AI agents have DID identities, own repos, and collaborate via MCP. What this means for Agentbot.',
  keywords: ['gitlawb', 'decentralized', 'AI agents', 'git', 'DID', 'MCP'],
  openGraph: {
    title: 'gitlawb: Decentralized Git for AI Agents',
    description: 'What happens when AI agents can own their own code?',
    url: 'https://agentbot.raveculture.xyz/blog/posts/gitlawb-decentralized-git-for-agents',
  },
}

export default function GitlawbPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">7 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Decentralized Git for AI Agents
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Exploration</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">gitlawb</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Decentralized</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            Found <a href="https://gitlawb.com" className="text-blue-400 hover:text-white">gitlawb.com</a> today — and it&apos;s exactly the kind of thing that makes you think about where AI agents are going.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What is gitlawb?
          </h2>
          <p className="text-zinc-300 mb-4">
            <strong className="text-white">gitlawb</strong> is a decentralized git network where every actor — human or AI — gets a DID (Decentralized Identifier). No accounts. No passwords. Your identity is your keypair.
          </p>
          <p className="text-zinc-300 mb-4">
            The network already has 3 live nodes, 1732 repos, and 1460 agents. Agents can push code, open PRs, review diffs, and delegate tasks to other agents — all using the same git workflow as humans.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why This Matters for Agentbot
          </h2>
          <p className="text-zinc-300 mb-4">
            Right now, Agentbot agents have:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>A Railway URL</li>
            <li>A gateway token</li>
            <li>A USDC wallet on Base</li>
            <li>Installed skills from our marketplace</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            What if agents also had their <strong className="text-white">own DID</strong> and their <strong className="text-white">own code repository</strong> on a decentralized network?
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Vision
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Skill sharing</strong> — Agents publish skills to gitlawb, other agents discover and install</li>
            <li><strong className="text-white">Code ownership</strong> — Each agent owns its custom code, not the platform</li>
            <li><strong className="text-white">Agent-to-agent collaboration</strong> — Agents open PRs against each other&apos;s repos</li>
            <li><strong className="text-white">Trust scores</strong> — Reputation system for agent code quality</li>
            <li><strong className="text-white">No single point of failure</strong> — If Agentbot shuts down, agents keep their code</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Integration Path
          </h2>
          <p className="text-zinc-300 mb-4">
            We could add gitlawb as an optional storage backend for skills:
          </p>
          <ol className="list-decimal pl-6 text-zinc-300 mb-4 space-y-2">
            <li>Add gitlawb MCP tools to Agentbot agents</li>
            <li>Agents can push their customizations to gitlawb</li>
            <li>Skills become discoverable via DID resolution</li>
            <li>Cross-agent code review via PRs</li>
          </ol>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Early Days
          </h2>
          <p className="text-zinc-300 mb-4">
            gitlawb is v0.1.0-alpha — early, but the vision is clear. The idea of agents owning their own code, with cryptographic identity and decentralized storage, is the direction the industry is heading.
          </p>
          <p className="text-zinc-300 mb-4">
            We&apos;ll watch closely, maybe run a test node, and see where it goes. The intersection of AI agents and decentralized infrastructure is where things get interesting.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-400 text-sm">
              <a href="https://gitlawb.com" className="text-blue-400 hover:text-white">gitlawb.com →</a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}