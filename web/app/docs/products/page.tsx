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
    howItWorks: [
      'Type a prompt like "Build a SaaS pricing page"',
      'AI generates the full app code in real-time',
      'See live preview as the code is written',
      'Edit code directly or ask AI to iterate',
      'Deploy to Vercel with one click',
    ],
    diagram: `┌─────────────────────────────────────┐
│           USER PROMPT               │
│  "Build a pricing page with 3 tiers"│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         AI CODE GENERATION          │
│  • Generates React components        │
│  • Creates API routes                │
│  • Writes styles & logic             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          LIVE PREVIEW               │
│  ┌─────────┐  ┌─────────────────┐   │
│  │ Code    │  │  Live Preview   │   │
│  │ Editor  │  │  ┌──┬──┬──┐    │   │
│  │         │  │  │Fr│Pr│En│    │   │
│  │         │  │  └──┴──┴──┘    │   │
│  └─────────┘  └─────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        DEPLOY TO VERCEL             │
│  your-app.vercel.app                │
└─────────────────────────────────────┘`,
    bestFor: [
      'Non-technical founders',
      'Rapid prototyping',
      'MVP creation',
      'Learning React/Next.js',
    ],
  },
  {
    name: 'JSON Render',
    icon: '🎨',
    tagline: 'Generate UI from natural language',
    url: '/json-render-playground',
    description:
      'Describe a UI in plain English. AI generates a JSON spec that renders as real React components. Edit the JSON or let AI iterate.',
    howItWorks: [
      'Type a description like "Dashboard with 4 metric cards"',
      'AI generates a JSON spec with components and props',
      'See the UI render live in the preview panel',
      'Edit the JSON directly or ask AI to change it',
      'Export the spec or integrate into your app',
    ],
    diagram: `┌─────────────────────────────────────┐
│           USER PROMPT               │
│  "Dashboard with 4 metric cards"     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         AI GENERATES JSON           │
│  {                                  │
│    "root": "card-1",                │
│    "elements": {                    │
│      "card-1": {                    │
│        "type": "Card",              │
│        "props": {"title": "Metrics"}│
│      }                              │
│    }                                │
│  }                                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     LIVE COMPONENT RENDERING        │
│  ┌─────────────────────────────┐    │
│  │ ┌─────┐ ┌─────┐ ┌─────┐   │    │
│  │ │ 99% │ │ 12K │ │ $4K │   │    │
│  │ │ Up  │ │ Req │ │ Rev │   │    │
│  │ └─────┘ └─────┘ └─────┘   │    │
│  └─────────────────────────────┘    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  USE IN YOUR APP OR EXPORT          │
│  • Import spec into any React app   │
│  • Use with AI SDK for streaming    │
│  • Integrate into agent responses   │
└─────────────────────────────────────┘`,
    bestFor: ['Dynamic dashboards', 'Agent UIs', 'Rapid prototyping', 'AI-powered interfaces'],
  },
  {
    name: 'Gateway',
    icon: '🔌',
    tagline: 'One API for all AI models',
    url: '/vercel-gateway',
    description:
      'OpenAI-compatible API that routes to any AI model. Use one endpoint for GPT-4, Claude, Gemini, MiMo, and more.',
    howItWorks: [
      'Send requests to /v1/chat/completions (OpenAI format)',
      'Gateway routes to the best model for your task',
      'Automatic fallback if one provider is down',
      'Usage tracking and billing per request',
      'Works with any OpenAI-compatible client',
    ],
    diagram: `┌─────────────────────────────────────┐
│     YOUR APP / AGENT                │
│  POST /v1/chat/completions          │
│  { model: "gpt-4o", messages: [...] }│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      AGENTBOT GATEWAY               │
│  ┌──────────────────────────────┐   │
│  │ • Auth & rate limiting       │   │
│  │ • Model routing              │   │
│  │ • Cost optimization          │   │
│  │ • Usage tracking             │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌───────┐ ┌─────┐ ┌─────┐
   │ OpenAI│ │Anthr│ │Other│
   │  GPT  │ │ropic│ │ ... │
   └───────┘ └─────┘ └─────┘`,
    bestFor: ['Multi-model apps', 'Cost optimization', 'Provider failover', 'Usage analytics'],
  },
  {
    name: 'OpenClaw',
    icon: '🦞',
    tagline: '24/7 autonomous agent runtime',
    url: '/openclaw',
    description:
      'Run an AI agent that never sleeps. Connects to Telegram, Discord, WhatsApp, and X. Does things on your behalf while you sleep.',
    howItWorks: [
      'Deploy an agent with a personality and skills',
      'Agent connects to your messaging platforms',
      'Users interact with your agent via chat',
      'Agent can search web, run code, manage files',
      'Agent learns and improves over time',
    ],
    diagram: `┌─────────────────────────────────────┐
│         DEPLOY YOUR AGENT           │
│  • Set personality & skills         │
│  • Connect messaging platforms      │
│  • Define what agent can do         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       OPENCLAW RUNTIME              │
│  ┌──────────────────────────────┐   │
│  │ 🦞 Agent Brain               │   │
│  │ • Memory & context           │   │
│  │ • Tool use (code, web, etc)  │   │
│  │ • Personality & voice        │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
       ┌───────┼───────┐───────┐
       ▼       ▼       ▼       ▼
   ┌───────┐ ┌─────┐ ┌─────┐ ┌───┐
   │Tele-  │ │Disc-│ │What-│ │ X │
   │gram   │ │ord  │ │sApp │ │   │
   └───────┘ └─────┘ └─────┘ └───┘`,
    bestFor: ['Customer support', 'Community management', 'Personal assistants', 'Always-on bots'],
  },
];

