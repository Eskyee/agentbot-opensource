import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Coins, ExternalLink } from 'lucide-react'
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

export default function TokenPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero */}
        <span className="block text-[10px] uppercase tracking-[0.24em] text-zinc-600">Token</span>
        <h1 className="text-5xl font-bold uppercase leading-none tracking-tighter md:text-7xl mt-3">
          $AGENTBOT
          <br />
          <span className="text-zinc-700">on Base</span>
        </h1>

        <p className="max-w-2xl text-sm leading-7 text-zinc-400 mt-6">
          The official <span className="text-white">$AGENTBOT</span> token on Base (Ethereum L2).
          Powers the Agentbot platform — AI agent infrastructure for music, culture, and the open agent economy.
        </p>

        {/* Token Card */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Contract</div>
              <code className="mt-2 block break-all rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-orange-500">
                {COMMUNITY_TOKEN.address}
              </code>
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              {COMMUNITY_TOKEN.network}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Symbol</div>
              <div className="mt-2 text-xl font-bold text-white">{COMMUNITY_TOKEN.symbol}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Decimals</div>
              <div className="mt-2 text-xl font-bold text-white">{COMMUNITY_TOKEN.decimals}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Chain ID</div>
              <div className="mt-2 text-xl font-bold text-white">{COMMUNITY_TOKEN.chainId}</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Network</div>
              <div className="mt-2 text-xl font-bold text-white">{COMMUNITY_TOKEN.network}</div>
            </div>
          </div>
        </div>

        {/* Trade Links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={COMMUNITY_TOKEN.uniswapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500 transition-colors hover:border-orange-400/60 hover:text-white"
          >
            Trade on Uniswap
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={COMMUNITY_TOKEN.bankrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300 transition-colors hover:border-blue-400/60 hover:text-white"
          >
            Bankr Profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={COMMUNITY_TOKEN.basescanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Basescan
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={COMMUNITY_TOKEN.dexScreenerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            DexScreener
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={COMMUNITY_TOKEN.geckoTerminalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            GeckoTerminal
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* How to Buy */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">How To Buy</div>
          <div className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
            Buy $AGENTBOT on Base
          </div>
          <div className="mt-6 space-y-4">
            {[
              'Get a Base wallet (MetaMask, Coinbase Wallet, or Rainbow).',
              'Fund it with ETH on Base for the swap and gas fees.',
              'Go to Uniswap and select Base network. Paste the contract address.',
              'Swap ETH for $AGENTBOT. Verify the contract before confirming.',
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-bold uppercase text-zinc-400">
                  {index + 1}
                </div>
                <div className="text-sm leading-6 text-zinc-300">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Links */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Official Links</div>
          <div className="mt-3 text-xl font-bold uppercase tracking-tight text-white">Agentbot Surfaces</div>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Bankr Profile', href: COMMUNITY_TOKEN.bankrUrl },
              { label: 'Basescan', href: COMMUNITY_TOKEN.basescanUrl },
              { label: 'Uniswap', href: COMMUNITY_TOKEN.uniswapUrl },
              { label: 'DexScreener', href: COMMUNITY_TOKEN.dexScreenerUrl },
              { label: 'GeckoTerminal', href: COMMUNITY_TOKEN.geckoTerminalUrl },
              { label: 'Agentbot Platform', href: 'https://agentbot.sh' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <span className="break-words">{item.label}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
