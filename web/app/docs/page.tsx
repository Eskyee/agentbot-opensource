import type { Metadata } from 'next'
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Docs — Agentbot Developer & Operator Guide',
  description: 'Complete documentation for deploying and operating AI agents on Agentbot. Plans, models, API keys, skills, scheduled tasks, crypto wallets, and more.',
  keywords: ['Agentbot docs', 'AI agent documentation', 'BYOK AI guide', 'agent hosting docs', 'deploy AI agent guide', 'OpenRouter guide'],
  openGraph: {
    title: 'Agentbot Docs — Developer & Operator Guide',
    description: 'Everything you need to deploy, operate, and grow your AI agents. Plans from £29/mo, BYOK, 15+ supported models.',
    url: 'https://agentbot.raveculture.xyz/docs',
  },
  alternates: {
    canonical: 'https://agentbot.raveculture.xyz/docs',
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
    items: ['Use OpenRouter, Anthropic, OpenAI, or local Ollama', 'We default to Kimi K2.5 via OpenRouter', 'Free models to try', 'You pay only for what you use']
  }
];

const newFeatures = [
  {
    title: 'Crypto Trading',
    description: 'Bankr integration for autonomous trading. Connect your wallet and let your agent trade.',
    icon: '💹',
    links: [
      { label: 'Trading Dashboard', href: '/dashboard/trading' },
      { label: 'Bankr Guide', href: '/blog/posts/bankr-wallet-guide' }
    ]
  },
  {
    title: 'x402 Payments',
    description: 'Accept USDC payments on Base. Build paid APIs that agents can pay for.',
    icon: '🔒',
    links: [
      { label: 'x402 Setup', href: '#' }
    ]
  },
  {
    title: 'Agent Skills',
    description: 'Extend your agent with custom skills. Marketplace coming soon.',
    icon: '⚡',
    links: [
      { label: 'Skills Docs', href: '/dashboard/skills' }
    ]
  },
  {
    title: 'Scheduled Tasks',
    description: 'Run agents on autopilot. Set recurring tasks and workflows.',
    icon: '⏰',
    links: [
      { label: 'Tasks', href: '/dashboard/tasks' }
    ]
  },
  {
    title: 'Agent Swarms',
    description: 'Deploy multiple agents that work together. Coordinate complex workflows.',
    icon: '🐝',
    links: [
      { label: 'Swarms', href: '/dashboard/swarms' }
    ]
  },
  {
    title: 'Visual Workflows',
    description: 'Build workflows with a visual editor. No code required.',
    icon: '🎨',
    links: [
      { label: 'Workflows', href: '/dashboard/workflows' }
    ]
  },
  {
    title: 'Vercel Workflows',
    description: 'Lightweight pause/resume agents. Build with WDK - native integration coming soon.',
    icon: '⚡',
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
  'Kimi K2.5', 'GPT-4o', 'Claude 3.5 Sonnet',
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
  { model: 'Kimi K2.5', input: '£0.0005/1k', output: '£0.0015/1k', note: 'Recommended' },
  { model: 'GPT-4o Mini', input: '£0.0003/1k', output: '£0.0012/1k' },
  { model: 'Claude 3 Haiku', input: '£0.0002/1k', output: '£0.0010/1k' },
  // Premium
  { model: 'GPT-4o', input: '£0.0022/1k', output: '£0.0088/1k' },
  { model: 'Claude 3.5 Sonnet', input: '£0.0020/1k', output: '£0.0080/1k' },
  { model: 'Gemini 1.5 Pro', input: '£0.0013/1k', output: '£0.0050/1k' },
  { model: 'Mistral Large', input: '£0.0015/1k', output: '£0.0060/1k' },
];

export default function ViewDocsPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Docs</h1>
        <p className="text-lg text-gray-400 mb-10">
          Everything you need to deploy, operate, and grow your AI agents.
        </p>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">What's New</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newFeatures.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.links.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className="text-xs text-green-400 hover:underline"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          {docsSections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
              <p className="text-gray-400 text-sm mb-4">{section.description}</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-xl font-semibold mb-3">Supported AI Models</h3>
          <p className="text-gray-400 text-sm mb-4">All models available through OpenRouter with automatic fallback.</p>
          <div className="flex flex-wrap gap-2">
            {supportedModels.map((model) => (
              <span key={model} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                {model}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-xl font-semibold mb-3">Token Pricing (GBP)</h3>
          <p className="text-gray-400 text-sm mb-4">AI model pricing per 1k tokens. Input = prompts, Output = responses.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Model</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Input</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Output</th>
                </tr>
              </thead>
              <tbody>
                {tokenPricing.map((t) => (
                  <tr key={t.model} className="border-b border-gray-800">
                    <td className="py-2 px-3 text-white font-medium">{t.model}</td>
                    <td className="py-2 px-3 text-right text-gray-300">{t.input}</td>
                    <td className="py-2 px-3 text-right text-gray-300">{t.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/signup" className="px-4 py-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-all duration-200">
              Signup
            </Link>
            <Link href="/pricing" className="px-4 py-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-all duration-200">
              Pricing
            </Link>
            <Link href="/marketplace" className="px-4 py-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-all duration-200">
              Marketplace
            </Link>
            <Link href="/blog" className="px-4 py-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-all duration-200">
              Blog
            </Link>
            <Link href="/token" className="px-4 py-2 text-sm text-blue-300 bg-blue-900/20 border border-blue-800 hover:bg-blue-800/40 hover:border-blue-600 hover:text-blue-200 rounded-lg transition-all duration-200">
              $AGENTBOT
            </Link>
            <Link href="/basefm" className="px-4 py-2 text-sm text-purple-300 bg-purple-900/20 border border-purple-800 hover:bg-purple-800/40 hover:border-purple-600 hover:text-purple-200 rounded-lg transition-all duration-200">
              $BASEFM
            </Link>
            <Link href="/terms" className="px-4 py-2 text-sm text-gray-400 bg-gray-800/30 border border-gray-800 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200 rounded-lg transition-all duration-200">
              Terms
            </Link>
            <Link href="/privacy" className="px-4 py-2 text-sm text-gray-400 bg-gray-800/30 border border-gray-800 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200 rounded-lg transition-all duration-200">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}