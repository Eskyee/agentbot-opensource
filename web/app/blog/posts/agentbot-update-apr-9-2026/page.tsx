import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Solana Integration, Blockchain Buddies, and Liquid Wallet Kit - Agentbot',
  description: 'New features: Solana Agent Kit integration, Blockchain Buddies digital pets, Liquid Wallet Kit (LWK) docs, and more.',
  openGraph: {
    title: 'Solana Integration, Blockchain Buddies, and Liquid Wallet Kit',
    description: 'New features: Solana Agent Kit integration, Blockchain Buddies digital pets, Liquid Wallet Kit (LWK) docs, and more.',
    url: buildAppUrl('/blog/posts/agentbot-update-apr-9-2026'),
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">9 Apr 2026</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-6">
            Solana Integration, Blockchain Buddies & Liquid Wallet Kit
          </h1>
          <div className="flex gap-2">
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Solana</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Buddies</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Liquid</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Shipping</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none">
          <p className="text-xl text-zinc-300 mb-8">
            Big updates from the lab. We've added Solana integration, digital pets for your agent, and full Liquid Wallet Kit documentation. Let's go.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Solana Integration</h2>
          <p className="text-zinc-400 mb-4">
            Your Agentbot now connects to Solana. Trade tokens, deploy NFTs, and access 60+ MCP tools via Solana Agent Kit.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Solana Agent Kit model (Label plan) in onboard flow</li>
            <li>/solana page with 6 integration guides</li>
            <li>/dashboard/solana with wallet lookup & RPC config</li>
            <li>Competitor analysis: solana-clawd, cobotgg, RefundYourSOL</li>
          </ul>
          <a href="/solana" className="text-blue-400 hover:underline mb-8 block">View Solana integrations →</a>

          <h2 className="text-2xl font-bold mt-12 mb-4">Blockchain Buddies 🦀🤖👻🐉👽</h2>
          <p className="text-zinc-400 mb-4">
            Your agent now has digital companions. Hatch, feed, and play with blockchain buddies - stored in your database with full auth.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>5 buddy types: Crab, Robot, Ghost, Dragon, Alien</li>
            <li>Stats: energy, happiness, XP, level progression</li>
            <li>Prisma model + API routes (GET, POST, PATCH, DELETE)</li>
            <li>Unicode animations showcase</li>
            <li>Voice mode toggle</li>
          </ul>
          <a href="/buddies" className="text-blue-400 hover:underline mb-8 block">Meet your buddies →</a>

          <h2 className="text-2xl font-bold mt-12 mb-4">Liquid Wallet Kit Docs</h2>
          <p className="text-zinc-400 mb-4">
            New documentation for deploying Blockstream's Liquid Wallet Kit on Railway with Jade HWW support.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Full setup guide (5 steps)</li>
            <li>Software signer + Jade HWW configuration</li>
            <li>Multi-sig wallet creation (2-of-2, 2-of-3)</li>
            <li>Asset issuance on Liquid</li>
            <li>Agentbot integration notes</li>
          </ul>
          <a href="/docs/liquid-lwk-railway" className="text-blue-400 hover:underline mb-8 block">Read the guide →</a>

          <h2 className="text-2xl font-bold mt-12 mb-4">What's Competitive</h2>
          <p className="text-zinc-400 mb-4">
            Compared to solana-clawd (our main Solana competitor):
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>✅ Multi-chain (Base, Ethereum, Solana)</li>
            <li>✅ More integrations (BTCPay, x402, Bankr)</li>
            <li>✅ Live streaming (baseFM)</li>
            <li>✅ $AGENTBOT token with utility</li>
            <li>✅ Blockchain Buddies (unique to us)</li>
            <li>✅ Full Liquid Wallet Kit docs</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Coming Next</h2>
          <p className="text-zinc-400 mb-4">
            More integrations, more buddies, more everything. Stay tuned.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-12">
            <h3 className="font-bold mb-2">Deploy Your Agent</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Get started with Solana, Buddies, and Liquid today.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="/onboard" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
                Deploy Now →
              </a>
              <a href="/solana" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors">
                Solana Docs
              </a>
              <a href="/buddies" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors">
                Meet Buddies
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