import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Fleet Subscriptions',
  description: 'Deploy AI agents on your own API keys. Underground £29/mo, Collective £69/mo, Label £199/mo. No markup on AI costs — BYOK infrastructure for autonomous agent fleets.',
  keywords: ['AI agent pricing', 'BYOK AI', 'agent hosting', 'Agentbot plans', 'autonomous agents', 'AI infrastructure'],
  openGraph: {
    title: 'Agentbot Pricing — Fleet Subscriptions',
    description: 'Deploy autonomous AI agents. Bring your own AI key, pay wholesale. From £29/mo.',
    url: 'https://agentbot.raveculture.xyz/pricing',
  },
  alternates: {
    canonical: 'https://agentbot.raveculture.xyz/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
