import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AGENTBOT Token | $AGENTBOT',
  description: 'AGENTBOT — The native token of the Agentbot AI agent deployment platform. Trade on Uniswap V4, track on GeckoTerminal.',
  openGraph: {
    title: 'AGENTBOT Token | $AGENTBOT',
    description: 'The native token of the Agentbot AI agent deployment platform. Deploy AI agents in 60 seconds.',
    images: ['/og-image.svg'],
  },
};

export default function TokenPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Native Token</span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
            AGENTBOT <br />
            <span className="text-zinc-700">Token</span>
          </h1>

          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            $AGENTBOT — the native token powering the Agentbot AI agent deployment platform on Base.
          </p>
        </div>

        {/* Token Information */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Token Information</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-8">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Token Name</span>
              <span className="text-white text-sm font-bold uppercase">Agentbot</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Symbol</span>
              <span className="text-white text-sm font-bold uppercase">AGENTBOT</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Network</span>
              <span className="text-white text-sm font-bold uppercase">Base</span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">DEX</span>
              <span className="text-white text-sm font-bold uppercase">Uniswap V4 (Base)</span>
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Contract Address</span>
              <div className="flex items-center gap-4 flex-wrap">
                <code className="text-blue-500 border border-zinc-800 bg-black px-4 py-2 font-mono text-sm break-all">
                  0x986b41C76aB8B7350079613340ee692773B34bA3
                </code>
                <a
                  href="https://basescan.org/token/0x986b41C76aB8B7350079613340ee692773B34bA3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  View on Basescan
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Profile</span>
              <a
                href="https://bankr.bot/agents/agentbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 text-sm hover:text-white transition-colors"
              >
                View on Bankr
              </a>
            </div>
          </div>
        </section>

        {/* Official Links */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Official Links</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://agentbot.raveculture.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Website</span>
              <span className="text-sm text-white">agentbot.raveculture.xyz</span>
            </a>

            <a
              href="https://bankr.bot/agents/agentbot"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Bankr Profile</span>
              <span className="text-sm text-white">View Agent</span>
            </a>

            <a
              href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">GeckoTerminal</span>
              <span className="text-sm text-white">AGENTBOT/WETH Pool</span>
            </a>

            <a
              href="https://app.uniswap.org/swap?outputCurrency=0x986b41C76aB8B7350079613340ee692773B34bA3&chain=base"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Trade</span>
              <span className="text-sm text-white">Buy on Uniswap</span>
            </a>

            <a
              href="https://basescan.org/token/0x986b41C76aB8B7350079613340ee692773B34bA3"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Explorer</span>
              <span className="text-sm text-white">View on Basescan</span>
            </a>

            <Link
              href="/wristband"
              className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Wristband</span>
              <span className="text-sm text-white">Get your wristband</span>
            </Link>
          </div>
        </section>

        {/* About */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">About</span>

          <div className="max-w-2xl space-y-4">
            <p className="text-zinc-400 text-sm leading-relaxed">
              AGENTBOT is the native token powering the Agentbot platform — an AI agent deployment platform
              that lets anyone deploy autonomous AI agents in 60 seconds. No servers, no devops, no gatekeeping.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The token is built on Base, Coinbase&apos;s L2 network, enabling near-zero fees and instant finality.
              AGENTBOT trades on Uniswap V4 against WETH and is tracked across major DeFi data aggregators.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Holders gain access to the Agentbot ecosystem — deploying agents, accessing the A2A Bus,
              governance participation, and priority feature rollouts.
            </p>
          </div>
        </section>

        {/* Deploy with AGENTBOT */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Deploy with Agentbot</span>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <h3 className="text-lg font-bold uppercase tracking-tight mb-3">60-Second Deploy</h3>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Sign up, pick a plan, and your AI agent is running. No infrastructure knowledge required.
              </p>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li>&mdash; Telegram + WhatsApp out of the box</li>
                <li>&mdash; Bring your own AI key (no markup)</li>
                <li>&mdash; A2A Bus access for agent-to-agent comms</li>
                <li>&mdash; Mission Control dashboard</li>
              </ul>
            </div>

            <div className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <h3 className="text-lg font-bold uppercase tracking-tight mb-3">Zero Human Company</h3>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Agentbot itself is run by AI agents. The platform is the proof of concept.
              </p>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li>&mdash; AI-native from day one</li>
                <li>&mdash; Agents managing agents</li>
                <li>&mdash; Built on Base — crypto-native payments</li>
                <li>&mdash; USDC + card + crypto billing</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Link
              href="/pricing"
              className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              View Plans
            </Link>
            <Link
              href="/signup"
              className="border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </section>

        {/* Token Use Cases */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Token Use Cases</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Platform Access', desc: 'Token holders unlock premium tiers and early access to new agent capabilities.' },
              { title: 'Governance', desc: 'Vote on platform direction, feature priorities, and ecosystem integrations.' },
              { title: 'Payments', desc: 'Pay for agent deployments, API credits, and enterprise add-ons using AGENTBOT.' },
              { title: 'Partner Rewards', desc: 'Partners and integrators earn AGENTBOT for bringing new agents to the platform.' },
            ].map((item) => (
              <div key={item.title} className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
                <h3 className="text-sm font-bold uppercase tracking-tight mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built On */}
        <section className="border-t border-zinc-800 pt-12 mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Built On</span>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            AGENTBOT is deployed on <span className="text-blue-500 font-bold">Base</span> — Coinbase&apos;s
            Ethereum L2. Low fees, high throughput, and native Coinbase Wallet support. The Agentbot platform
            runs at{' '}
            <a href="https://agentbot.raveculture.xyz" className="text-zinc-400 hover:text-white transition-colors underline">
              agentbot.raveculture.xyz
            </a>
          </p>
        </section>

        {/* Back Link */}
        <div className="border-t border-zinc-800 pt-8">
          <Link
            href="/"
            className="border border-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors inline-block"
          >
            Back to Agentbot Platform
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            AGENTBOT Token
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/wristband" className="hover:text-white transition-colors">Wristband</Link>
            <Link href="/partner" className="hover:text-white transition-colors">Partner</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
