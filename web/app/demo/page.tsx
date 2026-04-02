import { Metadata } from 'next'
import { DemoVideo } from '@/app/components/landing'
import { PageHero } from '@/app/components/PageHero'

export const metadata: Metadata = {
  title: 'Demo — Agentbot',
  description: 'Watch Agentbot deploy a fully autonomous agent in 60 seconds. Connected to Telegram, powered by your API key, running 24/7.',
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Demo"
        title="Watch It"
        highlight="Come Alive"
        description="Deploy a fully autonomous agent in 60 seconds. Connected to your channel, powered by your key, running 24/7. No code required."
        gradient="amber"
      />
      <DemoVideo />
    </main>
  )
}
