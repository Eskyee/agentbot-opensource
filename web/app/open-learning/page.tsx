import { Metadata } from 'next'
import { OpenLearning } from '@/app/components/landing'
import { PageHero } from '@/app/components/PageHero'

export const metadata: Metadata = {
  title: 'Open Learning — Agentbot',
  description: 'Agentbot is open-source by design. Learn, contribute, and build with us — welcoming developers from Africa, the Caribbean, and everywhere.',
}

export default function OpenLearningPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Open Learning"
        title="Learn by"
        highlight="Building"
        description="Open-source by design. Full documentation, contributor guides, and a welcoming community. Built for developers from everywhere."
        gradient="blue"
      />
      <OpenLearning />
    </main>
  )
}
