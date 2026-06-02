import Link from 'next/link'

export const metadata = {
  title: 'How Agentbot Built the First MiMo-Native Agent Platform',
  description: 'A technical deep-dive into how Agentbot migrated from OpenRouter to direct Xiaomi MiMo V2.5 integration — achieving 99% cost reduction and 3x faster inference for AI agents.',
  openGraph: {
    title: 'How Agentbot Built the First MiMo-Native Agent Platform',
    description: '99% cost reduction. 1M token context. Direct MiMo V2.5 integration. How we built the fastest, cheapest AI agent platform.',
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        {/* Header */}
        <div className="mb-12">
          <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            ← Blog
          </Link>
          <div className="flex flex-wrap gap-2 mt-6 mb-4">
            <span className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              MiMo Integration
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Technical Deep-Dive
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95] mt-8">
            How Agentbot Built the<br />
            <span className="text-orange-500">First MiMo-Native</span><br />
            Agent Platform
          </h1>
          <p className="text-zinc-500 text-sm mt-6">
            June 2, 2026 · 8 min read
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <p>
            When Xiaomi announced the MiMo V2.5 series with a 99% price reduction and 82 billion
            token plans, we saw an opportunity to build something no one else had: a managed AI agent
            platform where inference costs essentially disappear.
          </p>

          <p>
            Agentbot is the first platform to integrate MiMo as a <strong className="text-white">direct upstream provider</strong> —
            not through OpenRouter, not through a proxy, but straight to{' '}
            <code className="text-orange-500">token-plan-ams.xiaomimimo.com</code>. Every agent
            deployed on Agentbot runs on MiMo V2.5 Pro by default. No per-token charges. No surprise bills.
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            The Problem: Inference Costs Were Killing Us
          </h2>

          <p>
            Like every AI startup, we started on OpenRouter. GPT-4o, Claude Sonnet, Llama —
            the usual suspects. Our users were paying £29/month for a managed agent, and we were
            eating the inference costs. At scale, the math didn't work. A single active agent could
            burn through £5-10/day in API costs.
          </p>

          <p>
            We needed a model that was fast, smart, and cheap. MiMo V2.5 Pro checked every box.
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            The Integration: Direct, Not Proxied
          </h2>

          <p>
            Most platforms route through OpenRouter or Vercel AI Gateway. We ripped that out and
            connected directly to Xiaomi's inference endpoint:
          </p>

          <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs overflow-x-auto">
{`// opengateway.ts — MiMo direct upstream
const MIMO_BASE_URL = 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = process.env.MIMO_API_KEY

function resolveGatewayUpstreams(): UpstreamConfig[] {
  const upstreams: UpstreamConfig[] = []

  // Direct MiMo — first priority, zero middleman
  if (MIMO_API_KEY) {
    upstreams.push({
      baseUrl: MIMO_BASE_URL,
      apiKey: MIMO_API_KEY,
      provider: 'xiaomi-direct',
    })
  }

  // OpenRouter — fallback only
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    upstreams.push({
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      provider: 'openrouter',
    })
  }

  return upstreams
}`}
          </pre>

          <p>
            The gateway tries MiMo first. If it fails (rate limit, timeout), it falls back to
            OpenRouter. In practice, MiMo hasn't failed yet.
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            BYOK: Users Bring Their Own MiMo Subscription
          </h2>

          <p>
            Power users can buy their own MiMo Max Monthly Plan (82B credits, ~$20/month) and
            paste their API key in Settings → BYOK. The gateway validates the key live against
            MiMo's API, stores it, and routes all their agent's requests through their personal
            subscription. Zero platform cost. Full speed.
          </p>

          <p>
            This is the first BYOK system for a Chinese AI model on a Western agent platform.
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            The Numbers
          </h2>

          <div className="grid grid-cols-2 gap-px bg-zinc-900 my-8">
            {[
              { metric: '99%', label: 'Cost reduction vs GPT-5.5' },
              { metric: '1M', label: 'Token context window' },
              { metric: '150+', label: 'Tokens/second inference' },
              { metric: '82B', label: 'Credits/month on Token Plan' },
            ].map((item) => (
              <div key={item.metric} className="bg-black p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500">{item.metric}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2">{item.label}</div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            What This Means for Agent Platforms
          </h2>

          <p>
            MiMo V2.5 changes the economics of AI agents entirely. When inference costs drop 99%,
            you can offer agents at flat monthly rates instead of per-token billing. Users don't
            think about usage. They just use their agent.
          </p>

          <p>
            The V2.5 series also brings multimodality (images + text), 256K-1M context windows,
            built-in reasoning, and TTS models included free. This isn't a budget model — it's a
            frontier model at budget prices.
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            Open Source
          </h2>

          <p>
            We've open-sourced our MiMo integration layer. If you're building an agent platform,
            a coding assistant, or any AI product that needs fast, cheap inference — you can use
            our integration code directly:
          </p>

          <p>
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 underline"
            >
              github.com/Eskyee/agentbot-opensource
            </a>
          </p>

          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            What's Next
          </h2>

          <p>
            We're working with the MiMo team on deeper integration: native TTS for agent voices,
            ASR for voice commands, and multimodal analysis for image-heavy workflows. The goal is
            an agent that can see, speak, listen, and think — all through MiMo.
          </p>

          <p>
            Agentbot is live at{' '}
            <a href="https://agentbot.sh" className="text-orange-500 hover:text-orange-400 underline">
              agentbot.sh
            </a>. Every agent runs on MiMo V2.5 Pro. Every plan includes inference. No per-token charges.
          </p>

          <p className="text-zinc-500 text-xs pt-8 border-t border-zinc-900">
            Written by the Agentbot team. Powered by MiMo. Built on OpenClaw.
          </p>
        </div>
      </article>
    </main>
  )
}
