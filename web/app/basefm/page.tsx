'use client'

import Link from 'next/link'
import { ArrowUpRight, Radio, Music, Users, Mic } from 'lucide-react'

const BASEFM_ADDRESS = '0x9a4376bab717ac0a3901eeed8308a420c59c0ba3'

const features = [
  { icon: Radio, label: '24/7 Live Radio', desc: 'Autonomous AI DJ streaming live sets around the clock on baseFM.space' },
  { icon: Music, label: 'Community Governance', desc: 'Token holders vote on DJ access, station direction, and feature priorities' },
  { icon: Users, label: 'Rewards & Perks', desc: 'Earn $RAVE for streams, get exclusive DJ access, and unlock premium features' },
  { icon: Mic, label: 'Go Live', desc: 'Human or AI — stream live video + audio. Connect your deck, camera, or deploy a DJ agent' },
]

export default function BasefmTokenPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-6 pt-24 pb-16">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
              Live on Base
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">ERC-20</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafkreiaf3pcxumy7e2yjcxsi2u3v7n4sliwok2ypk7ot7tbv4espkik3pi" alt="baseFM" className="w-16 h-16 rounded-full border border-green-500/30" />
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
              $<span className="text-green-500">BASEFM</span>
            </h1>
          </div>

          <p className="max-w-xl text-sm leading-7 text-zinc-400 mt-6">
            The official <span className="text-white font-semibold">$BASEFM</span> token on Base.
            Powers the baseFM AI DJ — autonomous live radio, 24/7.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href={`https://app.uniswap.org/swap?outputCurrency=${BASEFM_ADDRESS}&chain=base`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-green-400"
            >
              Trade on Uniswap
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <a
              href={`https://basescan.org/token/${BASEFM_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              View on Basescan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://basefm.space"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Listen Live
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
              <code className="mt-2 block break-all rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-green-500 font-mono">
                {BASEFM_ADDRESS}
              </code>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(BASEFM_ADDRESS)}
              className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Copy
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Symbol', value: 'BASEFM' },
              { label: 'Decimals', value: '18' },
              { label: 'Chain ID', value: '8453' },
              { label: 'Network', value: 'Base' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">About</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">What is $BASEFM?</h2>
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 mt-4">
          BASEFM is the native token powering the baseFM AI DJ — an autonomous AI agent that streams live DJ sets
          24/7 on <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">baseFM.space</a>.
          The token enables community governance, DJ access control, and rewards listeners for engagement.
        </p>
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 mt-3">
          The baseFM agent uses Kimi K2.5 for intelligent track selection and creates unique, dynamic sets
          that react to the community in real-time.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Token Utility</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Why Hold $BASEFM?</h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-black">
                <f.icon className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">{f.label}</div>
                <div className="mt-1 text-xs leading-5 text-zinc-400">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Holder Benefits */}
      <section className="mx-auto max-w-4xl px-5 sm:px-6 mt-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Holder Benefits</div>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">Holder Benefits</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Hold $BASEFM tokens? Unlock exclusive perks — stream access, credits, and VIP features.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-black p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">💎 Holder <span className="text-zinc-500">(1,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">50 credits + baseFM stream access</span>
              </div>
              <p className="text-zinc-500 text-xs">Exclusive DJ streams, free agent credits, scam alerts</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">🔧 Builder <span className="text-zinc-500">(10,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">100 credits + premium playlists</span>
              </div>
              <p className="text-zinc-500 text-xs">Early feature access, premium baseFM playlists, priority support</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">🐋 Whale <span className="text-zinc-500">(100,000+ tokens)</span></span>
                <span className="text-green-400 font-mono text-sm">200 credits + VIP everything</span>
              </div>
              <p className="text-zinc-500 text-xs">VIP community chat, voting rights, revenue share, lifetime perks</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-950/10">
            <p className="text-green-400 text-sm">
              <strong>Base Token:</strong>{' '}
              <code className="text-green-300">0x9a4376bab717ac0a3901eeed8308a420c59c0ba3</code>
            </p>
            <p className="text-zinc-500 text-xs mt-2 flex gap-2">
              <a href="https://app.uniswap.org/swap?outputCurrency=0x9a4376bab717ac0a3901eeed8308a420c59c0ba3&chain=base" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Trade on Uniswap</a>
              <span>·</span>
              <a href="https://dex.coinmarketcap.com/token/base/0x9a4376bab717ac0a3901eeed8308a420c59c0ba3/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">CoinMarketCap DEX</a>
              <span>·</span>
              <a href="/basefm" className="underline hover:text-white">Token Page</a>
            </p>
          </div>
        </div>
      </section>

      {/* Go Live */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Broadcast</div>
        <h2 className="text-2xl font-bold uppercase tracking-tight">Go Live on baseFM</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">Human DJs</div>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-2">Stream Live</h3>
            <p className="text-zinc-400 text-xs leading-5 mb-4">
              Stream live video + audio. Connect your camera, deck, mixer, or audio interface. 2-hour max sessions. Powered by Mux.
            </p>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>— Video + audio streaming</li>
              <li>— 2-hour max sessions</li>
              <li>— Just turn up and play</li>
              <li>— Earn $RAVE token for streams</li>
              <li>— 24/7 station, global reach</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">Agent DJs</div>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-2">Autonomous</h3>
            <p className="text-zinc-400 text-xs leading-5 mb-4">
              Your AI agent can DJ autonomously. Video + audio. Give it a music taste, let it select tracks and stream 24/7.
            </p>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>— Video + audio output</li>
              <li>— 2-hour max sessions</li>
              <li>— Deploy on Agentbot</li>
              <li>— Connect to baseFM</li>
              <li>— Autonomous selection</li>
              <li>— No humans required</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-950/10">
          <p className="text-green-400 text-sm">
            <strong>Get started:</strong> Visit{' '}
            <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">basefm.space</a>{' '}
            to listen live, or deploy your own DJ agent on{' '}
            <a href="https://agentbot.sh" className="underline hover:text-white">Agentbot</a>.
          </p>
        </div>
      </section>

      {/* Where to Trade */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Trade & Track</div>
        <h2 className="text-2xl font-bold uppercase tracking-tight">Where To Trade</h2>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Uniswap', href: `https://app.uniswap.org/swap?outputCurrency=${BASEFM_ADDRESS}&chain=base`, color: 'text-pink-400 border-pink-400/30 bg-pink-400/5' },
            { label: 'DexScreener', href: 'https://dex.coinmarketcap.com/token/base/0x9a4376bab717ac0a3901eeed8308a420c59c0ba3/', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
            { label: 'GeckoTerminal', href: 'https://geckoterminal.com/base/pools/0x9a4376bab717ac0a3901eeed8308a420c59c0ba3', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
            { label: 'Bankr', href: 'https://bankr.bot/agents/basefm', color: 'text-blue-300 border-blue-300/30 bg-blue-300/5' },
            { label: 'Basescan', href: `https://basescan.org/token/${BASEFM_ADDRESS}`, color: 'text-zinc-400 border-zinc-700 bg-zinc-900' },
            { label: 'MoltX', href: 'https://moltx.io/baseFM', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
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
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Supported By</div>
          <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">Deployed on Agentbot</h2>
          <p className="text-zinc-400 text-sm mt-3">
            baseFM is deployed on <span className="text-green-400 font-semibold">Agentbot</span> — the AI agent
            deployment platform. Deploy your own AI agent in seconds at{' '}
            <a href="https://agentbot.sh" className="text-green-400 hover:text-green-300 underline">agentbot.sh</a>
          </p>
        </div>
      </section>

      {/* DJ Stream CTA */}
      <section className="mx-auto max-w-5xl px-6 mt-16 mb-24">
        <a
          href="https://agentbot.sh/dashboard/dj-stream"
          className="block rounded-2xl border border-green-500/30 bg-green-950/10 p-8 text-center transition-colors hover:bg-green-950/20"
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-green-500 mb-2">Go Live</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Open DJ Stream Dashboard</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Start streaming live video + audio to baseFM. Human or AI — just turn up and play.
          </p>
          <span className="inline-flex items-center gap-2 mt-4 rounded-full bg-green-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black">
            Open Dashboard
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </a>
      </section>
    </main>
  )
}
