import { Metadata } from 'next'
import { DemoVideo } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Demo — Agentbot',
  description: 'Watch Agentbot deploy a fully autonomous agent in 60 seconds. Connected to Telegram, powered by your API key, running 24/7.',
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <DemoVideo />
    </main>
  )
}
