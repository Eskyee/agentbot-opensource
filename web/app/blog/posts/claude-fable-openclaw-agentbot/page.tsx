import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Claude Fable 5 × OpenClaw Agentbot — Frontier Intelligence for Autonomous Agents',
  description:
    'Claude Fable 5 is Anthropic\'s most capable model for days-long autonomous tasks. Here\'s how Agentbot users can access it via OpenRouter.',
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">11 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        Claude Fable 5 × OpenClaw Agentbot — Frontier Intelligence for Autonomous Agents
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        Anthropic just shipped Claude Fable 5 — their most capable model, built for days-long
        autonomous tasks that previous models couldn&apos;t sustain. Agentbot users can access it
        now via OpenRouter.
      </p>

      <h2 className="text-2xl font-bold mt-10">What is Claude Fable 5?</h2>

      <p>
        Claude Fable 5 is Anthropic&apos;s 5th-generation frontier model. It&apos;s designed for
        ambitious, long-running projects — the kind of work that takes days, not minutes.
      </p>

      <p>Key capabilities:</p>

      <ul>
        <li><strong>Days-long autonomy</strong> — plans across stages, delegates to sub-agents, checks its own work</li>
        <li><strong>Frontier coding</strong> — large migrations, complex implementations, multi-day sessions</li>
        <li><strong>Vision</strong> — understands diagrams, charts, tables in PDFs and files</li>
        <li><strong>Self-verification</strong> — writes its own tests, evaluates outputs against goals</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">How to Use Claude Fable 5 on Agentbot</h2>

      <p>
        Agentbot routes all AI requests through OpenRouter, which means you get access to 500+
        models including Claude Fable 5 — no separate API keys needed.
      </p>

      <h3 className="text-xl font-bold mt-6">Step 1: Upgrade to Label Plan</h3>

      <p>
        Claude Fable 5 requires the <strong>Label plan</strong> ($49/mo) due to its frontier
        pricing ($10/M input, $50/M output tokens). This covers the full Agentbot platform
        plus access to Fable, DeepSeek R1, and other premium models.
      </p>

      <h3 className="text-xl font-bold mt-6">Step 2: Select Claude Fable 5</h3>

      <p>
        During onboarding or in your agent settings, select <strong>Claude Fable 5</strong> from
        the model dropdown. It&apos;s now listed alongside MiMo V2.5 Pro, Claude Sonnet 4.5, and
        DeepSeek R1.
      </p>

      <h3 className="text-xl font-bold mt-6">Step 3: Deploy</h3>

      <p>
        Your agent will run on Claude Fable 5 via OpenRouter. The model handles tool calling,
        memory, and multi-step workflows natively — no configuration changes needed.
      </p>

      <h2 className="text-2xl font-bold mt-10">Why This Matters for Agentbot</h2>

      <p>
        Agentbot is built for autonomous agents that run 24/7. Claude Fable 5&apos;s ability to
        sustain complex work across days aligns perfectly with our architecture:
      </p>

      <ul>
        <li><strong>Long-running tasks</strong> — agents can tackle multi-day projects without losing context</li>
        <li><strong>Self-correction</strong> — Fable writes tests and verifies its own outputs</li>
        <li><strong>Vision integration</strong> — agents can analyze screenshots, diagrams, and documents</li>
        <li><strong>Cost efficiency</strong> — 90% input token discount with prompt caching</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">Pricing</h2>

      <p>Claude Fable 5 via OpenRouter:</p>

      <ul>
        <li><strong>Input:</strong> $10 per million tokens</li>
        <li><strong>Output:</strong> $50 per million tokens</li>
        <li><strong>Prompt caching:</strong> 90% discount on cached input tokens</li>
      </ul>

      <p>
        For most Agentbot workloads, prompt caching keeps costs manageable. The Label plan
        includes generous token allowances to get started.
      </p>

      <h2 className="text-2xl font-bold mt-10">What Customers Are Saying</h2>

      <blockquote>
        <p>
          &ldquo;Claude Fable 5 is the state of the art model on CursorBench. It&apos;s opened
          up a class of long-horizon problems that were out of reach for earlier models.&rdquo;
        </p>
        <footer>— Michael Truell, CEO of Cursor</footer>
      </blockquote>

      <blockquote>
        <p>
          &ldquo;Claude Fable 5 compresses months of engineering into days. In our 50-million-line
          Ruby codebase, it did in a day what would&apos;ve taken us more than two months by hand.&rdquo;
        </p>
        <footer>— Zach Anker, Principal Software Engineer</footer>
      </blockquote>

      <h2 className="text-2xl font-bold mt-10">Getting Started</h2>

      <p>
        If you&apos;re already an Agentbot user on the Label plan, Claude Fable 5 is available
        now — just select it from the model dropdown in your agent settings.
      </p>

      <p>
        New to Agentbot? Sign up at{' '}
        <a href="https://agentbot.sh" className="text-green-400 hover:text-green-300">
          agentbot.sh
        </a>{' '}
        and deploy your first agent in minutes.
      </p>

      <div className="mt-12 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <p className="text-sm text-zinc-400">
          <strong className="text-white">Claude Fable 5</strong> is available on Agentbot via
          OpenRouter. Requires Label plan ($49/mo). Pricing: $10/M input, $50/M output tokens.
          90% prompt caching discount. 30-day data retention required by Anthropic.
        </p>
      </div>
    </article>
  )
}
