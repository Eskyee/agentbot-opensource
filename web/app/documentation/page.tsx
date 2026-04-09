import type { Metadata } from 'next'
import Link from 'next/link';
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Docs — Agentbot Developer & Operator Guide',
  description: 'Complete documentation for deploying and operating AI agents on Agentbot. Plans, models, API keys, skills, scheduled tasks, crypto wallets, and more.',
  keywords: ['Agentbot docs', 'AI agent documentation', 'BYOK AI guide', 'agent hosting docs', 'deploy AI agent guide', 'OpenRouter guide'],
  openGraph: {
    title: 'Agentbot Docs — Developer & Operator Guide',
    description: 'Everything you need to deploy, operate, and grow your AI agents. Plans from £29/mo, BYOK, 15+ supported models.',
    url: buildAppUrl('/documentation'),
  },
  alternates: {
    canonical: buildAppUrl('/documentation'),
  },
}

const docsSections = [
  {
    title: 'Getting Started',
    description: 'Deploy your AI agent in under a minute. We handle the infrastructure.',
    items: ['60-second signup', 'Choose your plan', 'Connect Telegram bot', 'Add your AI API key']
  },
  {
    title: 'Plans & Resources',
    description: 'Dual-agent architecture: Agentbot (Creative) + OpenClaw (Business).',
    items: ['Solo £29: Creative only, no business automation', 'Collective £69: 1 OpenClaw seat (tour manager)', 'Label £149: 3 OpenClaw seats (full back office)', 'Network £499: Unlimited, white-label, SLA']
  },
  {
    title: 'Agentbot vs OpenClaw',
    description: 'Two agents, one mission: automate your music business.',
    items: ['Agentbot: Fan engagement, promo, A&R, artwork', 'OpenClaw: Email, contracts, scraping, invoicing', 'A2A Bus: They talk to each other (Collective+)']
  },
  {
    title: 'AI Models',
    description: 'Bring your own API key. Pay AI providers directly - no markup.',
    items: ['Use OpenRouter, Anthropic, OpenAI, or local Ollama', 'We default to MiMo-V2-Pro via OpenRouter', 'Free models to try', 'You pay only for what you use']
  }
];

const newFeatures = [
  {
    title: 'Crypto Trading',
    description: 'Bankr integration for autonomous trading. Connect your wallet and let your agent trade.',
    links: [
      { label: 'Trading Dashboard', href: '/dashboard/trading' },
      { label: 'Bankr Guide', href: '/blog/posts/bankr-wallet-guide' }
    ]
  },
  {
    title: 'x402 Payments',
    description: 'Accept USDC payments on Base. Build paid APIs that agents can pay for.',
    links: [
      { label: 'x402 Setup', href: '#' }
    ]
  },
  {
    title: 'Agent Skills',
    description: 'Extend your agent with custom skills. Marketplace coming soon.',
    links: [
      { label: 'Skills Docs', href: '/dashboard/skills' }
    ]
  },
  {
    title: 'Scheduled Tasks',
    description: 'Run agents on autopilot. Set recurring tasks and workflows.',
    links: [
      { label: 'Tasks', href: '/dashboard/tasks' }
    ]
  },
  {
    title: 'Liquid Wallet Kit',
    description: 'Deploy Blockstream LWK on Railway for multi-sig Liquid operations with Jade HWW.',
    links: [
      { label: 'LWK + Railway Guide', href: '/docs/liquid-lwk-railway' }
    ]
  },
  {
    title: 'Solana Agents',
    description: 'Connect to Solana DeFi. Token swaps, NFT minting, 60+ MCP tools.',
    links: [
      { label: 'Solana Integrations', href: '/solana' }
    ]
  },
  {
    title: 'Blockchain Buddies',
    description: 'Digital pets for your agent. Hatch, feed, and play with on-chain companions.',
    links: [
      { label: 'Buddies', href: '/buddies' }
    ]
  },
  {
    title: 'Agent Swarms',
    description: 'Deploy multiple agents that work together. Coordinate complex workflows.',
    links: [
      { label: 'Swarms', href: '/dashboard/swarms' }
    ]
  },
  {
    title: 'Visual Workflows',
    description: 'Build workflows with a visual editor. No code required.',
    links: [
      { label: 'Workflows', href: '/dashboard/workflows' }
    ]
  },
  {
    title: 'Vercel Workflows',
    description: 'Lightweight pause/resume agents. Build with WDK - native integration coming soon.',
    links: [
      { label: 'Learn more', href: 'https://vercel.com/docs/workflow', external: true }
    ],
    badge: 'Coming Soon'
  }
];

const planResources = [
  { plan: 'Solo', ram: '2GB', cpu: '1 vCPU', price: '£29/mo', description: 'Creative only' },
  { plan: 'Collective', ram: '4GB', cpu: '2 vCPU', price: '£69/mo', description: '+1 OpenClaw seat' },
  { plan: 'Label', ram: '8GB', cpu: '4 vCPU', price: '£149/mo', description: '+3 OpenClaw seats' },
  { plan: 'Network', ram: '16GB', cpu: '8 vCPU', price: '£499/mo', description: 'Unlimited' },
];

