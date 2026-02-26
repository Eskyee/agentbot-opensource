import Link from 'next/link';

const docsSections = [
  {
    title: 'Getting Started',
    description: 'Launch your first OpenClaw agent in under a minute and run your first message test.',
    items: ['60-second setup flow', 'Telegram bot connection', 'First-reply validation']
  },
  {
    title: 'Operate',
    description: 'Manage live instances and keep agents healthy from the dashboard.',
    items: ['Status + restart controls', 'Usage and basic stats', 'Recovery steps for common failures']
  },
  {
    title: 'Grow',
    description: 'Use platform capabilities to increase usage and automate external workflows.',
    items: ['Monitor: Real-time analytics and performance tracking', 'Automate: Connect external systems with API + webhooks', 'Integrate: Build custom workflows around your agent']
  }
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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">View Docs</h1>
        <p className="text-lg text-gray-400 mb-10">
          Everything you need to deploy, operate, and grow OpenClawDeploy.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
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
          <h3 className="text-xl font-semibold mb-3">Core documentation</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Signup
            </Link>
            <Link href="/marketplace" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/blog" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-white hover:text-white transition-colors">
              Blog
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
