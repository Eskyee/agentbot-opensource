import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenRouter × Agentbot — Integration',
  description: 'Agentbot supports 300+ AI models through OpenRouter. BYOK with zero markup. Switch models anytime.',
}

export default function OpenRouterPartnerPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-blue-500/30 text-blue-500 text-[10px] uppercase tracking-widest">
              Integration
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              300+ Models
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            OpenRouter ×<br />
            <span className="text-blue-500">Agentbot</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Access 300+ AI models through OpenRouter. Bring your own key.
            Zero markup. Switch models anytime. Your agent, your models, your rules.
          </p>
        </div>
      </section>

      {/* Integration Depth */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">How It Works</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                title: 'BYOK — Zero Markup',
                body: 'Paste your OpenRouter API key in Settings. We never charge markup — you pay OpenRouter directly at wholesale rates.',
              },
              {
                title: '300+ Models',
                body: 'GPT-4o, Claude, Gemini, Llama, DeepSeek, Mistral, Qwen — every major model, one API key, one dashboard.',
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
                <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-3">{item.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
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
            One key. Every model. <span className="text-blue-500">No lock-in.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg">
            <p>
              OpenRouter is the universal gateway to AI models. Instead of managing 10 different API keys, subscriptions, and rate limits — you get one key that accesses everything.
            </p>
            <p>
              Agentbot integrates natively with OpenRouter. Your agents can switch between Claude for reasoning, GPT-4o for vision, Llama for speed, and DeepSeek for code — all without reconfiguration.
            </p>
            <p>
              We don&apos;t mark up OpenRouter pricing. You pay exactly what OpenRouter charges. Our platform fee covers infrastructure, not inference.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Models */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Popular Models</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            What agents run on
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Claude 4 Opus', provider: 'Anthropic', use: 'Reasoning & coding', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
              { name: 'GPT-4o', provider: 'OpenAI', use: 'Vision & multimodal', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
              { name: 'Gemini 2.5 Pro', provider: 'Google', use: 'Long context', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
              { name: 'MiMo V2.5 Pro', provider: 'Xiaomi', use: 'Agentic tasks', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
              { name: 'DeepSeek R1', provider: 'DeepSeek', use: 'Code & math', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
              { name: 'Llama 3.3', provider: 'Meta', use: 'Fast inference', color: 'text-blue-300 border-blue-300/30 bg-blue-300/5' },
              { name: 'Qwen 2.5', provider: 'Alibaba', use: 'Multilingual', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' },
              { name: 'Mistral Large', provider: 'Mistral', use: 'European models', color: 'text-red-400 border-red-400/30 bg-red-400/5' },
              { name: 'Kimi K2.5', provider: 'Moonshot', use: 'Default on Agentbot', color: 'text-white border-zinc-700 bg-zinc-900' },
            ].map((model) => (
              <div key={model.name} className={`rounded-xl border p-4 ${model.color}`}>
                <div className="text-sm font-bold text-white">{model.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{model.provider}</div>
                <div className="text-xs text-zinc-400 mt-2">{model.use}</div>
              </div>
            ))}
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-500">
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
            Ready to deploy<br /><span className="text-blue-500">on OpenRouter?</span>
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
