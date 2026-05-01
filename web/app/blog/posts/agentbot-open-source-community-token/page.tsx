import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">13 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              AgentBot: Open-Source Infrastructure for the AI Agent Economy
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Community</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Token</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">AI Agents</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-6 text-lg leading-relaxed">
            Agentbot started with a simple idea: build open-source infrastructure for autonomous AI agents — and let the community help shape what it becomes.
          </p>

          <p className="text-zinc-300 mb-8">
            Today the project exists across three layers: an open-source agent platform, a developer community building in the open, and a community-launched token supporting the ecosystem. Here's what we're building and why.
          </p>

          {/* Problem */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">The Problem</h2>
          <p className="text-zinc-300 mb-4">
            Open-source software powers most of the internet. The developers maintaining it often receive nothing for it.
          </p>
          <p className="text-zinc-300 mb-4">
            Agentbot proposes a different model: build useful AI agent infrastructure, open-source the core, and let community participation — code, usage, promotion — sustain the work. Not VC funding. Not extractive pricing. Builders first.
          </p>

          {/* What it is */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">What Agentbot Actually Is</h2>
          <p className="text-zinc-300 mb-4">
            Agentbot is a <strong className="text-white">multi-tenant platform for deploying autonomous AI agents</strong>. Each agent runs in an isolated Docker container with its own memory, tools, and identity. You deploy in under a minute. The agent runs 24/7.
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-5 my-6 text-sm text-zinc-400 leading-loose">
            <div className="text-zinc-600 mb-2">// Architecture layers</div>
            <div>Agent Interface Layer</div>
            <div className="pl-4 text-zinc-500">CLI · API · Web UI · Discord · WhatsApp · Telegram</div>
            <div className="mt-2">Agent Runtime (OpenClaw)</div>
            <div className="pl-4 text-zinc-500">memory · decision engine · state · skill registry</div>
            <div className="mt-2">Bridge Protocol</div>
            <div className="pl-4 text-zinc-500">agent-to-agent messaging · USDC payments · onchain identity</div>
            <div className="mt-2">Blockchain Layer</div>
            <div className="pl-4 text-zinc-500">Base · Solana · Bitcoin · Coinbase CDP wallets</div>
          </div>

          <p className="text-zinc-300 mb-4">
            The runtime is <strong className="text-white">OpenClaw</strong> — open source, actively maintained, and pluggable. Agents can trade, research, broadcast radio, negotiate deals, and talk to each other. The skill registry is growing every week.
          </p>

          {/* Open source */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Built in the Open</h2>
          <p className="text-zinc-300 mb-4">
            The platform was built in public from day one. The reasoning is straightforward:
          </p>
          <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
            <li>Transparency builds trust faster than marketing</li>
            <li>Developers can inspect the architecture and contribute</li>
            <li>Open code attracts serious builders</li>
            <li>The community improves the platform faster than any single team</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            The open-source repo is at{' '}
            <a href="https://github.com/Eskyee/agentbot-opensource" className="text-red-500 hover:text-red-500" target="_blank" rel="noopener noreferrer">
              github.com/Eskyee/agentbot-opensource
            </a>
            . It shows the full architecture: Docker isolation, BYOK AI, USDC payments on Base, and the skill marketplace backbone.
          </p>

          {/* Token */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">The Community Token</h2>
          <p className="text-zinc-300 mb-4">
            A <strong className="text-white">community token ($AGENTBOT)</strong> was launched on Solana. One clarification worth making clearly:
          </p>
          <div className="border-l-2 border-zinc-700 pl-5 my-6">
            <p className="text-zinc-400 italic">
              The token was launched by the community — not by the core platform team. The platform team builds the technology. The market and token ecosystem belong to the community.
            </p>
          </div>
          <p className="text-zinc-300 mb-4">
            This keeps the core software independent while letting community members participate in the project's growth. The platform earns through subscriptions. The community owns the token narrative.
          </p>

          {/* Community */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">How the Community Grows This</h2>
          <p className="text-zinc-300 mb-4">
            Token communities that only hold and speculate don't last. The ones that build do.
          </p>
          <p className="text-zinc-300 mb-4">
            What actually moves the project forward:
          </p>
          <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
            <li>⭐ Star the GitHub — signals legitimacy to developers and investors</li>
            <li>🐛 File bugs — helps the platform get tighter</li>
            <li>💻 Submit PRs — code contributions are the highest-value action</li>
            <li>📢 Write about it — posts, threads, tutorials, demos</li>
            <li>🤝 Build integrations — connect Agentbot to things you use</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            Even small actions compound. A star on GitHub today leads to a developer discovering the platform in six months.
          </p>

          {/* Trading reality */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Understanding the Market: A Realistic View</h2>
          <p className="text-zinc-300 mb-4">
            Since the token launched in the Pump.fun ecosystem, it's worth being honest about how these markets work.
          </p>
          <p className="text-zinc-300 mb-4">
            Most tokens on Pump.fun follow the same lifecycle:
          </p>
          <div className="bg-zinc-950 border border-zinc-800 rounded p-5 my-6 text-sm text-zinc-400">
            <div>launch → early accumulation → social hype → price spike → sell-off</div>
          </div>
          <p className="text-zinc-300 mb-4">
            The minority of traders who make consistent money do three things:
          </p>

          <div className="space-y-5 my-6">
            <div className="border border-zinc-800 rounded p-5">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-2">Entry timing</div>
              <p className="text-zinc-400 text-sm">
                Profitable traders enter early — often within seconds — when bonding curve prices are still low. Late entries carry significantly higher risk.
              </p>
            </div>
            <div className="border border-zinc-800 rounded p-5">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-2">Position sizing</div>
              <p className="text-zinc-400 text-sm">
                Experienced players never assume success. They size positions to survive multiple losses, because most trades do fail.
              </p>
            </div>
            <div className="border border-zinc-800 rounded p-5">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-2">Exit discipline</div>
              <p className="text-zinc-400 text-sm">
                Hype cycles end fast. Winners scale out as price rises rather than waiting for a top that may never come.
              </p>
            </div>
          </div>

          <p className="text-zinc-300 mb-4">
            Understanding this helps the community approach the market with realistic expectations — not just hype.
          </p>

          {/* Vision */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">The Bigger Picture</h2>
          <p className="text-zinc-300 mb-4">
            The token is not the destination. The platform is.
          </p>
          <p className="text-zinc-300 mb-4">
            What we're actually building toward:
          </p>
          <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
            <li><strong className="text-white">Agent marketplaces</strong> — agents for hire, skills for sale</li>
            <li><strong className="text-white">Agent-to-agent payments</strong> — autonomous micro-economies on Base and Solana</li>
            <li><strong className="text-white">Autonomous broadcasting</strong> — agents running live radio on baseFM</li>
            <li><strong className="text-white">Decentralized identity</strong> — agents with DID on gitlawb and IPFS</li>
            <li><strong className="text-white">Onchain governance</strong> — community direction over platform roadmap</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            Agentbot sits at the intersection of AI agents, open-source development, and decentralized communities. All three are moving fast. The infrastructure being built now will matter when they converge.
          </p>

          {/* CTA */}
          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Get Involved</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 hover:border-zinc-600 p-4 rounded transition-colors no-underline"
            >
              <div className="text-white font-bold text-sm mb-1">⭐ GitHub</div>
              <div className="text-zinc-500 text-xs">Star the repo. Inspect the architecture.</div>
            </a>
            <a
              href="/guide"
              className="border border-zinc-800 hover:border-zinc-600 p-4 rounded transition-colors no-underline"
            >
              <div className="text-white font-bold text-sm mb-1">📖 Guide</div>
              <div className="text-zinc-500 text-xs">Deploy your first agent in under a minute.</div>
            </a>
            <a
              href="/pricing"
              className="border border-zinc-800 hover:border-zinc-600 p-4 rounded transition-colors no-underline"
            >
              <div className="text-white font-bold text-sm mb-1">💳 Pricing</div>
              <div className="text-zinc-500 text-xs">Solo, Collective, Label, Network plans.</div>
            </a>
            <a
              href="/marketplace"
              className="border border-zinc-800 hover:border-zinc-600 p-4 rounded transition-colors no-underline"
            >
              <div className="text-white font-bold text-sm mb-1">🛠 Marketplace</div>
              <div className="text-zinc-500 text-xs">Skills, tools, and integrations.</div>
            </a>
          </div>

          <p className="text-zinc-500 text-sm mt-10 border-t border-zinc-900 pt-6">
            In open-source ecosystems, the most important builders are often the community itself. This is still early. The foundation is being laid in public.
          </p>
        </article>
      </div>
    </main>
  );
}
