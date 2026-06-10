import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Coins, TrendingUp, Shield, Zap } from 'lucide-react'
import { COMMUNITY_TOKEN } from '@/app/lib/communityTokenStats'

export const metadata: Metadata = {
  title: '$AGENTBOT Token | Base',
  description: '$AGENTBOT on Base — the official Agentbot token. 0x986b41c76ab8b7350079613340ee692773b34ba3',
  openGraph: {
    title: '$AGENTBOT Token | Base',
    description: 'The official $AGENTBOT token on Base. Trade on Uniswap, track on Basescan.',
    images: ['/og-image.svg'],
  },
}

const features = [
  { icon: Coins, label: 'Governance', desc: 'Vote on protocol upgrades and feature priorities' },
  { icon: Shield, label: 'Staking', desc: 'Earn rewards and help secure the network' },
  { icon: Zap, label: 'Fee Sharing', desc: 'Get a cut of protocol revenue from agent deployments' },
  { icon: TrendingUp, label: 'Access', desc: 'Premium features and priority compute allocation' },
]

const steps = [
  'Get a Base wallet — MetaMask, Coinbase Wallet, or Rainbow.',
  'Fund it with ETH on Base for swap + gas fees.',
  'Go to Uniswap, select Base network, paste the contract address.',
  'Swap ETH for $AGENTBOT. Verify the contract before confirming.',
]

export default function TokenPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              Live on Base
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">ERC-20</span>
          </div>

          <h1 className="text-6xl font-bold uppercase leading-none tracking-tighter md:text-8xl">
            $AGENT<span className="text-orange-500">BOT</span>
          </h1>

          <p className="max-w-xl text-sm leading-7 text-zinc-400 mt-6">
            The official <span className="text-white font-semibold">$AGENTBOT</span> token on Base.
            Powers AI agent infrastructure for music, culture, and the open agent economy.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href={COMMUNITY_TOKEN.uniswapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-orange-400"
            >
              Trade on Uniswap
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <a
              href={COMMUNITY_TOKEN.basescanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              View on Basescan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Contract Address */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Contract Address</div>
              <code className="mt-2 block break-all rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-orange-500 font-mono">
                {COMMUNITY_TOKEN.address}
              </code>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(COMMUNITY_TOKEN.address)}
              className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Copy
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Symbol', value: COMMUNITY_TOKEN.symbol },
              { label: 'Decimals', value: COMMUNITY_TOKEN.decimals },
              { label: 'Chain ID', value: COMMUNITY_TOKEN.chainId },
              { label: 'Network', value: COMMUNITY_TOKEN.network },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Token Utility</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Why Hold $AGENTBOT?</h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-black">
                <f.icon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">{f.label}</div>
                <div className="mt-1 text-xs leading-5 text-zinc-400">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Buy */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Quick Start</div>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">How To Buy</h2>

          <div className="mt-8 space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-500">
                  {i + 1}
                </div>
                <div className="text-sm leading-6 text-zinc-300 pt-1">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Links */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Trade & Track</div>
        <h2 className="text-2xl font-bold uppercase tracking-tight">Where To Trade</h2>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Uniswap', href: COMMUNITY_TOKEN.uniswapUrl, color: 'text-pink-400 border-pink-400/30 bg-pink-400/5' },
            { label: 'Bankr', href: COMMUNITY_TOKEN.bankrUrl, color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
            { label: 'DexScreener', href: COMMUNITY_TOKEN.dexScreenerUrl, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
            { label: 'GeckoTerminal', href: COMMUNITY_TOKEN.geckoTerminalUrl, color: 'text-green-400 border-green-400/30 bg-green-400/5' },
            { label: 'Basescan', href: COMMUNITY_TOKEN.basescanUrl, color: 'text-zinc-400 border-zinc-700 bg-zinc-900' },
            { label: 'Agentbot', href: 'https://agentbot.sh', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-xl border px-5 py-4 text-sm font-medium transition-colors hover:opacity-80 ${item.color}`}
            >
              <span>{item.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 opacity-50" />
            </a>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-5xl px-6 mt-16 mb-24">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Partners</div>
          <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">Powered By</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-sm">
            <Link href="/partner/mimo" className="hover:text-white transition-colors">MiMo Code</Link>
            <span className="text-zinc-800">·</span>
            <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Base</a>
            <span className="text-zinc-800">·</span>
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">OpenClaw</a>
          </div>
        </div>
      </section>
    </main>
  )
}
