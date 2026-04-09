'use client'

import { useState } from 'react'
import { Wallet, TrendingUp, Coins, Zap, Globe, ExternalLink, RefreshCw } from 'lucide-react'

export default function SolanaDashboard() {
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Solana Integration</div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Solana Tools</h1>
        <p className="text-zinc-400 mt-2">
          Connect to Solana DeFi, NFTs, and token operations via MCP tools.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <button className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left">
          <Wallet className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Connect Wallet</div>
          <div className="text-xs text-zinc-500 mt-1">Link Solana wallet</div>
        </button>
        <button className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left">
          <TrendingUp className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Token Swap</div>
          <div className="text-xs text-zinc-500 mt-1">Trade on Jupiter</div>
        </button>
        <button className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left">
          <Coins className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Deploy Token</div>
          <div className="text-xs text-zinc-500 mt-1">Create SPL token</div>
        </button>
        <button className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left">
          <Zap className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">NFT Mint</div>
          <div className="text-xs text-zinc-500 mt-1">Mint on Metaplex</div>
        </button>
      </div>

      {/* Wallet Lookup */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Wallet Lookup</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana address..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono text-sm"
          />
          <button className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors">
            Lookup
          </button>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Available Integrations</h2>
        <div className="space-y-4">
          {[
            { name: 'Solana Agent Kit', status: 'Available', tools: '60+', tier: 'Label' },
            { name: 'solana-clawd', status: 'Available', tools: '31', tier: 'All' },
            { name: 'cobotgg', status: 'Coming Soon', tools: '27', tier: 'Label' },
            { name: 'RefundYourSOL', status: 'Coming Soon', tools: '7', tier: 'All' },
          ].map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div>
                <div className="font-bold">{integration.name}</div>
                <div className="text-xs text-zinc-500">{integration.tools} MCP tools</div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${integration.status === 'Available' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {integration.status}
                </div>
                <div className="text-xs text-zinc-500">{integration.tier} plan</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RPC Configuration */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">RPC Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">RPC URL</label>
            <input
              type="text"
              placeholder="https://api.mainnet-beta.solana.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
              Helius
            </button>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
              QuickNode
            </button>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
              Alchemy
            </button>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Resources</h2>
        <div className="flex gap-4 flex-wrap">
          <a
            href="/solana"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4" />
            Integration Docs
          </a>
          <a
            href="https://github.com/coinbase/solana-agent-kit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Solana Agent Kit
          </a>
          <a
            href="/token"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Coins className="w-4 h-4" />
            $AGENTBOT Token
          </a>
        </div>
      </div>
    </div>
  )
}