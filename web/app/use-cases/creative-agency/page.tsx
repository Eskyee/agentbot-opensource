import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Creative Agency — Agentbot Use Cases',
  description: 'Automate client outreach, contract generation, invoice tracking, and multi-channel comms for your entire team.',
}

export default function CreativeAgencyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero label="Use Case" title="Creative" highlight="Agency" description="Automate client outreach, contract generation, invoice tracking, and multi-channel comms for your entire team." gradient="blue" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Client Outreach', desc: 'Auto-draft and send proposals, follow-ups, and pitch decks via email and Telegram.' },
            { title: 'Contract Generation', desc: 'Generate contracts from templates, track signatures, and send reminders.' },
            { title: 'Invoice Tracking', desc: 'Create invoices, track payments, and send automated reminders for overdue bills.' },
            { title: 'Multi-Channel Comms', desc: 'Route all client messages from email, WhatsApp, and Slack to a single inbox.' },
            { title: 'Project Updates', desc: 'Auto-generate weekly client reports from task completion data.' },
            { title: 'Lead Scoring', desc: 'Score inbound leads based on engagement, budget, and fit. Prioritize outreach.' },
          ].map((f) => (
            <div key={f.title} className="border border-zinc-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboard?plan=collective" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Crew</Link>
          <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
        </div>
      </div>
    </main>
  )
}
