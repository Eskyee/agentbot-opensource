import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Solo Founder — Agentbot Use Cases',
  description: 'Your personal ops team — email triage, calendar management, web research, and autonomous task execution.',
}

export default function SoloFounderPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero label="Use Case" title="Solo" highlight="Founder" description="Your personal ops team — email triage, calendar management, web research, and autonomous task execution." gradient="blue" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Email Triage', desc: 'Sort, prioritize, and draft replies for your inbox. 50 emails/day on Collective plan.' },
            { title: 'Calendar Management', desc: 'Schedule meetings, send reminders, and handle rescheduling autonomously.' },
            { title: 'Web Research', desc: 'Research competitors, market trends, and potential partners. Auto-summarize findings.' },
            { title: 'Task Execution', desc: 'Execute recurring tasks — report generation, data entry, file organization.' },
            { title: 'Contract Review', desc: 'Analyze PDF contracts, extract key terms, and flag risks before signing.' },
            { title: 'Invoice Management', desc: 'Create and send invoices, track payments, and follow up on overdue bills.' },
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
