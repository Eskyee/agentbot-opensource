import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Open Source Multi-Tenant AI Agent Platform — Agentbot',
  description: 'How we built Agentbot with Docker isolation, BYOK AI, USDC payments on Base, and a skill marketplace. MIT licensed.',
  keywords: ['open source', 'multi-tenant', 'AI agents', 'architecture', 'docker'],
  openGraph: {
    title: 'Open Source Multi-Tenant AI Agent Platform',
    description: 'How we built Agentbot — Docker isolation, BYOK, USDC on Base, skills.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/open-source-multi-tenant-architecture',
  },
}

export default function OpenSourceArchitecture() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">7 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Open Source Multi-Tenant AI Agent Platform
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Architecture</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Engineering</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            We&apos;ve open sourced the Agentbot platform — a production-ready multi-tenant system for deploying 
            and managing AI agents at scale. Here&apos;s how it works.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Core Architecture
          </h2>
          <p className="text-zinc-300 mb-4">
            Each agent runs in its own <strong className="text-white">isolated Docker container</strong>. 
            This provides:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Memory isolation</strong> — No data leakage between agents</li>
            <li><strong className="text-white">Resource limits</strong> — CPU, memory caps per agent</li>
            <li><strong className="text-white">Channel isolation</strong> — Telegram, Discord, WhatsApp configs separate</li>
            <li><strong className="text-white">Wallet isolation</strong> — Each agent has its own USDC wallet on Base</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            BYOK AI
          </h2>
          <p className="text-zinc-300 mb-4">
            Agents are <strong className="text-white">BYOK (Bring Your Own Key)</strong>. Users provide their 
            OpenRouter, Anthropic, OpenAI, or other API keys. We don&apos;t markup — you pay your provider directly.
          </p>
          <p className="text-zinc-300 mb-4">
            This keeps the platform lightweight while giving users full control over their AI spend.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            USDC Payments on Base
          </h2>
          <p className="text-zinc-300 mb-4">
            Every agent gets a <strong className="text-white">USDC wallet on Base</strong> via Coinbase CDP. 
            Agents can:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>Receive payments for services</li>
            <li>Pay for APIs autonomously via x402 micropayments</li>
            <li>Send/receive USDC without human intervention</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Skill Marketplace
          </h2>
          <p className="text-zinc-300 mb-4">
            Installable skills extend agent capabilities. Available skills include:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>instant-split — Split payments automatically</li>
            <li>venue-finder — Find venues for gigs</li>
            <li>royalty-tracker — Track streaming royalties</li>
            <li>setlist-oracle — Build DJ sets with BPM/key analysis</li>
            <li>visual-synthesizer — Generate release artwork</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Open Source
          </h2>
          <p className="text-zinc-300 mb-4">
            The platform is MIT licensed. Fork it, run it yourself, or use our hosted version.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-400 text-sm">
              <a href="https://github.com/Eskyee/agentbot-opensource" className="text-blue-400 hover:text-white">
                github.com/Eskyee/agentbot-opensource →
              </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}