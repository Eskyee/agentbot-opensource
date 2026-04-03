import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Crypto Community — Agentbot Use Cases',
  description: 'Answer token questions, market updates, and community FAQs. Gate access with onchain token ownership.',
}

export default function CryptoCommunityPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero label="Use Case" title="Crypto" highlight="Community" description="Answer token questions, market updates, and community FAQs. Gate access with onchain token ownership." gradient="green" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Token Q&A', desc: 'Answer community questions about tokenomics, contracts, and roadmap 24/7.' },
            { title: 'Market Updates', desc: 'Push real-time price alerts, volume updates, and whale movements to Telegram/Discord.' },
            { title: 'Token Gating', desc: 'Gate exclusive channels and content behind onchain token ownership on Base.' },
            { title: 'Community Moderation', desc: 'Auto-moderate Discord and Telegram — filter spam, answer FAQs, enforce rules.' },
            { title: 'Airdrop Coordination', desc: 'Manage airdrop eligibility, distribute tokens, and handle claims autonomously.' },
            { title: 'Onchain Payments', desc: 'Accept and send USDC payments via x402 protocol. Self-executing invoices.' },
          ].map((f) => (
            <div key={f.title} className="border border-zinc-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
          <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
        </div>
      </div>
    </main>
  )
}
