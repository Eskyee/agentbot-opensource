import { Metadata } from 'next'
import { CapabilitiesTicker } from '@/app/components/landing'
import { PageHero } from '@/app/components/PageHero'

export const metadata: Metadata = {
  title: 'Capabilities — Agentbot',
  description: 'From email triage to code deployment — your Agentbot handles 24+ autonomous capabilities out of the box. Summarize, reply, schedule, research, deploy.',
}

export default function CapabilitiesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Capabilities"
        title="Everything Your"
        highlight="Agent Can Do"
        description="24 autonomous capabilities, each running 24/7. Your agent doesn't sleep, doesn't forget, and doesn't need permission for routine tasks."
        gradient="green"
      />
      <CapabilitiesTicker />
    </main>
  )
}
