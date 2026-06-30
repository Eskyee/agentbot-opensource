'use client';

import Link from 'next/link';

const products = [
  {
    name: 'Playground',
    icon: '⚡',
    tagline: 'Build full-stack apps with AI',
    url: '/playground',
    description:
      'Describe what you want in plain English. The AI generates a complete Next.js app with code, preview, and deployment.',
    features: ['AI code generation', 'Live preview', 'One-click deploy', 'Full-stack support'],
  },
  {
    name: 'JSON Render',
    icon: '🎨',
    tagline: 'Generate UI from descriptions',
    url: '/json-render-playground',
    description:
      'Describe a UI in plain English. AI generates a JSON spec that renders as real React components.',
    features: [
      'Natural language prompts',
      'Real-time preview',
      'Export specs',
      'Custom components',
    ],
  },
  {
    name: 'Gateway',
    icon: '🔌',
    tagline: 'One API for all AI models',
    url: '/vercel-gateway',
    description:
      'OpenAI-compatible API that routes to any AI model. Use one endpoint for GPT-4, Claude, Gemini, MiMo, and more.',
    features: [
      'Multi-provider routing',
      'Failover handling',
      'Usage tracking',
      'OpenAI compatible',
    ],
  },
  {
    name: 'OpenClaw',
    icon: '🦞',
    tagline: '24/7 autonomous agent runtime',
    url: '/openclaw',
    description:
      'Run an AI agent that never sleeps. Connects to Telegram, Discord, WhatsApp, and X.',
    features: ['Always-on runtime', 'Multi-channel', 'Memory & skills', 'Auto-scaling'],
  },
  {
    name: 'Routines',
    icon: '⏰',
    tagline: 'Automate work with triggers',
    url: '/routines',
    description: 'Saved agent configurations that run on schedule, API calls, or GitHub events.',
    features: ['Scheduled runs', 'API triggers', 'GitHub events', '6 templates'],
  },
  {
    name: 'Automations',
    icon: '🔄',
    tagline: 'Event-driven workflows with MCP',
    url: '/automations',
    description: 'Connect to Slack, GitHub, Linear, Sentry, Datadog and automate responses.',
    features: ['9 templates', '8 MCP platforms', 'Webhook support', 'Custom prompts'],
  },
  {
    name: 'Chat Platforms',
    icon: '💬',
    tagline: 'Slack, Teams, Linear, GitHub bots',
    url: '/chat-platforms',
    description: 'Connect your agents to messaging platforms with AI-powered responses.',
    features: ['Slack integration', 'Teams support', 'Linear automation', 'GitHub bots'],
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-black font-mono overflow-x-hidden pt-14">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Products
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Build · Automate · Deploy
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Agentbot <span className="text-orange-500">Products</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Everything you need to build, deploy, and run AI agents. One platform, five products.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition-colors hover:bg-zinc-200"
            >
              Get Started
            </Link>
            <Link
              href="/pricing"
              className="border border-zinc-700 px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 pb-24">
        <div className="grid gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="border border-zinc-800 bg-zinc-950 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{product.icon}</span>
                <div>
                  <h2 className="font-bold text-white">{product.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-orange-500">
                    {product.tagline}
                  </p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{product.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {product.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-[10px] px-2 py-1 bg-zinc-800 rounded text-zinc-400"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <Link
                href={product.url}
                className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Try {product.name} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
