'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wallet, TrendingUp, Coins, Zap, Globe, ExternalLink, RefreshCw, ArrowUpRight, ArrowDownRight, Search, Save, CheckCircle } from 'lucide-react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'

interface TokenBalance {
  mint: string
  symbol: string
  amount: number
  decimals: number
}

interface WalletData {
  address: string
  solBalance: number
  tokens: TokenBalance[]
  accountInfo: { isExecutable: boolean; owner: string | null; rentEpoch: number | null }
}

interface SolPrice {
  price: number | null
  change24h: number | null
  marketCap: number | null
  volume24h: number | null
}

function formatUsd(n: number | null): string {
  if (n === null || n === undefined) return '--'
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function SolanaDashboard() {
  const [walletAddress, setWalletAddress] = useState('')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  const [solPrice, setSolPrice] = useState<SolPrice | null>(null)
  const [priceLoading, setPriceLoading] = useState(true)

  const [rpcUrl, setRpcUrl] = useState('')
  const [defaultRpcUrl, setDefaultRpcUrl] = useState('https://api.mainnet-beta.solana.com')
  const [rpcSource, setRpcSource] = useState<'user' | 'default'>('default')
  const [rpcSaving, setRpcSaving] = useState(false)
  const [rpcSaved, setRpcSaved] = useState(false)
  const [rpcError, setRpcError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    setPriceLoading(true)
    try {
      const res = await fetch('/api/solana/price')
      if (res.ok) {
        const data = await res.json()
        setSolPrice(data)
      }
    } catch { /* silent */ } finally {
      setPriceLoading(false)
    }
  }, [])

  const loadRpcConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/solana/rpc-config')
      if (res.ok) {
        const data = await res.json()
        if (data.rpcUrl) setRpcUrl(data.rpcUrl)
        if (data.defaultRpcUrl) setDefaultRpcUrl(data.defaultRpcUrl)
        if (data.source === 'user' || data.source === 'default') setRpcSource(data.source)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchPrice()
    loadRpcConfig()
    const interval = setInterval(fetchPrice, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrice, loadRpcConfig])

  const lookupWallet = async () => {
    if (!walletAddress.trim()) return
    setWalletLoading(true)
    setWalletError(null)
    setWalletData(null)
    try {
      const params = new URLSearchParams({ address: walletAddress.trim() })
      if (rpcUrl) params.set('rpc', rpcUrl)
      const res = await fetch(`/api/solana/wallet?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed')
      setWalletData(data)
    } catch (e: unknown) {
      setWalletError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setWalletLoading(false)
    }
  }

  const saveRpcConfig = async () => {
    if (!rpcUrl.trim()) return
    setRpcSaving(true)
    setRpcSaved(false)
    try {
      const res = await fetch('/api/solana/rpc-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcUrl: rpcUrl.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setRpcError(null)
        setRpcSource('user')
        setRpcSaved(true)
        setTimeout(() => setRpcSaved(false), 3000)
      } else {
        setRpcError(data?.error || 'Failed to save RPC URL')
      }
    } catch {
      setRpcError('Failed to save RPC URL')
    } finally {
      setRpcSaving(false)
    }
  }

  const priceUp = (solPrice?.change24h ?? 0) >= 0

  return (
    <DashboardShell>
      <DashboardHeader
        title="Solana Tools"
        subtitle="Wallet lookup, RPC control, and Solana integration references"
        icon={<Coins className="h-5 w-5 text-violet-400" />}
      />
      <DashboardContent className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Solana Integration</div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Solana Tools</h1>
        <p className="text-zinc-400 mt-2">
          Connect to Solana DeFi, NFTs, and token operations via MCP tools.
        </p>
      </div>

      {/* Live SOL Price Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center font-bold text-sm">SOL</div>
            <div>
              <div className="text-2xl font-bold">
                {priceLoading ? (
                  <span className="text-zinc-500">Loading...</span>
                ) : solPrice?.price ? (
                  <>${solPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                ) : '--'}
              </div>
              {solPrice?.change24h !== null && solPrice?.change24h !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${priceUp ? 'text-green-400' : 'text-red-400'}`}>
                  {priceUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(solPrice.change24h).toFixed(2)}% (24h)
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-zinc-500 text-xs uppercase">Market Cap</div>
              <div className="font-bold">{formatUsd(solPrice?.marketCap ?? null)}</div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs uppercase">24h Volume</div>
              <div className="font-bold">{formatUsd(solPrice?.volume24h ?? null)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left block">
          <Wallet className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Connect Wallet</div>
          <div className="text-xs text-zinc-500 mt-1">Get Phantom wallet</div>
        </a>
        <a href="https://jup.ag/" target="_blank" rel="noopener noreferrer" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left block">
          <TrendingUp className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Token Swap</div>
          <div className="text-xs text-zinc-500 mt-1">Trade on Jupiter</div>
        </a>
        <a href="https://www.pump.fun/" target="_blank" rel="noopener noreferrer" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left block">
          <Coins className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">Deploy Token</div>
          <div className="text-xs text-zinc-500 mt-1">Launch on pump.fun</div>
        </a>
        <a href="https://www.metaplex.com/" target="_blank" rel="noopener noreferrer" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors text-left block">
          <Zap className="w-6 h-6 mb-3 text-white" />
          <div className="font-bold">NFT Mint</div>
          <div className="text-xs text-zinc-500 mt-1">Mint on Metaplex</div>
        </a>
      </div>

      {/* Wallet Lookup */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Wallet Lookup</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookupWallet()}
            placeholder="Enter Solana address..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono text-sm"
          />
          <button
            onClick={lookupWallet}
            disabled={walletLoading || !walletAddress.trim()}
            className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {walletLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Lookup
          </button>
        </div>

        {walletError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            {walletError}
          </div>
        )}

        {walletData && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="text-xs text-zinc-500 uppercase mb-1">SOL Balance</div>
                <div className="text-2xl font-bold">{walletData.solBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL</div>
                {solPrice?.price && (
                  <div className="text-sm text-zinc-400">
                    ~{formatUsd(walletData.solBalance * solPrice.price)}
                  </div>
                )}
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="text-xs text-zinc-500 uppercase mb-1">Token Accounts</div>
                <div className="text-2xl font-bold">{walletData.tokens.length}</div>
                <div className="text-sm text-zinc-400">
                  {walletData.accountInfo.isExecutable ? 'Program Account' : 'Wallet Account'}
                </div>
              </div>
            </div>

            {walletData.tokens.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 uppercase mb-3">Token Holdings</div>
                <div className="space-y-2">
                  {walletData.tokens.map((token) => (
                    <div key={token.mint} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-bold">{token.symbol}</span>
                        <span className="text-xs text-zinc-500 ml-2 font-mono">{token.mint.slice(0, 8)}...</span>
                      </div>
                      <div className="font-mono text-sm">
                        {token.amount.toLocaleString(undefined, { maximumFractionDigits: token.decimals > 4 ? 2 : token.decimals })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-zinc-600 text-center">
              <a
                href={`https://solscan.io/account/${walletData.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-400 flex items-center justify-center gap-1"
              >
                View on Solscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Integration Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Available Integrations</h2>
        <div className="space-y-4">
          {[
            { name: 'Solana Agent Kit', status: 'Available', tools: '60+', tier: 'Label', url: 'https://github.com/sendai/solana-agent-kit' },
            { name: 'Agentbot Solana', status: 'Available', tools: '31', tier: 'All', url: 'https://github.com/Eskyee/agentbot-solana' },
            { name: 'cobotgg', status: 'Coming Soon', tools: '27', tier: 'Label', url: null },
            { name: 'RefundYourSOL', status: 'Coming Soon', tools: '7', tier: 'All', url: null },
          ].map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold">{integration.name}</div>
                  <div className="text-xs text-zinc-500">{integration.tools} MCP tools</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-sm ${integration.status === 'Available' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {integration.status}
                  </div>
                  <div className="text-xs text-zinc-500">{integration.tier} plan</div>
                </div>
                {integration.url && (
                  <a href={integration.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
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
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Custom RPC URL</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => { setRpcUrl(e.target.value); setRpcSaved(false) }}
                placeholder="https://api.mainnet-beta.solana.com"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono text-sm"
              />
              <button
                onClick={saveRpcConfig}
                disabled={rpcSaving || !rpcUrl.trim()}
                className="bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {rpcSaved ? <CheckCircle className="w-4 h-4 text-green-600" /> : rpcSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {rpcSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          {rpcError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {rpcError}
            </div>
          )}
          <div className="flex gap-3">
            {[
              { label: 'Helius', url: 'https://mainnet.helius-rpc.com/?api-key=' },
              { label: 'QuickNode', url: 'https://example.solana-mainnet.quiknode.pro/' },
              { label: 'Alchemy', url: 'https://solana-mainnet.g.alchemy.com/v2/' },
              { label: 'Public', url: 'https://api.mainnet-beta.solana.com' },
            ].map((provider) => (
              <button
                key={provider.label}
                onClick={() => { setRpcUrl(provider.url); setRpcSaved(false); setRpcError(null) }}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
              >
                {provider.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-xs text-zinc-600">
            <p>Using a private RPC (Helius, QuickNode, Alchemy) avoids rate limits on wallet lookups.</p>
            <p>Current source: <span className="text-zinc-400 font-mono">{rpcSource === 'user' ? 'saved custom RPC' : 'default public RPC'}</span></p>
            <p>Default fallback: <span className="text-zinc-400 font-mono break-all">{defaultRpcUrl}</span></p>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Resources</h2>
        <div className="flex gap-4 flex-wrap">
          <a href="/solana" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            Integration Docs
          </a>
          <a href="https://github.com/sendai/solana-agent-kit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ExternalLink className="w-4 h-4" />
            Solana Agent Kit
          </a>
          <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ExternalLink className="w-4 h-4" />
            Solscan Explorer
          </a>
          <a href="/token" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <Coins className="w-4 h-4" />
            $AGENTBOT Token
          </a>
        </div>
      </div>
      </DashboardContent>
    </DashboardShell>
  )
}
