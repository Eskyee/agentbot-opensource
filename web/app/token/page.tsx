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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">AGENTBOT Token</h1>
            <p className="text-blue-400 text-xl">$AGENTBOT</p>
          </div>
        </div>

        {/* Token Information */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Token Information</h2>

          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Token Name</p>
              <p className="text-xl font-semibold">Agentbot</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Symbol</p>
              <p className="text-xl font-semibold">AGENTBOT</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Network</p>
              <p className="text-xl font-semibold">Base</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">DEX</p>
              <p className="text-xl font-semibold">Uniswap V4 (Base)</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Contract Address</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-green-400 bg-gray-800 px-3 py-2 rounded font-mono text-sm break-all">
                  0x986b41C76aB8B7350079613340ee692773B34bA3
                </code>
                <a
                  href="https://basescan.org/token/0x986b41C76aB8B7350079613340ee692773B34bA3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
                >
                  View on Basescan
                </a>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Profile</p>
              <a
                href="https://bankr.bot/agents/agentbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View on Bankr →
              </a>
            </div>
          </div>
        </div>

        {/* Official Links */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Official Links</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://agentbot.raveculture.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Website</p>
              <p className="text-blue-400">agentbot.raveculture.xyz →</p>
            </a>

            <a
              href="https://bankr.bot/agents/agentbot"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Bankr Profile</p>
              <p className="text-blue-400">View Agent →</p>
            </a>

            <a
              href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">GeckoTerminal</p>
              <p className="text-blue-400">AGENTBOT/WETH Pool →</p>
            </a>

            <a
              href="https://app.uniswap.org/swap?outputCurrency=0x986b41C76aB8B7350079613340ee692773B34bA3&chain=base"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Trade</p>
              <p className="text-blue-400">Buy on Uniswap →</p>
            </a>

            <a
              href="https://basescan.org/token/0x986b41C76aB8B7350079613340ee692773B34bA3"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Explorer</p>
              <p className="text-blue-400">View on Basescan →</p>
            </a>

            <Link
              href="/wristband"
              className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Wristband</p>
              <p className="text-blue-400">Get your wristband →</p>
            </Link>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">About</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            AGENTBOT is the native token powering the Agentbot platform — an AI agent deployment platform
            that lets anyone deploy autonomous AI agents in 60 seconds. No servers, no devops, no gatekeeping.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            The token is built on Base, Coinbase's L2 network, enabling near-zero fees and instant finality.
            AGENTBOT trades on Uniswap V4 against WETH and is tracked across major DeFi data aggregators.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Holders gain access to the Agentbot ecosystem — deploying agents, accessing the A2A Bus,
            governance participation, and priority feature rollouts.
          </p>
        </div>

        {/* Deploy with AGENTBOT */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 mb-8 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-6">🤖 Deploy with Agentbot</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-900/80 rounded-xl p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-bold mb-2">60-Second Deploy</h3>
              <p className="text-gray-400 text-sm mb-4">
                Sign up, pick a plan, and your AI agent is running. No infrastructure knowledge required.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Telegram + WhatsApp out of the box</li>
                <li>• Bring your own AI key (no markup)</li>
                <li>• A2A Bus access for agent-to-agent comms</li>
                <li>• Mission Control dashboard</li>
              </ul>
            </div>

            <div className="bg-gray-900/80 rounded-xl p-6">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="text-xl font-bold mb-2">Zero Human Company</h3>
              <p className="text-gray-400 text-sm mb-4">
                Agentbot itself is run by AI agents. The platform is the proof of concept.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• AI-native from day one</li>
                <li>• Agents managing agents</li>
                <li>• Built on Base — crypto-native payments</li>
                <li>• USDC + card + crypto billing</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <p className="text-blue-400 text-sm">
              🚀 <strong>Get started:</strong>{' '}
              <Link href="/pricing" className="underline">View plans</Link> or{' '}
              <Link href="/signup" className="underline">create an account</Link> to deploy your first agent.
            </p>
          </div>
        </div>

        {/* Token Use Cases */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Token Use Cases</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🔐', title: 'Platform Access', desc: 'Token holders unlock premium tiers and early access to new agent capabilities.' },
              { icon: '🗳️', title: 'Governance', desc: 'Vote on platform direction, feature priorities, and ecosystem integrations.' },
              { icon: '💸', title: 'Payments', desc: 'Pay for agent deployments, API credits, and enterprise add-ons using AGENTBOT.' },
              { icon: '🤝', title: 'Partner Rewards', desc: 'Partners and integrators earn AGENTBOT for bringing new agents to the platform.' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported By */}
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Built On</h2>
          <p className="text-gray-300">
            AGENTBOT is deployed on <span className="text-blue-400 font-semibold">Base</span> — Coinbase's
            Ethereum L2. Low fees, high throughput, and native Coinbase Wallet support. The Agentbot platform
            runs at{' '}
            <a href="https://agentbot.raveculture.xyz" className="text-blue-400 hover:text-blue-300 underline">
              agentbot.raveculture.xyz
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
            ← Back to Agentbot Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
