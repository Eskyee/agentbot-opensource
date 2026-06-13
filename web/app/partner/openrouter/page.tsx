import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenRouter × Agentbot — Integration',
  description: 'Access 300+ AI models through OpenRouter. Claude Fable 5, GPT-4o, Gemini, free models — all with one API key.',
}

const freeModels = [
  { name: 'Gemma 4 26B', provider: 'Google', id: 'google/gemma-4-26b-a4b-it:free' },
  { name: 'Gemma 4 31B', provider: 'Google', id: 'google/gemma-4-31b-it:free' },
  { name: 'Nemotron 3 Ultra', provider: 'NVIDIA', id: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
  { name: 'Nemotron 3 Super', provider: 'NVIDIA', id: 'nvidia/nemotron-3-super-120b-a12b:free' },
  { name: 'Qwen3 Next 80B', provider: 'Alibaba', id: 'qwen/qwen3-next-80b-a3b-instruct:free' },
  { name: 'Nex-N2-Pro', provider: 'Nex AGI', id: 'nex-agi/nex-n2-pro:free' },
  { name: 'Laguna XS', provider: 'Poolside', id: 'poolside/laguna-xs.2:free' },
  { name: 'Nemotron Nano 12B', provider: 'NVIDIA', id: 'nvidia/nemotron-nano-12b-v2-vl:free' },
]

const popularModels = [
  { name: 'Claude Fable 5', provider: 'Anthropic', use: 'Latest reasoning', price: '$10 / $50', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
  { name: 'Claude Opus 4.8', provider: 'Anthropic', use: 'Deep reasoning', price: '$5 / $25', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
  { name: 'Claude Sonnet 4', provider: 'Anthropic', use: 'Balanced', price: '$3 / $15', color: 'text-orange-300 border-orange-300/30 bg-orange-300/5' },
  { name: 'Claude Haiku', provider: 'Anthropic', use: 'Fast & cheap', price: '$1 / $5', color: 'text-orange-300 border-orange-300/30 bg-orange-300/5' },
  { name: 'GPT-4o', provider: 'OpenAI', use: 'Vision & multimodal', price: '$2.50 / $10', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
  { name: 'Gemini 2.5 Pro', provider: 'Google', use: 'Long context', price: '$1.25 / $10', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  { name: 'MiMo V2.5 Pro', provider: 'Xiaomi', use: 'Agentic tasks', price: '$0.44 / $0.87', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', use: 'Code & math', price: '$0.55 / $2.19', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
  { name: 'Llama 3.3 70B', provider: 'Meta', use: 'Fast inference', price: '$0.10 / $0.10', color: 'text-blue-300 border-blue-300/30 bg-blue-300/5' },
  { name: 'Qwen 3.7 Plus', provider: 'Alibaba', use: 'Multilingual', price: '$0.40 / $1.60', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' },
  { name: 'MiniMax M3', provider: 'MiniMax', use: 'Long context', price: '$0.20 / $0.80', color: 'text-pink-400 border-pink-400/30 bg-pink-400/5' },
  { name: 'Kimi K2.5', provider: 'Moonshot', use: 'Default on Agentbot', price: '$0.14 / $0.28', color: 'text-white border-zinc-700 bg-zinc-900' },
]

export default function OpenRouterPartnerPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,111,46,0.10),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
                Integration
              </div>
              <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
                300+ Models
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
              OpenRouter ×<br />
              <span className="text-orange-500">Agentbot</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
              Access 300+ AI models through OpenRouter. Bring your own key.
              Zero markup. Switch models anytime. Your agent, your models, your rules.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">How It Works</div>

          {/* Routing diagram: your agent → BYOK key → OpenRouter → 300+ models */}
          <svg viewBox="0 0 720 240" role="img" aria-label="Your agent sends a request through Agentbot with your OpenRouter key; OpenRouter routes it to any of 300+ models at wholesale price" className="mb-10 w-full h-auto">
            {/* Agent */}
            <rect x="10" y="96" width="130" height="48" fill="#09090b" stroke="#27272a" />
            <text x="75" y="118" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace" letterSpacing="1">YOUR AGENT</text>
            <text x="75" y="134" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">one request</text>
            {/* arrow */}
            <line x1="140" y1="120" x2="186" y2="120" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="186,116 194,120 186,124" fill="#EF6F2E" />
            {/* Agentbot + BYOK key */}
            <rect x="196" y="86" width="150" height="68" fill="none" stroke="#EF6F2E" strokeOpacity="0.5" />
            <text x="271" y="110" textAnchor="middle" fill="#EF6F2E" fontSize="11" fontFamily="monospace" letterSpacing="1">AGENTBOT</text>
            <text x="271" y="126" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">your key · 0% markup</text>
            <text x="271" y="140" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">usage tracked</text>
            {/* arrow */}
            <line x1="346" y1="120" x2="392" y2="120" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="392,116 400,120 392,124" fill="#EF6F2E" />
            {/* OpenRouter */}
            <rect x="402" y="96" width="130" height="48" fill="#09090b" stroke="#27272a" />
            <text x="467" y="118" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace" letterSpacing="1">OPENROUTER</text>
            <text x="467" y="134" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">wholesale rate</text>
            {/* fan-out to models */}
            {[
              { y: 30, label: 'Claude Fable 5' },
              { y: 78, label: 'GPT-4o' },
              { y: 126, label: 'Gemini 2.5' },
              { y: 174, label: 'Llama · Qwen' },
              { y: 210, label: '300+ more' },
            ].map((m) => (
              <g key={m.label}>
                <line x1="532" y1="120" x2="582" y2={m.y + 16} stroke="#27272a" />
                <rect x="582" y={m.y} width="128" height="32" fill="#09090b" stroke="#27272a" />
                <text x="646" y={m.y + 20} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">{m.label}</text>
              </g>
            ))}
          </svg>

          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                title: 'BYOK — Zero Markup',
                body: 'Paste your OpenRouter API key in Settings. We never charge markup — you pay OpenRouter directly at wholesale rates.',
              },
              {
                title: '300+ Models',
                body: 'Claude Fable 5, GPT-4o, Gemini, Llama, DeepSeek, Mistral, Qwen — every major model, one API key, one dashboard.',
              },
              {
                title: 'Switch Anytime',
                body: 'Change your agent\'s model in one click. No redeploy. No downtime. Test different models for different tasks.',
              },
              {
                title: 'Usage Tracking',
                body: 'Token usage, costs, and latency tracked per model. Know exactly what you\'re spending and where.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Models */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">New</div>
            <span className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-300">
              Free Tier
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-3">
            Free models on OpenRouter
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg mb-8">
            Start building for $0. These models are free to use — no credit card required. Perfect for testing and prototyping.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {freeModels.map((model) => (
              <div key={model.id} className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="text-sm font-bold text-white">{model.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{model.provider}</div>
                <div className="mt-2 text-[10px] font-mono text-green-400">$0 — Free</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Models */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Popular Models</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-3">
            What agents run on
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg mb-8">
            Prices shown as input / output per 1M tokens.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularModels.map((model) => (
              <div key={model.name} className={`rounded-xl border p-4 ${model.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{model.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{model.provider}</div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 text-right">{model.price}</div>
                </div>
                <div className="text-xs text-zinc-400 mt-2">{model.use}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why OpenRouter */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Why OpenRouter</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            One key. Every model. <span className="text-orange-500">No lock-in.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg">
            <p>
              OpenRouter is the universal gateway to AI models. Instead of managing 10 different API keys, subscriptions, and rate limits — you get one key that accesses everything.
            </p>
            <p>
              Agentbot integrates natively with OpenRouter. Your agents can switch between Claude Fable 5 for reasoning, GPT-4o for vision, Llama for speed, and DeepSeek for code — all without reconfiguration.
            </p>
            <p>
              We don&apos;t mark up OpenRouter pricing. You pay exactly what OpenRouter charges. Our platform fee covers infrastructure, not inference.
            </p>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Quick Start</div>
            <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">Set up in 30 seconds</h2>

            <div className="mt-8 space-y-4">
              {[
                'Get an API key from openrouter.ai/keys — free $1 credit to start.',
                'Go to Agentbot Settings → AI Provider → paste your OpenRouter key.',
                'Pick a model from the dropdown. Your agent switches instantly.',
                'That\'s it. You\'re running on 300+ models. No config files. No redeploy.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-500">
                    {i + 1}
                  </div>
                  <div className="text-sm leading-6 text-zinc-300 pt-1">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Ready to deploy<br /><span className="text-orange-500">on OpenRouter?</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Every agent on Agentbot supports OpenRouter. BYOK with zero markup. 300+ models at your fingertips.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Deploy Your Agent →
            </Link>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-700 px-10 py-4 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Get OpenRouter Key
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
