import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Opengateway — One OpenAI-compatible endpoint for every model',
  description:
    'Generate an API key, swap your base URL, and route chat completions through the Agentbot gateway — provider failover, per-user usage tracking, and free Xiaomi MiMo access on one OpenAI-compatible endpoint.',
  openGraph: {
    title: 'Agentbot Opengateway — One endpoint, every model',
    description:
      'OpenAI-compatible LLM gateway with provider failover, hashed API keys, and live usage tracking. Swap your base URL and ship.',
    type: 'website',
    url: 'https://agentbot.sh/vercel-gateway',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot Opengateway — One endpoint, every model',
    description:
      'OpenAI-compatible LLM gateway with provider failover, hashed API keys, and live usage tracking.',
  },
}

export default function VercelGatewayLayout({ children }: { children: React.ReactNode }) {
  return children
}
