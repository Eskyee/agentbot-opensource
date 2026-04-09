'use client'

import Link from 'next/link'
import { TrendingUp, Zap, Wallet, Coins, Globe, ExternalLink } from 'lucide-react'

const integrations = [
  {
    name: 'Solana Agent Kit',
    description: '154 GitHub stars. 60+ built-in blockchain actions for DeFi, NFTs, token operations. Multi-framework support for LangChain, Vercel AI SDK, and MCP.',
    features: ['Token deployment', 'Jupiter swaps', 'Metaplex NFTs', 'Portfolio rebalancing', 'Autonomous mode with error recovery'],
    stars: 154,
    url: 'https://github.com/sendai/solana-agent-kit',
    icon: <Coins className="w-6 h-6" />,
  },
  {
    name: 'Agentbot Solana',
    description: 'Agentbot\'s native Solana agent framework. MCP-native, 31 Solana tools, Agentbot Babies, Unicode animations, Voice Mode. All plans.',
    features: ['31 MCP tools', 'Telegram bot', 'Agentbot Babies', 'Voice Mode', 'All plans'],
    stars: null,
    url: 'https://github.com/Eskyee/agentbot-solana',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    name: 'cobotgg',
    description: 'Multi-chain agent platform on Cloudflare. 27 MCP tools for prediction markets, token swaps across 20+ chains, and Pump.fun token launches.',
    features: ['Kalshi (7 tools)', 'Polymarket (7 tools)', 'Token swaps 20+ chains', 'Pump.fun launch', 'Agent Registry'],
    stars: null,
    url: 'https://github.com/cobotgg/cobot',
    icon: <Globe className="w-6 h-6" />,
  },
  {
    name: 'RefundYourSOL MCP',
    description: 'Wallet cleanup tool turned full Solana toolkit. 7 MCP tools including wallet scanning, token trading on 12+ DEXes, and rent recovery.',
    features: ['Wallet scan', 'Close empty accounts', 'Trade on 12+ DEXes', 'Jito MEV protection', '650K+ wallets processed'],
    stars: null,
    url: 'https://github.com/RefundYourSOL/refundyoursol-mcp',
    icon: <Wallet className="w-6 h-6" />,
  },
  {
    name: 'Agentbot Trade',
    description: 'Agentbot\'s autonomous Solana trading agent. 60+ Solana actions via WhatsApp/Telegram, natural language commands, 34 protocol skills.',
    features: ['WhatsApp & Telegram', 'Natural language', 'Drift, Raydium, Meteora', 'Token deployment', 'NFT minting'],
    stars: null,
    url: 'https://github.com/Eskyee/agentbot-solana',
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    name: 'Agentbot Solana Connect',
    description: 'Secure toolkit for Agentbot agents to interact with Solana. Private key protection, max limits, human confirmation thresholds.',
    features: ['Private key protection', 'Max SOL limits', 'Human confirmation', 'Wallet generation', 'Transaction history'],
    stars: null,
    url: 'https://github.com/Eskyee/agentbot-solana',
    icon: <Wallet className="w-6 h-6" />,
  },
]

const tools = [
  { category: 'Market Data', tools: ['solana_price', 'solana_trending', 'solana_token_info', 'solana_wallet_pnl'] },
  { category: 'Trading', tools: ['jupiter_swap', 'raydium_swap', 'meteora_swap', 'orca_swap'] },
  { category: 'Tokens', tools: ['deploy_token', 'mint_tokens', 'transfer_tokens', 'burn_tokens'] },
  { category: 'NFTs', tools: ['mint_nft', 'transfer_nft', 'list_nft', 'create_collection'] },
  { category: 'DeFi', tools: ['stake_sol', 'unstake', 'provide_liquidity', 'claim_rewards'] },
  { category: 'Agent Fleet', tools: ['agent_spawn', 'agent_list', 'agent_status', 'agent_kill'] },
]

export default function SolanaPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Solana Integration</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Solana AI Agents
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Connect your Agentbot to Solana. Trade tokens, deploy NFTs, manage wallets, and build autonomous DeFi agents with 100+ MCP tools.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid gap-6 mb-16">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-white shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{integration.name}</h3>
                    {integration.stars && (
                      <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full">
                        ⭐ {integration.stars}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mb-4">{integration.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {integration.features.map((feature) => (
                      <span
                        key={feature}
                        className="bg-zinc-800/50 text-zinc-400 text-xs px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <a
                    href={integration.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    View on GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MCP Tools Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-16">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Available MCP Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((category) => (
              <div key={category.category} className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  {category.category}
                </h3>
                <ul className="space-y-1">
                  {category.tools.map((tool) => (
                    <li key={tool} className="text-sm text-zinc-300 font-mono">
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-16">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Quick Start</h2>
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">1. Select Solana Agent Kit in Onboard</h3>
              <p className="text-zinc-400 text-sm">
                When deploying your agent, choose Solana Agent Kit model (Label plan required).
              </p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">2. Configure RPC</h3>
              <p className="text-zinc-400 text-sm">
                Add your Solana RPC URL (Helius, QuickNode, or Alchemy) in agent settings.
              </p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">3. Add Wallet</h3>
              <p className="text-zinc-400 text-sm">
                Import or generate a Solana wallet. Your agent can now trade, stake, and manage assets.
              </p>
            </div>
          </div>
        </div>

        {/* $AGENTBOT Token */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-16">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">$AGENTBOT Token</h2>
          <p className="text-zinc-400 text-sm mb-4">
            $AGENTBOT is live on pump.fun. The native token powering the Agentbot ecosystem.
          </p>
          <div className="flex gap-4">
            <a
              href="/token"
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
            >
              View $AGENTBOT
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link href="/onboard" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Onboard
          </Link>
        </div>
      </div>
    </main>
  )
}