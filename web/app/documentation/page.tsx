import type { Metadata } from 'next'
import Link from 'next/link';
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Docs — Agentbot Developer & Operator Guide',
  description: 'Complete documentation for deploying and operating AI agents on Agentbot. Powered by MiMo V2.5, built on OpenClaw. Plans from £29/mo.',
  keywords: ['Agentbot docs', 'AI agent documentation', 'MiMo V2.5', 'OpenClaw', 'BYOK AI guide', 'agent hosting docs', 'deploy AI agent guide'],
  openGraph: {
    title: 'Agentbot Docs — Developer & Operator Guide',
    description: 'Everything you need to deploy, operate, and grow your AI agents. Powered by MiMo V2.5. Plans from £29/mo.',
    url: buildAppUrl('/documentation'),
  },
  alternates: {
    canonical: buildAppUrl('/documentation'),
  },
}

const docsSections = [
  {
    title: 'Getting Started',
    description: 'Deploy your AI agent in under 2 minutes. MiMo handles the thinking.',
    items: ['Sign up and choose a plan', 'Connect Telegram, Discord, or WhatsApp', 'Your agent deploys on MiMo V2.5 Pro automatically', 'No API key needed — inference is included in your plan']
  },
  {
    title: 'Plans & Resources',
    description: 'All plans include MiMo V2.5 Pro inference. No per-token charges.',
    items: ['Solo £29: 1 agent, MiMo V2.5 Pro, X + Telegram', 'Collective £69: 3 agents, custom workflows, priority support', 'Label £149: 10 agents, team management, API access, white-label', 'Network £499: Unlimited agents, dedicated infra, custom models, SLA']
  },
  {
    title: 'Powered by MiMo',
    description: 'All agents run on Xiaomi MiMo V2.5 — 99% cheaper than GPT.',
    items: ['MiMo V2.5 Pro: 1M context, built-in reasoning, multimodal', 'MiMo V2.5: Fast inference, 256K context, image support', 'MiMo TTS: Agent voices (free for a limited time)', 'MiMo ASR: Speech recognition for voice commands']
  },
  {
    title: 'Vercel Gateway',
    description: 'OpenAI-compatible inference gateway. MiMo direct, OpenRouter fallback.',
    items: ['Endpoint: https://agentbot.sh/v1/chat/completions', 'MiMo direct upstream — zero middleman, lowest latency', 'OpenRouter fallback for non-MiMo models', 'API key authentication via Settings → API Keys']
  }
];

const newFeatures = [
  {
    title: 'BYOK — Bring Your Own Key',
    description: 'Have your own MiMo subscription? Paste your key and run on your credits — zero platform cost.',
    links: [
      { label: 'Settings → BYOK', href: '/settings?tab=byok' },
      { label: 'Get MiMo Key', href: 'https://mimo.xiaomi.com' }
    ]
  },
  {
    title: 'Vercel Gateway API',
    description: 'OpenAI-compatible endpoint for custom integrations. MiMo direct, streaming supported.',
    links: [
      { label: 'Gateway Health', href: '/vercel-gateway/health' },
      { label: 'API Reference', href: '#api-reference' }
    ]
  },
  {
    title: 'Agent Skills',
    description: 'Extend your agent with custom skills. Web search, file handling, code execution, and more.',
    links: [
      { label: 'Skills Dashboard', href: '/dashboard/skills' }
    ]
  },
  {
    title: 'Scheduled Tasks',
    description: 'Run agents on autopilot. Set recurring tasks, cron jobs, and automated workflows.',
    links: [
      { label: 'Tasks Dashboard', href: '/dashboard/tasks' }
    ]
  },
  {
    title: 'Crypto & Payments',
    description: 'x402 onchain payments on Base. Accept USDC, manage wallets, process invoices.',
    links: [
      { label: 'x402 Setup', href: '#' }
    ]
  },
  {
    title: 'baseFM Integration',
    description: 'AI-powered autonomous radio on Base. Agent DJs, live streaming, $RAVE token gating.',
    links: [
      { label: 'baseFM Live', href: '/basefm/live' }
    ]
  }
];

const apiReference = [
  {
    method: 'POST',
    endpoint: '/v1/chat/completions',
    description: 'OpenAI-compatible chat completions. MiMo V2.5 Pro default.',
    auth: 'Bearer token (API key from Settings → API Keys)'
  },
  {
    method: 'GET',
    endpoint: '/v1/models',
    description: 'List available models. Returns MiMo V2.5 Pro, MiMo V2.5, and fallback models.',
    auth: 'None'
  },
  {
    method: 'GET',
    endpoint: '/vercel-gateway/health',
    description: 'Gateway health check. Returns upstream status and latency.',
    auth: 'None'
  },
  {
    method: 'POST',
    endpoint: '/api/user/byok',
    description: 'Register your own MiMo API key. Validated live against MiMo API.',
    auth: 'Session token'
  }
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-24 sm:py-36">

        {/* Header */}
        <div className="mb-16">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Powered by MiMo
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Built on OpenClaw
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95]">
            Documentation
          </h1>
          <p className="text-zinc-400 text-sm mt-6 max-w-lg">
            Everything you need to deploy, operate, and grow your AI agents on Agentbot.
            Powered by Xiaomi MiMo V2.5. Built on OpenClaw.
          </p>
        </div>

        {/* Core Docs */}
        <section className="mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Core</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {docsSections.map((section) => (
              <div key={section.title} className="bg-black p-6 sm:p-8">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{section.title}</h2>
                <p className="text-zinc-500 text-xs mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="text-zinc-400 text-xs flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Features</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {newFeatures.map((feature) => (
              <div key={feature.title} className="bg-black p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-xs mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-[10px] uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Reference */}
        <section id="api-reference" className="mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">API Reference</div>
          <div className="space-y-px bg-zinc-900">
            {apiReference.map((api) => (
              <div key={api.endpoint} className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                <div className="shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    api.method === 'POST' ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {api.method}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-xs text-white font-mono break-all">{api.endpoint}</code>
                  <p className="text-zinc-500 text-xs mt-1">{api.description}</p>
                  <p className="text-zinc-700 text-[10px] mt-1">Auth: {api.auth}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Quick Links</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vercel Gateway', href: '/vercel-gateway' },
              { label: 'BYOK Settings', href: '/settings?tab=byok' },
              { label: 'MiMo Partner', href: '/partner/mimo' },
              { label: 'Blog', href: '/blog' },
              { label: 'GitHub', href: 'https://github.com/Eskyee/agentbot-opensource' },
              { label: 'OpenClaw Docs', href: 'https://docs.openclaw.ai' },
              { label: 'MiMo API', href: 'https://mimo.xiaomi.com' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="border border-zinc-800 hover:border-zinc-600 px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