const supportedModels = [
  // Best Models
  'MiMo-V2-Pro', 'Claude Sonnet 4', 'GPT-4o', 'Gemini 2.5 Flash', 'DeepSeek R1',
  // Good Models
  'GPT-4o Mini', 'Claude 3 Haiku', 'Gemini 1.5 Pro', 'Mistral Large',
  // Free/Low Cost Models
  'Gemini 2.0 Flash', 'Gemini 1.5 Flash', 'Llama 3.1 70B', 'Groq Llama 3',
  // Other
  'GPT-4', 'Claude 3 Opus', 'Mistral Medium', 'DeepSeek', 
];

const tokenPricing = [
  // Free to Very Cheap
  { model: 'Gemini 2.0 Flash (Free)', input: 'Free', output: 'Free', note: '150 RPM' },
  { model: 'Groq Llama 3', input: '£0.0002/1k', output: '£0.0002/1k', note: 'Ultra fast' },
  // Cheap
  { model: 'Gemini 1.5 Flash', input: '£0.0001/1k', output: '£0.0005/1k' },
  { model: 'Llama 3.1 70B', input: '£0.0004/1k', output: '£0.0004/1k' },
  // Mid-Range
  { model: 'MiMo-V2-Pro', input: '$1/M', output: '$3/M', note: 'Default • #1 Programming' },
  { model: 'Kimi K2.5', input: '£0.0005/1k', output: '£0.0015/1k' },
  { model: 'GPT-4o Mini', input: '£0.0003/1k', output: '£0.0012/1k' },
  { model: 'Claude 3 Haiku', input: '£0.0002/1k', output: '£0.0010/1k' },
  // Premium
  { model: 'GPT-4o', input: '£0.0022/1k', output: '£0.0088/1k' },
  { model: 'Claude 3.5 Sonnet', input: '£0.0020/1k', output: '£0.0080/1k' },
  { model: 'Claude Sonnet 4', input: '$3/M', output: '$15/M' },
  { model: 'Gemini 1.5 Pro', input: '£0.0013/1k', output: '£0.0050/1k' },
  { model: 'DeepSeek R1', input: '$0.55/M', output: '$2.19/M' },
];

export default function ViewDocsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter uppercase mb-4">Docs</h1>
        <p className="text-sm text-zinc-400 mb-10">
          Everything you need to deploy, operate, and grow your AI agents.
        </p>

        <div className="border border-zinc-800 bg-zinc-950 p-5 mb-10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Full Docs Site</span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400 max-w-2xl">
              Need the full documentation experience? Open the dedicated docs site for guides, reference pages, and developer docs at{' '}
              <a
                href="https://docs.agentbot.raveculture.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline hover:text-zinc-300"
              >
                docs.agentbot.raveculture.xyz
              </a>.
            </p>
            <a
              href="https://docs.agentbot.raveculture.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 transition-colors"
            >
              Open developer docs
            </a>
          </div>
        </div>

        <div className="mb-10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-6">What&apos;s New</span>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newFeatures.map((feature) => (
              <div key={feature.title} className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm uppercase tracking-tight">{feature.title}</h3>
                  {feature.badge && (
                    <span className="text-[9px] uppercase tracking-widest text-blue-500 border border-blue-500/30 px-2 py-0.5">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mb-3">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.links.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {docsSections.map((section) => (
            <article key={section.title} className="bg-black p-6">
              <h2 className="text-sm font-bold uppercase tracking-tighter mb-3">{section.title}</h2>
              <p className="text-xs text-zinc-500 mb-4">{section.description}</p>
              <ul className="space-y-2 text-xs text-zinc-400">
                {section.items.map((item) => (
                  <li key={item}>&mdash; {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Supported AI Models</span>
          <p className="text-xs text-zinc-500 mb-4">All models available through OpenRouter with automatic fallback.</p>
          <div className="flex flex-wrap gap-2">
            {supportedModels.map((model) => (
              <span key={model} className="text-[10px] uppercase tracking-widest border border-zinc-800 text-zinc-400 px-3 py-1">
                {model}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5 mb-10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Token Pricing (GBP)</span>
          <p className="text-xs text-zinc-500 mb-4">AI model pricing per 1k tokens. Input = prompts, Output = responses.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Model</th>
                  <th className="text-right py-2 px-3 text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Input</th>
                  <th className="text-right py-2 px-3 text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Output</th>
                </tr>
              </thead>
              <tbody>
                {tokenPricing.map((t) => (
                  <tr key={t.model} className="border-b border-zinc-800">
                    <td className="py-2 px-3 text-white font-medium">{t.model}</td>
                    <td className="py-2 px-3 text-right text-zinc-400">{t.input}</td>
                    <td className="py-2 px-3 text-right text-zinc-400">{t.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-5">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Quick Links</span>
          <div className="flex flex-wrap gap-2">
            <Link href="/signup" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500">
              Signup
            </Link>
            <Link href="/pricing" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500">
              Pricing
            </Link>
            <Link href="/marketplace" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500">
              Marketplace
            </Link>
            <Link href="/blog" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500">
              Blog
            </Link>
            <a href="https://docs.agentbot.raveculture.xyz" target="_blank" rel="noopener noreferrer" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-white hover:text-white hover:border-zinc-500">
              Dev Docs
            </a>
            <Link href="/token" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-blue-400 hover:text-white hover:border-zinc-500">
              $AGENTBOT
            </Link>
            <Link href="/basefm" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-blue-400 hover:text-white hover:border-zinc-500">
              $BASEFM
            </Link>
            <Link href="/terms" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-500">
              Terms
            </Link>
            <Link href="/privacy" className="border border-zinc-700 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-500">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
