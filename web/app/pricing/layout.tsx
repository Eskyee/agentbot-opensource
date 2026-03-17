import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Agentbot + OpenClaw',
  description: 'Dual-agent architecture: Agentbot (Creative Crew) + OpenClaw (Business Ops). Solo £29, Collective £69 (+ tour manager), Label £149 (full back office), Network £499. BYOK — no markup on AI costs.',
  keywords: ['AI agent pricing', 'BYOK AI', 'agent hosting', 'Agentbot plans', 'OpenClaw pricing', 'autonomous agents', 'AI infrastructure'],
  openGraph: {
    title: 'Agentbot Pricing — One Creative Crew, One Business Mind',
    description: 'Agentbot handles your fans. OpenClaw handles your inbox. From £29/mo.',
    url: 'https://agentbot.raveculture.xyz/pricing',
  },
  alternates: {
    canonical: 'https://agentbot.raveculture.xyz/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
