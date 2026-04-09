import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot Update: April 8, 2026 — Community Token, Features & More',
  description: 'What happened today: AGENTBOT token on Solana pump.fun, Turborepo 2.9, OpenClaw latest, Blockstream Jade integration, and more.',
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-4">Update</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            April 8, 2026
          </h1>
          <div className="flex items-center gap-4 text-zinc-500 text-xs">
            <span>April 8, 2026</span>
            <span>·</span>
            <span>5 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-zinc-300 leading-relaxed mb-8">
            Big day for Agentbot. Here's everything that dropped.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🚀 AGENTBOT Token on Solana</h2>

          <p className="text-zinc-400 mb-6">
            The community launched <strong>$AGENTBOT</strong> on Solana via pump.fun — and it's already graduated (100%) with $100K+ daily trading volume. The token is community-owned and traded on pump.fun with a live market.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 p-6 my-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Market Cap</span>
                <span className="text-white text-sm font-bold">$3.46K</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">24h Volume</span>
                <span className="text-white text-sm font-bold">$107K</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Holders</span>
                <span className="text-white text-sm font-bold">75+</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Status</span>
                <span className="text-green-500 text-sm font-bold">Graduated</span>
              </div>
            </div>
          </div>

          <p className="text-zinc-400 mb-6">
            <a href="https://agentbot.sh/token" className="text-blue-400 hover:underline">View the token page →</a> now lists both the Base ($AGENTBOT on Uniswap) and Solana (pump.fun) tokens.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🔧 Turborepo 2.9</h2>

          <p className="text-zinc-400 mb-6">
            Agentbot is now running <strong>Turborepo 2.9</strong> — giving us up to 96% faster time-to-first-task. The monorepo now uses workspaces for web, agentbot-backend, and gateway with proper caching.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🐚 OpenClaw Latest</h2>

          <p className="text-zinc-400 mb-6">
            OpenClaw runtime is now on <strong>latest</strong> (docker pull). All agent deployments will automatically use the latest version going forward.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🔐 Blockstream Jade Integration</h2>

          <p className="text-zinc-400 mb-6">
            Added Blockstream Jade + Liquid wallet section to the Bitcoin dashboard. Users can now connect Jade hardware wallets and use multi-sig configurations for enhanced security.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🔓 GitHub Stars Live</h2>

          <p className="text-zinc-400 mb-6">
            The homepage now fetches live GitHub stars/forks from the API instead of hardcoded values. Your repo stats are always current.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">🛠️ Other Fixes</h2>

          <ul className="space-y-3 text-zinc-400 mb-8">
            <li>→ Fixed x402 dashboard null safety</li>
            <li>→ Added DeepWiki to footer</li>
            <li>→ Added Expert Setup $49 booking with Stripe</li>
            <li>→ Blog post on Cybersecurity in the Age of AI</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What's Next: Code & Community</h2>

          <p className="text-zinc-400 mb-6">
            <strong>We're focusing on code and community.</strong> Agentbot is an open source project — we're here to support developers building with AI agents. The Solana token is proof the community is here, but our core mission is:
          </p>

          <ul className="space-y-4 text-zinc-400 mb-8">
            <li>→ <strong className="text-white">Open Source First:</strong> All agentbot code is free. Fork it, build on it, break it.</li>
            <li>→ <strong className="text-white">Developer Support:</strong> We're building tools, docs, and skills to help devs ship faster.</li>
            <li>→ <strong className="text-white">Community Projects:</strong> If you're building something cool with agents, we want to help.</li>
            <li>→ <strong className="text-white">Zero Gatekeeping:</strong> No API keys required to get started. Deploy in 60 seconds.</li>
          </ul>

          <p className="text-zinc-500 text-sm mt-12 pt-8 border-t border-zinc-800">
            Open source. Community owned. Built on Base + Solana.
          </p>
        </div>
      </article>
    </main>
  )
}