import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MiMo-V2-Pro: The Model Powering Agentbot — Agentbot',
  description: 'Xiaomi MiMo Token Plan — 1.6B credits for $100/mo. The model behind Agentbot\'s reasoning. Plus OpenRouter for 500+ models.',
  keywords: ['MiMo', 'Xiaomi', 'AI models', 'OpenRouter', 'Agentbot'],
  openGraph: {
    title: 'MiMo-V2-Pro: The Model Powering Agentbot',
    description: '1.6B credits for $100/mo. Chain-of-thought reasoning. The model behind our agents.',
    url: 'https://agentbot.sh/blog/posts/mimo-v2-pro-powers-agentbot',
  },
}

export default function MiMoBlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              MiMo-V2-Pro: The Model Powering Agentbot
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Models</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Guide</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            The model behind Agentbot&apos;s reasoning is <strong className="text-white">Xiaomi MiMo-V2-Pro</strong> — 
            a chain-of-thought model that powers our planning, coding, and decision-making. 
            Here&apos;s what it is, how to get it, and why we chose it.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What is MiMo-V2-Pro?
          </h2>
          <p className="text-zinc-300 mb-4">
            Xiaomi&apos;s flagship AI model. Chain-of-thought reasoning with visible thinking tokens. 
            Strong on programming benchmarks. 1M context window. Available through the 
            Xiaomi MiMo Token Plan.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">Model:</span> <span className="text-white">MiMo-V2-Pro</span></div>
              <div><span className="text-zinc-500">Type:</span> <span className="text-white">Chain-of-Thought</span></div>
              <div><span className="text-zinc-500">Context:</span> <span className="text-white">1M tokens</span></div>
              <div><span className="text-zinc-500">Provider:</span> <span className="text-white">Xiaomi</span></div>
              <div><span className="text-zinc-500">Also:</span> <span className="text-white">MiMo-V2-Omni, MiMo-V2-TTS</span></div>
              <div><span className="text-zinc-500">API:</span> <span className="text-white">OpenAI-compatible</span></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Xiaomi MiMo Token Plan
          </h2>
          <p className="text-zinc-300 mb-4">
            A unified credit system. One subscription gives access to MiMo-V2-Pro, Omni, and TTS models. 
            No separate payments. First buy gets 12% off.
          </p>

          <div className="space-y-3 mb-6">
            <div className="border border-zinc-800 bg-zinc-950 p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-white">Lite</div>
                <div className="text-[10px] text-zinc-500">60M credits · Entry level</div>
              </div>
              <div className="text-sm font-bold text-white">$6/mo</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-white">Standard</div>
                <div className="text-[10px] text-zinc-500">200M credits · Daily efficiency</div>
              </div>
              <div className="text-sm font-bold text-white">$16/mo</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-white">Pro</div>
                <div className="text-[10px] text-zinc-500">700M credits · Professional workflows</div>
              </div>
              <div className="text-sm font-bold text-white">$50/mo</div>
            </div>
            <div className="border border-orange-500/30 bg-orange-500/5 p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-bold text-orange-400">Max ⭐</div>
                <div className="text-[10px] text-zinc-500">1.6B credits · Around-the-clock usage</div>
              </div>
              <div className="text-sm font-bold text-orange-400">$100/mo</div>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4 mb-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">What&apos;s Included</div>
            <ul className="text-sm text-zinc-400 space-y-1 list-disc pl-4">
              <li>MiMo-V2-Pro — flagship reasoning model</li>
              <li>MiMo-V2-Omni — full multimodal model</li>
              <li>MiMo-V2-TTS — speech synthesis (free for limited time)</li>
              <li>OpenAI-compatible API</li>
              <li>Works with OpenClaw, Claude Code, OpenCode, KiloCode, Cline</li>
              <li>Priority access to new models (closed beta)</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            How to Set Up
          </h2>

          <div className="space-y-4 mb-6">
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold text-white mb-2">Step 1: Subscribe</div>
              <p className="text-[10px] text-zinc-400">
                Go to <a href="https://platform.xiaomimimo.com/#/token-plan" className="text-orange-400 hover:text-orange-400">platform.xiaomimimo.com</a> and choose your plan. 
                First buy gets 12% off.
              </p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold text-white mb-2">Step 2: Get API Key</div>
              <p className="text-[10px] text-zinc-400">
                After subscribing, generate an API key from the platform. Save it — you can only copy it once.
              </p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold text-white mb-2">Step 3: Configure</div>
              <p className="text-[10px] text-zinc-400">
                Add to your config: <code className="text-orange-400 bg-zinc-900 px-1 rounded">baseURL: https://token-plan-ams.xiaomimimo.com/v1</code>
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            MiMo vs OpenRouter
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border-r border-zinc-800 pr-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-2 font-bold">MiMo Token Plan</div>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>✅ Unified credits (Pro + Omni + TTS)</li>
                  <li>✅ 1M context window</li>
                  <li>✅ Chain-of-thought reasoning</li>
                  <li>✅ Priority model access</li>
                  <li>✅ Works with OpenClaw</li>
                  <li>⚠️ 3 models (Xiaomi only)</li>
                </ul>
              </div>
              <div className="pl-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-2 font-bold">OpenRouter</div>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>✅ 500+ models</li>
                  <li>✅ Any provider (OpenAI, Anthropic, Google, etc.)</li>
                  <li>✅ Pay-as-you-go</li>
                  <li>✅ Model routing & fallbacks</li>
                  <li>✅ Works with OpenClaw</li>
                  <li>⚠️ Higher per-token cost</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-zinc-300 mb-6">
            <strong className="text-white">Our recommendation:</strong> Use MiMo as your primary model for reasoning and coding. 
            Use OpenRouter as your fallback and for accessing specialized models. Agentbot supports both — 
            configure MiMo as primary, OpenRouter as fallback.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <a href="https://platform.xiaomimimo.com/#/token-plan" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              Get MiMo Token Plan →
            </a>
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              OpenRouter (500+ models) →
            </a>
          </div>

          <p className="text-zinc-400 text-sm">
            Agentbot: <Link href="https://agentbot.sh" className="text-white underline">agentbot.sh</Link>
          </p>
        </article>
      </div>
    </main>
  )
}
