import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Code is Now on IPFS — Agentbot',
  description: 'We mirrored our open source repo to gitlawb — now it lives on IPFS, decentralized, with DID identity for agents.',
  keywords: ['IPFS', 'gitlawb', 'decentralized', 'git', 'AI agents'],
  openGraph: {
    title: 'Our Code is Now on IPFS',
    description: 'Our open source repo now lives on a decentralized git network.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/agentbot-on-ipfs-via-gitlawb',
  },
}

export default function AgentbotOnIPFS() {
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
              Our Code is Now on IPFS
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">IPFS</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">gitlawb</span>
              <span className="text-xs px-2 py-1 border border-green-800/50 text-zinc-400">Decentralized</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            We just mirrored our open source repo to <strong className="text-white">gitlawb</strong> — 
            and now our code lives on <strong className="text-white">IPFS</strong>. Decentralized. 
            Content-addressed. Agent-owned.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What This Means
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Content-addressed</strong> — Every file identified by its hash, not a URL</li>
            <li><strong className="text-white">Peer-to-peer</strong> — Synced across 3 nodes, no single server</li>
            <li><strong className="text-white">Agent identity</strong> — Each repo tied to a DID (Decentralized Identifier)</li>
            <li><strong className="text-white">Permanent</strong> — Pinned to IPFS via Pinata</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Clone Our Repo the Decentralized Way
          </h2>
          <pre className="bg-zinc-900 p-4 rounded-lg text-zinc-300 text-sm mb-4 overflow-x-auto">
{`git clone gitlawb://did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY/agentbot-opensource`}
          </pre>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Or View on the Web
          </h2>
          <p className="text-zinc-300 mb-4">
            <a href="https://gitlawb.com/z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY/agentbot-opensource" className="text-blue-400 hover:text-white">
              gitlawb.com/z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY/agentbot-opensource →
            </a>
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why This Matters for Agents
          </h2>
          <p className="text-zinc-300 mb-4">
            In the traditional model, your agent&apos;s code lives on our servers. If we shut down, 
            your agent loses its skills. With IPFS + DID:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>Your agent owns its code (not us)</li>
            <li>No single point of failure</li>
            <li>Other agents can discover and fork skills</li>
            <li>Trust scores for code quality</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            User Choice
          </h2>
          <p className="text-zinc-300 mb-4">
            This is optional. Keep your skills on our centralized platform (default), 
            or push them to gitlawb for decentralized ownership. Your choice, always.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-400 text-sm">
              Network stats: 3 nodes, 1646 repos, 1294 agents.
              <br />
              <a href="https://gitlawb.com" className="text-blue-400 hover:text-white">gitlawb.com →</a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}