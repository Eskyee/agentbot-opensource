import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'baseFM Goes Open Source — Agentbot',
  description: 'Onchain radio platform baseFM is now open source on GitHub. Live DJs, crypto tipping, token-gated community, and onchain events — all built on Base.',
  keywords: ['baseFM', 'open source', 'Base', 'onchain radio', 'crypto', 'community'],
  openGraph: {
    title: 'baseFM Goes Open Source',
    description: 'Onchain radio for the Base ecosystem is now open source. Come build with us.',
    url: 'https://agentbot.sh/blog/posts/basefm-open-source',
  },
}

export default function BaseFMOpenSourcePost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              baseFM Goes Open Source
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Open Source</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Base</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Community</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            Today we&apos;re open sourcing <Link href="https://basefm.space" className="text-white underline">baseFM</Link> — 
            our onchain radio platform built on Base. Live DJs, crypto tipping, token-gated community, 
            and onchain events. The whole thing. Now it&apos;s yours.
          </p>

          <figure className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <Image
              src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafkreiaf3pcxumy7e2yjcxsi2u3v7n4sliwok2ypk7ot7tbv4espkik3pi"
              alt="baseFM open source announcement artwork"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority
              unoptimized
            />
            <figcaption className="border-t border-zinc-800 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              baseFM is now open source on GitHub
            </figcaption>
          </figure>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What is baseFM?
          </h2>
          <p className="text-zinc-300 mb-4">
            baseFM is an internet radio station where DJs stream live, listeners tip in crypto, 
            and the community owns the culture through tokens. Think of it as a decentralized 
            radio station with built-in community, tipping, and NFT features — all on Base.
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-6 space-y-1">
            <li><strong className="text-white">Live Streaming</strong> — RTMP to HLS via Mux, global CDN</li>
            <li><strong className="text-white">Crypto Tipping</strong> — ETH, USDC, RAVE, cbBTC straight to DJ wallets</li>
            <li><strong className="text-white">Token-Gated Community</strong> — 5,000+ RAVE for DJ access</li>
            <li><strong className="text-white">Onchain Events</strong> — tickets, crew management, POS</li>
            <li><strong className="text-white">Show NFTs</strong> — mint recordings as collectibles</li>
            <li><strong className="text-white">PWA</strong> — install as app on iOS/Android</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why Open Source?
          </h2>
          <p className="text-zinc-300 mb-4">
            We believe onchain radio should be a community effort, not a walled garden. 
            By open sourcing baseFM, we&apos;re inviting DJs, developers, and music lovers 
            to shape the platform together.
          </p>
          <p className="text-zinc-300 mb-6">
            The code is MIT licensed. Fork it, remix it, run your own station. 
            Or help us make basefm.space better — we need UI/UX help, mobile improvements, 
            chat moderation tools, genre filtering, analytics, and more.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Stack
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">Framework:</span> <span className="text-white">Next.js 14</span></div>
              <div><span className="text-zinc-500">Database:</span> <span className="text-white">Supabase</span></div>
              <div><span className="text-zinc-500">Streaming:</span> <span className="text-white">Mux</span></div>
              <div><span className="text-zinc-500">Chain:</span> <span className="text-white">Base</span></div>
              <div><span className="text-zinc-500">Wallet:</span> <span className="text-white">OnchainKit + wagmi</span></div>
              <div><span className="text-zinc-500">Language:</span> <span className="text-white">TypeScript</span></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Get Involved
          </h2>
          <div className="space-y-3 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-sm font-bold text-white mb-1">🎧 Listen</div>
              <p className="text-xs text-zinc-400">Tune in at <a href="https://basefm.space" className="text-orange-400 hover:text-orange-400">basefm.space</a> — jungle, dub, drum & bass, electronic</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-sm font-bold text-white mb-1">🎤 DJ</div>
              <p className="text-xs text-zinc-400">Stream live, get paid in crypto, no middleman. <a href="https://basefm.space/guide" className="text-orange-400 hover:text-orange-400">Apply →</a></p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-sm font-bold text-white mb-1">🏗️ Build</div>
              <p className="text-xs text-zinc-400">Fork, contribute, or run your own station. <a href="https://github.com/Eskyee/baseFM" className="text-orange-400 hover:text-orange-400">GitHub →</a></p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-sm font-bold text-white mb-1">🪙 Token</div>
              <p className="text-xs text-zinc-400">$RAVE on Base — community access + tipping. <a href="https://base.meme/coin/base:0x1DBf2954FFEC96a333ae20F00c0bC40471ad8888" className="text-orange-400 hover:text-orange-400">Get $RAVE →</a></p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">More Updates This Week</h3>
            <p className="text-sm text-zinc-400">
              This is just the start. We&apos;ve got more announcements coming this week — 
              new features, partnerships, and community initiatives. Stay tuned.
            </p>
          </div>

          <p className="text-zinc-400 text-sm">
            <a href="https://github.com/Eskyee/baseFM" className="text-white underline">github.com/Eskyee/baseFM</a> · 
            Built with love by <a href="https://base.app/profile/raveculture" className="text-white underline">RaveCulture</a> for Base Builders
          </p>
        </article>
      </div>
    </main>
  )
}
