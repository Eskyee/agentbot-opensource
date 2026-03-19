import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why Agentbot? — Creative Crew + Business Operations',
  description: 'Dual-agent AI: Agentbot (fan engagement, promo, music) + OpenClaw (email, contracts, invoicing). 24/7 uptime, instant skills, multi-channel. From £29/mo.',
  keywords: ['why Agentbot', 'AI agent cloud hosting', 'OpenClaw cloud', 'deploy AI agent', 'BYOK AI agent', 'Agentbot vs OpenClaw'],
  openGraph: {
    title: 'Why Agentbot? One Creative Crew, One Business Mind',
    description: 'Agentbot handles your fans. OpenClaw handles your inbox. Both run on Base, paid in USDC.',
    url: 'https://agentbot.raveculture.xyz/why',
  },
  alternates: { canonical: 'https://agentbot.raveculture.xyz/why' },
}

const PRICE_START = "£29/mo";

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is the difference between Agentbot and OpenClaw?', acceptedAnswer: { '@type': 'Answer', text: 'Agentbot = Creative Crew (fan engagement, promo, music, A&R, artwork). OpenClaw = Business Operations (email inbox, contract analysis, gig scraping, x402 invoicing). Solo tier gets Agentbot only. Collective+ includes OpenClaw seats.' } },
    { '@type': 'Question', name: 'Is Agentbot free?', acceptedAnswer: { '@type': 'Answer', text: 'Plans start at £29/mo for Solo (Agentbot creative only). Collective at £69 adds 1 OpenClaw seat (digital tour manager).' } },
    { '@type': 'Question', name: 'What is Agentbot?', acceptedAnswer: { '@type': 'Answer', text: 'Agentbot is a cloud-based AI assistant platform that deploys OpenClaw to the cloud in one click. You get a 24/7 personal AI assistant with long-term memory, customizable personality, ready-to-use skills, and multi-channel access via Telegram, Discord, and WhatsApp.' } },
    { '@type': 'Question', name: 'Can Agentbot handle crypto transactions?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Agentbot integrates with Coinbase Agentic Wallet, enabling your agent to execute onchain transactions autonomously.' } },
    { '@type': 'Question', name: 'Can I deploy a pre-configured agent?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Visit the marketplace to browse pre-configured agent templates including basefmbot, cafe, chain, and more.' } },
  ],
}

const comparisonRows = [
  { feature: 'Setup Complexity', agentbot: 'One-click cloud setup, ready in seconds', local: 'Manual installation: terminal, API config, dependencies' },
  { feature: 'Hardware', agentbot: 'Zero, fully cloud-hosted', local: 'Requires always-on machine or VPS' },
  { feature: 'Skills Access', agentbot: 'Instant pre-built skills, no manual install', local: 'Install skills one by one from ClawHub' },
  { feature: 'Uptime', agentbot: '24/7 always-online in the cloud', local: 'Only runs when your computer is on' },
  { feature: 'Storage', agentbot: '10GB free, 50GB pro', local: 'Limited by local disk' },
  { feature: 'Channels', agentbot: 'Telegram, Discord, WhatsApp', local: 'Manual integration required' },
  { feature: 'Cost', agentbot: PRICE_START, local: 'VPS costs or dedicated hardware' },
]

const features = [
  { title: 'Persistent Memory', desc: 'Remembers preferences, work style, and past conversations across sessions. Customize its persona — name, tone, output format.' },
  { title: 'Scheduled Tasks', desc: 'Run tasks on a schedule. Market news at 9 AM, weekly reports on Friday, daily reminders. No manual triggers.' },
  { title: 'Ready-to-Use Skills', desc: 'Pre-built skills for web search, data analysis, image processing, coding. Chain them in workflows.' },
  { title: 'Cloud Storage', desc: '10GB free (50GB pro). Save documents, retrieve past work, maintain file history from any device.' },
  { title: 'Kimi K2.5 Thinking', desc: '128K context window. Advanced reasoning for complex tasks, financial analysis, competitive research.' },
  { title: 'Multi-Channel', desc: 'Deploys to Telegram, Discord, and WhatsApp. One agent, accessible everywhere, same memory across all channels.' },
  { title: 'Coinbase Wallet', desc: 'Execute onchain transactions autonomously. Send payments, interact with smart contracts, manage crypto assets.' },
  { title: 'Marketplace', desc: 'Pre-configured agent templates: basefmbot, cafe, studio-one, chain, vault, pay. Deploy in one click.' },
]

