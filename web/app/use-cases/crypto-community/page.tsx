import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Crypto Community — Agentbot Use Cases',
  description: 'Answer token questions, market updates, and community FAQs. Gate access with onchain token ownership.',
}

export default function CryptoCommunityPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <section className="relative border-b border-zinc-900 overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-[150px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-20 sm:py-32">
          <div className="text-6xl sm:text-8xl mb-6">🪙</div>
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-6">Use Case</div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Crypto<br />
            <span className="text-zinc-700">Community</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-6">Answer token questions, market updates, and community FAQs. Gate access with onchain token ownership.</p>
        </div>
      </section>
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">What It Does</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {[
              { icon: '💬', title: 'Token Q&A', desc: 'Answer community questions about tokenomics, contracts, and roadmap 24/7.' },
              { icon: '📈', title: 'Market Updates', desc: 'Push real-time price alerts, volume updates, and whale movements.' },
              { icon: '🔐', title: 'Token Gating', desc: 'Gate exclusive channels behind onchain token ownership on Base.' },
              { icon: '🛡️', title: 'Community Moderation', desc: 'Auto-moderate Discord and Telegram — filter spam, answer FAQs.' },
              { icon: '🎁', title: 'Airdrop Coordination', desc: 'Manage eligibility, distribute tokens, handle claims autonomously.' },
              { icon: '💳', title: 'Onchain Payments', desc: 'Accept and send USDC via x402 protocol. Self-executing invoices.' },
            ].map((f) => (
              <div key={f.title} className="bg-black p-6 sm:p-8 group hover:bg-zinc-900/50 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Flash — BTCPay Integration */}
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="text-[10px] uppercase tracking-widest text-green-500 mb-4">⚡ Now Live</div>
          <div className="border border-green-900/50 bg-green-950/30 p-6 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">Native BTC Payments</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-2xl">
              <strong className="text-white">BTCPay Agentbot</strong> is live — a headless Bitcoin stack that gives your agents non-custodial wallets via NBXplorer. Accept Bitcoin payments, create agent wallets, settle A2A transactions. Your keys, your node, no intermediary.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/EskyLab/btcpayagentbot-docker" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-green-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-green-400 hover:text-white hover:border-green-600 transition-colors">Docker Repo</a>
              <a href="https://raveculture.mintlify.app/payments/btcpay" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-6">Ready to deploy?</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
            <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
