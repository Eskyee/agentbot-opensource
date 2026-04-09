import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How MiMo-V2-Pro Powers Every Agent on Agentbot — A Production Case Study | Agentbot Blog',
  description: 'Agentbot runs Xiaomi MiMo-V2-Pro as the default brain for every deployed agent. Here\'s why we chose it over GPT-5.2 and Claude, and what we\'ve learned running it in production.',
  keywords: ['MiMo-V2-Pro', 'Xiaomi', 'Agentbot', 'OpenClaw', 'AI agents', 'production', 'case study', 'OpenRouter'],
  openGraph: {
    title: 'How MiMo-V2-Pro Powers Every Agent on Agentbot',
    description: 'Production case study: why we chose MiMo-V2-Pro over GPT-5.2 and Claude for our agent platform.',
    url: 'https://agentbot.sh/blog/posts/mimo-v2-pro-powers-agentbot',
  },
}

export default function MiMoProductionCaseStudy() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          &larr; Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              How MiMo-V2-Pro Powers Every Agent on Agentbot
            </h1>
            <p className="text-lg text-zinc-400 mb-4">
              A production case study from a platform that provisions autonomous AI agents for the music and culture industry.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Case Study</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">MiMo-V2-Pro</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Xiaomi</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Production</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenRouter</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            TL;DR
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <ul className="list-none space-y-2 text-zinc-300 m-0 p-0">
              <li><strong className="text-white">Platform:</strong> Agentbot &mdash; SaaS for deploying autonomous AI agents</li>
              <li><strong className="text-white">Default model:</strong> <code className="text-zinc-200">openrouter/xiaomi/mimo-v2-pro</code></li>
              <li><strong className="text-white">Every new agent</strong> provisioned on Agentbot boots with MiMo-V2-Pro as its brain</li>
              <li><strong className="text-white">Runtime:</strong> OpenClaw agent framework on Railway containers</li>
              <li><strong className="text-white">Routing:</strong> All inference via OpenRouter API</li>
              <li><strong className="text-white">Why:</strong> Best cost/performance ratio for agentic workloads, 1M context, native OpenClaw optimisation</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What Agentbot Does
          </h2>
          <p className="text-zinc-300 mb-4">
            Agentbot is a platform where users deploy their own autonomous AI agents in under 60 seconds.
            Each agent runs inside a dedicated container on Railway, powered by the{' '}
            <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">OpenClaw</a> runtime.
            Users connect their agents to Telegram, Discord, WhatsApp, or web chat, and the agent handles
            tasks autonomously &mdash; from managing inboxes to running cash flow forecasts to triaging demo submissions.
          </p>
          <p className="text-zinc-300 mb-4">
            We serve the music and culture industry: label managers, event promoters, independent artists,
            and crypto-native communities. Our users need agents that can handle multi-step workflows,
            parse documents, execute tool calls, and maintain consistent persona across long conversations.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why We Chose MiMo-V2-Pro
          </h2>
          <p className="text-zinc-300 mb-4">
            When we evaluated models for the default agent brain, we tested GPT-5.2, Claude Sonnet 4.6,
            Gemini 3 Pro, and MiMo-V2-Pro across our actual production workloads. Here&apos;s what we found:
          </p>

          <h3 className="text-xl font-bold mb-3 text-white">1. Native OpenClaw optimisation</h3>
          <p className="text-zinc-300 mb-4">
            MiMo-V2-Pro is explicitly fine-tuned for agentic frameworks, including OpenClaw. Xiaomi describes it as
            &quot;the native brain of OpenClaw&quot; &mdash; and in practice, that matters. Tool-call reliability is
            significantly higher than GPT-5.2, and the model follows OpenClaw&apos;s session/tool/config schema
            without the prompt engineering gymnastics required by other models.
          </p>
          <p className="text-zinc-300 mb-4">
            On ClawEval, MiMo-V2-Pro scores 81.0 &mdash; approaching Claude Opus 4.6 (81.5) and well ahead of
            GPT-5.2 (77.0). For a model at $1/M input tokens, that&apos;s remarkable.
          </p>

          <h3 className="text-xl font-bold mb-3 text-white">2. Cost at scale</h3>
          <p className="text-zinc-300 mb-4">
            Every agent on Agentbot runs 24/7. That means continuous inference costs. MiMo-V2-Pro at
            <strong className="text-white"> $1/M input, $3/M output</strong> is 3x cheaper than Claude Sonnet 4.6
            and 5x cheaper than Opus. For a multi-tenant platform where we need to keep per-user costs predictable,
            this is the difference between a viable business and burning cash.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 text-zinc-400 font-mono">Model</th>
                  <th className="text-right py-2 text-zinc-400 font-mono">Input</th>
                  <th className="text-right py-2 text-zinc-400 font-mono">Output</th>
                  <th className="text-right py-2 text-zinc-400 font-mono">ClawEval</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-900 bg-zinc-800/30">
                  <td className="py-2 font-bold text-white">MiMo-V2-Pro</td>
                  <td className="py-2 text-right text-green-400">$1</td>
                  <td className="py-2 text-right text-green-400">$3</td>
                  <td className="py-2 text-right">81.0</td>
                </tr>
                <tr className="border-b border-zinc-900">
                  <td className="py-2">Claude Sonnet 4.6</td>
                  <td className="py-2 text-right">$3</td>
                  <td className="py-2 text-right">$15</td>
                  <td className="py-2 text-right">79.2</td>
                </tr>
                <tr className="border-b border-zinc-900">
                  <td className="py-2">GPT-5.2</td>
                  <td className="py-2 text-right">$2</td>
                  <td className="py-2 text-right">$8</td>
                  <td className="py-2 text-right">77.0</td>
                </tr>
                <tr>
                  <td className="py-2">Claude Opus 4.6</td>
                  <td className="py-2 text-right">$5</td>
                  <td className="py-2 text-right">$25</td>
                  <td className="py-2 text-right">81.5</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-zinc-500 text-xs mb-6">Per million tokens. ClawEval scores from mimo.xiaomi.com.</p>

          <h3 className="text-xl font-bold mb-3 text-white">3. 1M context window</h3>
          <p className="text-zinc-300 mb-4">
            Our agents handle long-running sessions &mdash; an A&amp;R agent might process 50 demo submissions in a
            single conversation, each with metadata, notes, and follow-up actions. The 1M context window means agents
            don&apos;t lose track of earlier context mid-session. Combined with OpenClaw&apos;s session management,
            this eliminates the &quot;sorry, I forgot what we were doing&quot; problem that plagues shorter-context models.
          </p>

          <h3 className="text-xl font-bold mb-3 text-white">4. Tool-call stability</h3>
          <p className="text-zinc-300 mb-4">
            Agent workloads are tool-heavy. Our agents call web search, document parsing, email APIs, wallet operations,
            and database queries in multi-step chains. MiMo-V2-Pro&apos;s tool-call accuracy score of 61.5 on the
            Tool Use benchmark &mdash; approaching Opus 4.6 (66.3) &mdash; means fewer broken tool chains and fewer
            user-facing errors. GPT-5.2 scored 50.0 on the same benchmark.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            How It&apos;s Wired
          </h2>
          <p className="text-zinc-300 mb-4">
            Every agent container is provisioned with MiMo-V2-Pro as the default model. The configuration is
            injected at deploy time:
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto mb-4">
{`// Container provisioning — agentbot-backend
agents: {
  defaults: {
    model: { primary: 'openrouter/xiaomi/mimo-v2-pro' },
    // ...
  }
}`}
          </pre>
          <p className="text-zinc-300 mb-4">
            Users can switch to any model on OpenRouter via their dashboard &mdash; GPT-5.2, Claude, Gemini, DeepSeek,
            or even local Ollama. But MiMo-V2-Pro is the default because it delivers the best experience out of the box
            for the agentic workloads our users run.
          </p>
          <p className="text-zinc-300 mb-4">
            All inference routes through <a href="https://openrouter.ai/xiaomi/mimo-v2-pro" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">OpenRouter</a>,
            which handles load balancing, fallback, and rate limiting. This means we never hit Xiaomi&apos;s API directly
            &mdash; OpenRouter abstracts the provider, and our users benefit from the competitive routing.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Production Numbers
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-xs text-zinc-500 uppercase mt-1">Agents use MiMo by default</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-xs text-zinc-500 uppercase mt-1">Always-on containers</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">4 tiers</div>
              <div className="text-xs text-zinc-500 uppercase mt-1">Solo to Network plans</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What We&apos;d Tell Other Builders
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-6 space-y-2">
            <li>
              <strong className="text-white">If you&apos;re building an agent platform</strong>, MiMo-V2-Pro via
              OpenRouter is the best default. The ClawEval/PinchBench scores aren&apos;t just benchmarks &mdash; they
              reflect real tool-call reliability and multi-step task completion.
            </li>
            <li>
              <strong className="text-white">The 1M context is real</strong>. We&apos;ve tested sessions with 200k+
              tokens accumulated over hours of agent work. No degradation.
            </li>
            <li>
              <strong className="text-white">Cost matters at scale</strong>. When every user has an always-on agent,
              the difference between $1/M and $5/M input tokens is the difference between unit economics that work
              and ones that don&apos;t.
            </li>
            <li>
              <strong className="text-white">BYOK still matters</strong>. We let users bring their own API keys and
              switch models. But having a strong default that just works out of the box dramatically reduces onboarding friction.
            </li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            About Agentbot
          </h2>
          <p className="text-zinc-300 mb-4">
            Agentbot is an open-source SaaS platform for deploying autonomous AI agents. Built for the music and
            culture industry, it provisions dedicated OpenClaw containers on Railway with BYOK model support,
            multi-channel messaging (Telegram, Discord, WhatsApp), USDC wallets on Base, and Bitcoin/Solana integrations.
          </p>
          <p className="text-zinc-300 mb-4">
            Open source: <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">github.com/Eskyee/agentbot-opensource</a>
            <br />
            Live platform: <a href="https://agentbot.sh" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">agentbot.sh</a>
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-500 text-sm">
              Built by <a href="https://github.com/Eskyee" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">raveculture</a>.
              Agentbot is a Zero Human Company &mdash; agents handle the rest.
            </p>
          </div>

          <div className="border-t border-zinc-800 mt-4 pt-4 flex gap-4 flex-wrap text-sm">
            <Link href="/blog/posts/mimo-v2-pro" className="text-zinc-400 hover:text-white">MiMo-V2-Pro on Agentbot &rarr;</Link>
            <Link href="/solana" className="text-zinc-400 hover:text-white">Solana Integrations &rarr;</Link>
            <Link href="/pricing" className="text-zinc-400 hover:text-white">Pricing &rarr;</Link>
          </div>
        </article>
      </div>
    </main>
  )
}
