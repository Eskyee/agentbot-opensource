'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, Copy,
  ExternalLink, Zap, Shield, Globe, TrendingUp, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface WalletInfo {
  address: string | null
  chain: string
  balance: number
  currency: string
  recentTxns: { hash: string; type: string; amount: number; to: string; timestamp: string }[]
}

const supportedChains = [
  { id: 'base', name: 'Base', icon: '🔵', usdc: true, x402: true, gasless: true },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', usdc: true, x402: false, gasless: false },
  { id: 'solana', name: 'Solana', icon: '◎', usdc: true, x402: false, gasless: true },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', usdc: true, x402: false, gasless: true },
  { id: 'polygon', name: 'Polygon', icon: '🟣', usdc: true, x402: false, gasless: true },
]

const paymentProtocols = [
  {
    name: 'x402',
    desc: 'HTTP-native micropayments. Agent pays per API call, per tool use, per resource access. Settled in USDC on Base.',
    status: 'Active',
    color: 'text-orange-400',
    icon: Zap,
  },
  {
    name: 'Stripe Machine Payments',
    desc: 'Stripe MPP for agent-to-agent commerce. Real-time sub-cent settlements. USD stablecoin wallets.',
    status: 'Coming Soon',
    color: 'text-purple-400',
    icon: DollarSign,
  },
  {
    name: 'Circle USDC',
    desc: 'Direct USDC transfers across Base, Ethereum, Solana. Programmable money for autonomous agents.',
    status: 'Active',
    color: 'text-blue-400',
    icon: Globe,
  },
  {
    name: 'Bridge by Stripe',
    desc: 'Fiat on/off ramp. Convert USDC to USD automatically. ACH to bank account.',
    status: 'Active',
    color: 'text-emerald-400',
    icon: ArrowUpRight,
  },
]

export default function StablecoinsPage() {
  const [copied, setCopied] = useState(false)

  const { data: wallet } = useQuery<WalletInfo>({
    queryKey: ['agent-wallet'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stablecoins')
      if (!res.ok) throw new Error('Failed to load wallet')
      return res.json()
    },
  })

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Stablecoin Payments"
        subtitle="USDC wallets, x402 micropayments, and agent-to-agent commerce"
        icon={<Wallet className="h-5 w-5 text-orange-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Wallet overview */}
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Agent Wallet</h2>
              <p className="text-xs text-zinc-500 mt-1">USDC on Base — gasless transactions via Agentbot</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 border border-emerald-400/20 px-2 py-0.5">
              Active
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Balance</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                ${wallet?.balance?.toFixed(2) ?? '0.00'}
              </div>
              <div className="text-[10px] text-zinc-600 mt-1">{wallet?.currency ?? 'USDC'}</div>
            </div>
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Chain</div>
              <div className="text-lg font-bold text-white">{wallet?.chain ?? 'Base'}</div>
              <div className="text-[10px] text-zinc-600 mt-1">Gasless sponsored</div>
            </div>
            <div className="border border-zinc-800 bg-black p-4">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Transactions</div>
              <div className="text-lg font-bold text-white">{wallet?.recentTxns?.length ?? 0}</div>
              <div className="text-[10px] text-zinc-600 mt-1">Last 30 days</div>
            </div>
          </div>

          {/* Address */}
          {wallet?.address && (
            <div className="border border-zinc-800 bg-black p-3 flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest shrink-0">Address</span>
              <code className="text-xs font-mono text-zinc-400 flex-1 truncate">{wallet.address}</code>
              <button
                onClick={copyAddress}
                className="text-zinc-600 hover:text-white transition-colors"
              >
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Supported chains */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Supported Chains
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
            {supportedChains.map((chain) => (
              <div key={chain.id} className="bg-zinc-950 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{chain.icon}</span>
                  <span className="text-xs font-bold text-white">{chain.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {chain.usdc ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <span className="h-3 w-3" />}
                    <span className={chain.usdc ? 'text-zinc-400' : 'text-zinc-600'}>USDC</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {chain.x402 ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <span className="h-3 w-3" />}
                    <span className={chain.x402 ? 'text-zinc-400' : 'text-zinc-600'}>x402</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {chain.gasless ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <span className="h-3 w-3" />}
                    <span className={chain.gasless ? 'text-zinc-400' : 'text-zinc-600'}>Gasless</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment protocols */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Payment Protocols
          </h2>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-800">
            {paymentProtocols.map((proto) => {
              const Icon = proto.icon
              return (
                <div key={proto.name} className="bg-zinc-950 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', proto.color)} />
                      <span className="text-xs font-bold text-white">{proto.name}</span>
                    </div>
                    <span className={cn(
                      'text-[9px] uppercase tracking-widest px-1.5 py-0.5',
                      proto.status === 'Active'
                        ? 'text-emerald-400 border border-emerald-400/20'
                        : 'text-amber-400 border border-amber-400/20'
                    )}>
                      {proto.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{proto.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* x402 deep dive */}
        <div className="border border-orange-500/20 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-orange-400 uppercase tracking-tight mb-4">
            x402 — Agent-to-Agent Payments
          </h2>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed max-w-lg">
            <p>
              x402 is the HTTP-native payment protocol built for AI agents. When your agent calls
              a paid API or MCP service, the x402 header handles payment negotiation automatically.
              No subscriptions, no API keys — just pay per call in USDC on Base.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Min Payment</div>
                <div className="text-lg font-bold text-orange-400">$0.001</div>
              </div>
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Settlement</div>
                <div className="text-lg font-bold text-white">~2s</div>
              </div>
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Chain</div>
                <div className="text-lg font-bold text-blue-400">Base</div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-600">
              Governance moved to Linux Foundation (April 2026). Participants: Circle, Google, Mastercard,
              Microsoft, Shopify, Stripe, Visa. Agentbot is an early adopter.
            </p>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