const faqs = [
  { q: 'Is Agentbot free?', a: `Plans start at ${PRICE_START} for the Solo plan. If you already run OpenClaw locally, you can link it to Agentbot for free.` },
  { q: 'Can I use the terminal?', a: 'Terminal UI is coming soon. For now, send commands via chat (Telegram, Discord, WhatsApp).' },
  { q: 'What if Agentbot doesn\'t respond?', a: 'Refresh your chat or go to Dashboard and click "Restart Agent." If neither works, contact support.' },
  { q: 'Can Agentbot send files?', a: 'Yes. Files sent directly through Telegram, Discord, WhatsApp. Also accessible via cloud storage dashboard.' },
  { q: 'Can it handle crypto?', a: 'Yes. Coinbase Agentic Wallet integration for onchain transactions, DeFi, NFT minting, token swaps.' },
  { q: 'Can I deploy a pre-configured agent?', a: 'Yes. Browse the marketplace for templates: basefmbot, cafe, studio-one, chain, vault, pay.' },
]

export default function WhyAgentbotPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
            Why Agentbot
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Cloud Agents,<br />
            <span className="text-zinc-700">Zero Friction</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-8">
            Local OpenClaw agents are powerful, but they come with real friction. Dependencies, API keys, always-on machines. Agentbot removes all of that — deploy to the cloud in one click, run 24/7 without hardware.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Comparison</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-900">
                  <th className="text-left py-3 pr-8 text-[10px] uppercase tracking-widest text-zinc-600 font-normal">Feature</th>
                  <th className="text-left py-3 pr-8 text-[10px] uppercase tracking-widest text-zinc-600 font-normal">Agentbot (Cloud)</th>
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-zinc-600 font-normal">Local OpenClaw</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-900/50">
                    <td className="py-3 pr-8 text-zinc-400 font-bold">{row.feature}</td>
                    <td className="py-3 pr-8 text-zinc-300">{row.agentbot}</td>
                    <td className="py-3 text-zinc-600">{row.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Capabilities</div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-12">
            Features That<br /><span className="text-zinc-700">Actually Matter</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {features.map((f) => (
              <div key={f.title} className="bg-black p-8">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Getting Started</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-12">
              How To Use<br /><span className="text-zinc-700">Agentbot</span>
            </h2>
            <div className="space-y-12">
              {[
                { step: '01', title: 'Create or Link', desc: 'Deploy a fresh OpenClaw instance, link an existing one, or choose a marketplace template. Takes about one minute.' },
                { step: '02', title: 'Customize Personality', desc: 'Set name, role, speaking style, output format. From formal analyst to casual assistant. One instruction.' },
                { step: '03', title: 'Use Skills', desc: 'Pre-built skills for data analysis, web search, image processing, coding. Chain multiple skills in a single workflow.' },
                { step: '04', title: 'Schedule Tasks', desc: 'At [time], do [task], output [format], follow [constraints]. Runs automatically, no manual triggers.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-8">
                  <div className="text-blue-500 text-[10px] uppercase tracking-widest pt-1 shrink-0">{s.step}</div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2">{s.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Support</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-12">
              Questions &<br /><span className="text-zinc-700">Answers</span>
            </h2>
            <div className="divide-y divide-zinc-900">
              {faqs.map((faq, i) => (
                <div key={i} className="py-6">
                  <dt className="text-sm font-bold uppercase tracking-wider">{faq.q}</dt>
                  <dd className="mt-2 text-xs text-zinc-500 leading-relaxed">{faq.a}</dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">
                Ready to Deploy<br /><span className="text-zinc-700">Your Agent?</span>
              </h2>
              <p className="text-zinc-500 text-sm mt-4">Start from {PRICE_START} with full access.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Get Started
              </Link>
              <Link href="/marketplace" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
