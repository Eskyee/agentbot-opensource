import Link from 'next/link';

const docsSections = [
  {
    title: 'Getting Started',
    description: 'Deploy your AI agent in under a minute. We handle the infrastructure.',
    items: ['60-second signup', 'Choose your plan', 'Connect Telegram bot', 'Add your AI API key']
  },
  {
    title: 'Plans & Resources',
    description: 'Different plans for different needs. All include cloud hosting.',
    items: ['Starter: 2GB RAM, 1 CPU', 'Pro: 4GB RAM, 2 CPU', 'Scale: 8GB RAM, 4 CPU', 'Enterprise: 16GB+ RAM', 'White Glove: 32GB RAM']
  },
  {
    title: 'AI Models',
    description: 'Bring your own API key. Pay AI providers directly - no markup.',
    items: ['Use OpenRouter, Groq, Anthropic, OpenAI', 'We default to Kimi K2.5', 'Free models to try', 'You pay only for what you use']
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
  { plan: 'Starter', ram: '2GB', cpu: '1 vCPU', price: '£19/mo' },
  { plan: 'Pro', ram: '4GB', cpu: '2 vCPU', price: '£39/mo' },
  { plan: 'Scale', ram: '8GB', cpu: '4 vCPU', price: '£79/mo' },
  { plan: 'Enterprise', ram: '16GB', cpu: '4 vCPU', price: '£149/mo' },
  { plan: 'White Glove', ram: '32GB', cpu: '8 vCPU', price: '£199/mo' },
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
          <h3 className="text-xl font-semibold mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Signup
            </Link>
            <Link href="/pricing" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/marketplace" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/blog" className="rounded-full border border-gray-700 px-4 py-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/token" className="rounded-full border border-blue-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              $AGENTBOT
            </Link>
            <Link href="/basefm" className="rounded-full border border-green-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              $BASEFM
            </Link>
            <Link href="/terms" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}