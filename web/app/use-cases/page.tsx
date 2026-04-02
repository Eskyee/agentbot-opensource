import { Metadata } from 'next'
import { UseCases } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Use Cases — Agentbot',
  description: 'Agentbot works across every industry — music, creative agencies, crypto communities, e-commerce, creator studios, and solo founders. Your 24/7 autonomous agent.',
}

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <UseCases />
    </main>
  )
}
