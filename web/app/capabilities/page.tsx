import { Metadata } from 'next'
import { CapabilitiesTicker } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Capabilities — Agentbot',
  description: 'From email triage to code deployment — your Agentbot handles 24+ autonomous capabilities out of the box. Summarize, reply, schedule, research, deploy.',
}

export default function CapabilitiesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Capabilities</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            Everything Your<br />
            <span className="text-zinc-700">Agent Can Do</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-4 max-w-md">
            24 autonomous capabilities, each running 24/7. Your agent doesn&apos;t sleep, doesn&apos;t forget, and doesn&apos;t need permission for routine tasks.
          </p>
        </div>
      </div>
      <CapabilitiesTicker />
    </main>
  )
}
