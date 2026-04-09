import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smashing Code — 15 Features in 30 Commits — Agentbot',
  description: 'Blockchain Buddies, Solana integration, Bitcoin mainnet, Git City 3D viz, Expert Setup bookings, Jobs Board, and more. A full rundown of what shipped in the last 30 commits.',
  keywords: ['AI agents', 'Solana', 'Bitcoin', 'Blockchain Buddies', 'Git City', 'platform update'],
  openGraph: {
    title: 'Smashing Code — 15 Features in 30 Commits',
    description: 'Blockchain Buddies, Solana, Bitcoin mainnet, Git City, and more. Full rundown of what shipped.',
    url: 'https://agentbot.sh/blog/posts/smashing-code-apr-9',
  },
}

export default function SmashingCodePost() {
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
              Smashing Code — 15 Features in 30 Commits
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-orange-800/50 text-zinc-400">Shipping</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Platform</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Update</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            We&apos;ve been shipping hard. Here&apos;s everything that landed in the last 30 commits — 
            78 dashboard pages, 130+ API routes, 12 music-industry skills. No filler, just features.
          </p>

          <div className="space-y-6 mb-12">
            <FeatureCard
              emoji="🐣"
              title="Blockchain Buddies"
              desc="Tamagotchi-style agent pets with Prisma persistence. Hatch, feed, play, level up. Five types from Agentbot Baby (common) to Alien Agent (legendary). Authenticated users get DB storage, everyone else gets localStorage."
            />
            <FeatureCard
              emoji="🔗"
              title="Solana Integration"
              desc="Full Solana toolkit: Jupiter token swaps, SPL token deployment, Metaplex NFT minting. Solana Agent Kit model via MCP tools. Wallet lookup with balance display."
            />
            <FeatureCard
              emoji="📅"
              title="Expert Setup Booking"
              desc="Paid 1-on-1 setup sessions with Stripe checkout. Calendar slot picker, screen share, custom agent configuration, integration guidance. Book at /expert-setup."
            />
            <FeatureCard
              emoji="🎮"
              title="Playground"
              desc="AI-powered app generation. Describe what you want, get HTML/JS code with live preview. Template-based now, real AI generation coming. Preview in iframe, copy, or download."
            />
            <FeatureCard
              emoji="₿"
              title="Bitcoin Mainnet"
              desc="Full mainnet Bitcoin dashboard. Blockstream Jade hardware wallet support (USB + QR). Liquid Network (L-BTC) integration via LWK. NBXplorer backend on Railway."
            />
            <FeatureCard
              emoji="🏙️"
              title="Git City"
              desc="3D cityscape built from GitHub commit history using Three.js and React Three Fiber. Buildings represent days, height shows commit count, color indicates activity. Click for details."
            />
            <FeatureCard
              emoji="💼"
              title="Jobs Board"
              desc="AI agent job listings with filtering by role type, seniority, contract type, and tech stack. Company profiles, external job aggregation, and an apply flow."
            />
            <FeatureCard
              emoji="🎬"
              title="Video Generation"
              desc="Four video types: demo, marketing, screenshot animation, and tutorial. Uploads to Vercel Blob storage. Authenticated, paid API with 5-minute max duration."
            />
            <FeatureCard
              emoji="🎵"
              title="Music Generation"
              desc="API route and UI in place. Planned integrations: Google Lyria, MiniMax, ComfyUI workflows. Coming soon."
            />
            <FeatureCard
              emoji="📦"
              title="Turborepo 2.9"
              desc="Monorepo build orchestration. Tasks: build, lint, test, dev, deploy. Dependency-aware caching. Outputs: dist/, .next/."
            />
            <FeatureCard
              emoji="🔑"
              title="Passkeys"
              desc="WebAuthn passwordless authentication. Register and authenticate with passkeys — no passwords needed."
            />
            <FeatureCard
              emoji="🌐"
              title="Showcase"
              desc="Public agent discovery page. Agent cards with capabilities, pricing, and status. Browse and try agents."
            />
            <FeatureCard
              emoji="🎁"
              title="Referral System"
              desc="Referral code generation and tracking. Apply codes at signup. Track referral stats."
            />
            <FeatureCard
              emoji="🏷️"
              title="Rebrand"
              desc="All competitor references replaced with Agentbot. Consistent branding across the platform."
            />
            <FeatureCard
              emoji="📝"
              title="Blog Posts"
              desc="Three new posts: Showcase Trials Live, April 8 Update, and Cybersecurity in the Age of AI."
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold uppercase tracking-tight mb-3">By the Numbers</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white">78</div>
                <div className="text-xs text-zinc-500 uppercase">Dashboard Pages</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">130+</div>
                <div className="text-xs text-zinc-500 uppercase">API Routes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">12</div>
                <div className="text-xs text-zinc-500 uppercase">Music Skills</div>
              </div>
            </div>
          </div>

          <p className="text-zinc-400 text-sm">
            Built on <Link href="https://openclaw.ai" className="text-white underline">OpenClaw</Link>. 
            Deployed on Base. Operated from London on a Mac mini.
          </p>
        </article>
      </div>
    </main>
  )
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{emoji}</span>
        <div>
          <h3 className="font-bold text-white mb-1">{title}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}