export default function ProductsDocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Agentbot Products</h1>
          <p className="text-zinc-400 text-lg">
            Everything you need to build, deploy, and run AI agents. Here&apos;s what each product
            does and when to use it.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="mb-16 border border-zinc-800 rounded-xl p-6 bg-zinc-950">
          <h2 className="text-lg font-bold mb-4">How It All Fits Together</h2>
          <pre className="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto">
            {`┌─────────────────────────────────────────────────────────────────┐
│                        AGENTBOT PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Playground  │  │ JSON Render  │  │    Coding Agent       │   │
│  │  Build apps  │  │  Generate UI │  │  Write & ship code    │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                           │
│              │      GATEWAY          │                           │
│              │  One API, all models  │                           │
│              └───────────┬───────────┘                           │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                           │
│              │      OPENCLAW         │                           │
│              │   24/7 Agent Runtime  │                           │
│              │  Telegram/Discord/WhatsApp/X                      │
│              └───────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>

        {/* Products */}
        <div className="space-y-16">
          {products.map((product, i) => (
            <div key={product.name} id={product.name.toLowerCase().replace(' ', '-')}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{product.icon}</span>
                <h2 className="text-2xl font-bold">{product.name}</h2>
              </div>
              <p className="text-zinc-500 text-sm mb-4">{product.tagline}</p>
              <p className="text-zinc-300 mb-6">{product.description}</p>

              {/* How it works */}
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  How It Works
                </h3>
                <ol className="space-y-2">
                  {product.howItWorks.map((step, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-orange-500 font-mono text-xs mt-0.5">{j + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Diagram */}
              <div className="mb-6 border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <pre className="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto">
                  {product.diagram}
                </pre>
              </div>

              {/* Best for */}
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Best For
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.bestFor.map((use) => (
                    <span
                      key={use}
                      className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={product.url}
                className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Try {product.name} →
              </Link>

              {i < products.length - 1 && <div className="mt-16 border-t border-zinc-900" />}
            </div>
          ))}
        </div>

        {/* Quick start guide */}
        <div className="mt-20 border-t border-zinc-900 pt-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guide</h2>

          <div className="space-y-8">
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h3 className="font-bold mb-3">1. Sign Up</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Create an account at{' '}
                <Link href="/signup" className="text-orange-500 hover:text-orange-400">
                  agentbot.sh/signup
                </Link>
                . Free tier includes 10 generations per day.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h3 className="font-bold mb-3">2. Pick a Product</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400">
                <div>
                  <p className="text-white font-medium">Building a full app?</p>
                  <p>→ Use Playground</p>
                </div>
                <div>
                  <p className="text-white font-medium">Need UI components?</p>
                  <p>→ Use JSON Render</p>
                </div>
                <div>
                  <p className="text-white font-medium">Writing code?</p>
                  <p>→ Use Coding Agent</p>
                </div>
                <div>
                  <p className="text-white font-medium">Need AI in your app?</p>
                  <p>→ Use Gateway</p>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h3 className="font-bold mb-3">3. Describe What You Want</h3>
              <p className="text-sm text-zinc-400">
                All products work the same way: describe what you want in plain English, and the AI
                builds it. Be specific about layout, colors, and functionality.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h3 className="font-bold mb-3">4. Iterate & Deploy</h3>
              <p className="text-sm text-zinc-400">
                Review what the AI built. Ask for changes. When you&apos;re happy, deploy with one
                click. Your app is live in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
