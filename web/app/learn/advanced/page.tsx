import Link from 'next/link';

const advancedTopics = [
  {
    category: 'Agent Architecture',
    items: [
      {
        title: 'Multi-Agent Swarms',
        description: 'Deploy teams of agents that collaborate. Shared memory, task delegation, consensus protocols. Build collective intelligence systems.',
        href: '/dashboard/swarms',
      },
      {
        title: 'Agent Identity & Wallets',
        description: 'Give agents their own onchain identity. CDP wallets, signing, autonomous transactions on Base.',
        href: '/dashboard/wallet',
      },
      {
        title: 'Custom Skills Development',
        description: 'Build reusable skills in TypeScript or Python. Publish to ClawHub. Version management, dependency injection, hot reload.',
        href: 'https://docs.openclaw.ai/skills',
      },
    ],
  },
  {
    category: 'Payments & Finance',
    items: [
      {
        title: 'x402 USDC Payments',
        description: 'Accept micropayments for your APIs. Onchain settlement on Base. Facilitator mode for A2A payments.',
        href: '/dashboard/x402',
      },
      {
        title: 'Tempo MPP Integration',
        description: 'Stripe-backed agent payments on Tempo blockchain. 100K+ TPS, 0.6s finality, no gas token. Enterprise-grade.',
        href: '/dashboard',
      },
      {
        title: 'Autonomous Trading',
        description: 'Connect Bankr, set strategies, let your agent trade. Risk management, stop-losses, portfolio rebalancing.',
        href: '/dashboard/trading',
      },
    ],
  },
  {
    category: 'Production & Scale',
    items: [
      {
        title: 'Security Hardening',
        description: 'Tool approval gates, rate limiting, input validation, encrypted env vars. Defense in depth for agent platforms.',
        href: '/dashboard/config',
      },
      {
        title: 'Monitoring & Observability',
        description: 'Real-time health checks, error tracking, cost dashboards. Know before your users do.',
        href: '/dashboard/system-pulse',
      },
      {
        title: 'Multi-Tenancy Architecture',
        description: 'Isolate users, sessions, and resources. Scale from 1 to 10,000 agents without rearchitecting.',
        href: '/dashboard/team',
      },
    ],
  },
  {
    category: 'Channels & Integrations',
    items: [
      {
        title: 'Channel Configuration',
        description: 'Telegram, Discord, Slack, WhatsApp, iMessage, Matrix, Feishu — each with custom behavior, routing, and group policies.',
        href: 'https://docs.openclaw.ai/channels',
      },
      {
        title: 'ACP Coding Sessions',
        description: 'Run Codex, Claude Code, or Gemini CLI directly in your chat. No context loss, no tab switching.',
        href: '/dashboard',
      },
      {
        title: 'Webhooks & External APIs',
        description: 'Connect your agent to any external system. REST, GraphQL, WebSocket. Custom middleware and auth.',
        href: 'https://docs.openclaw.ai/api',
      },
    ],
  },
  {
    category: 'Streaming & Media',
    items: [
      {
        title: 'DJ Streaming on baseFM',
        description: 'Go live as a human or AI DJ. Mux-powered, $RAVE-gated, onchain tips. The underground radio platform.',
        href: '/dashboard/dj-stream',
      },
      {
        title: 'TTS & Voice',
        description: 'ElevenLabs, OpenAI TTS, system voices. Give your agent a personality. Voice responses on any channel.',
        href: '/dashboard/config',
      },
      {
        title: 'Image Generation',
        description: 'DALL-E, MiniMax, Flux. Your agent can create images on demand. Aspect ratio control, style presets.',
        href: '/dashboard',
      },
    ],
  },
];

const codeExamples = [
  {
    title: 'Tool Approval Gate',
    code: `// openclaw.json
{
  "tools": {
    "exec": {
      "requireApproval": true
    }
  }
}`,
  },
  {
    title: 'Multi-Agent Config',
    code: `// Team provisioning
{
  "plan": "collective",
  "agents": [
    { "role": "researcher", "model": "claude-3.5" },
    { "role": "writer", "model": "gpt-4o" },
    { "role": "reviewer", "model": "deepseek-r1" }
  ],
  "sharedMemory": true
}`,
  },
  {
    title: 'x402 Payment Config',
    code: `// x402 gateway
{
  "price": "$0.01",
  "network": "base",
  "asset": "USDC",
  "recipient": "0x...",
  "settlement": "onchain"
}`,
  },
];

export default function LearnAdvancedPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/learn" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Learn</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">Advanced</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">Advanced Guides</h1>
          <p className="text-zinc-400 text-sm max-w-lg">
            Power user territory. Swarms, payments, production scale, and deep integrations.
          </p>
        </div>

        {/* Topic Sections */}
        {advancedTopics.map((section) => (
          <section key={section.category} className="mb-16">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter uppercase">{section.category}</h2>
            </div>
            <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
                >
                  <h3 className="text-sm font-bold tracking-tight mb-2 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Code Examples */}
        <section className="mb-16">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">Reference</span>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Configuration Examples</h2>
          </div>
          <div className="grid gap-px bg-zinc-800 md:grid-cols-3">
            {codeExamples.map((example) => (
              <div key={example.title} className="bg-black p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{example.title}</h3>
                <pre className="text-[11px] text-zinc-500 overflow-x-auto leading-relaxed">{example.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-3">Ready to Build?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-lg">
            Deploy your first agent in 60 seconds. Scale when you&apos;re ready.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/onboard"
              className="inline-block bg-white text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Deploy Now
            </Link>
            <Link
              href="/learn"
              className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
            >
              Back to Guides
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
