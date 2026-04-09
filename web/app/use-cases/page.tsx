import { Metadata } from 'next'
import { UseCases } from '@/app/components/landing'
import { PageHero } from '@/app/components/PageHero'

export const metadata: Metadata = {
  title: 'Use Cases — Agentbot',
  description: 'Agentbot works across every industry — music, creative agencies, crypto communities, e-commerce, creator studios, and solo founders. Your 24/7 autonomous agent.',
}

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Use Cases"
        title="Built for Every"
        highlight="Kind of Operator"
        description="From solo creators to label crews — Agentbot adapts to your workflow. Music, crypto, e-commerce, agencies, studios. Your agent handles it."
        gradient="purple"
      />
      <UseCases />
    </main>
  )
}
