import { Metadata } from 'next'
import { OpenLearning } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Open Learning — Agentbot',
  description: 'Agentbot is open-source by design. Learn, contribute, and build with us — welcoming developers from Africa, the Caribbean, and everywhere.',
}

export default function OpenLearningPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <OpenLearning />
    </main>
  )
}
