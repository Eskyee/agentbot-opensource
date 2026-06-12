import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Opengateway Explained — One OpenAI-Compatible Endpoint for Every Model',
  description:
    'What the Agentbot gateway is, why it exists, and how to ship with it in five minutes: one API key, one base URL swap, provider failover, and live usage tracking built in.',
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">12 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        Opengateway Explained — One OpenAI-Compatible Endpoint for Every Model
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        Every app you build needs the same three things from an LLM provider: an endpoint that
        doesn&apos;t change, a key you can revoke, and a bill you can read. Opengateway — the
        Agentbot inference gateway at{' '}
        <Link href="/vercel-gateway" className="text-orange-500">agentbot.sh/vercel-gateway</Link> —
        gives you all three behind a single OpenAI-compatible URL.
      </p>

      <h2 className="text-2xl font-bold mt-10">The problem it solves</h2>

      <p>
        Model providers churn. Pricing changes, rate limits appear mid-launch, a model gets
        deprecated the week you ship. If your code talks to one provider directly, every one of
        those events is a code change. The standard answer is a gateway: your app talks to one
        stable endpoint, and routing decisions happen server-side where they can change without
        a deploy.
      </p>

      <p>
        That&apos;s what powers the Agentbot platform itself. The{' '}
        <Link href="/playground" className="text-orange-500">Playground</Link> streams every app it
        builds through this gateway, agent containers route their inference through it, and the
        same infrastructure is open for your own keys.
      </p>

      <h2 className="text-2xl font-bold mt-10">How it works</h2>

      <p>
        The gateway exposes <code>POST /v1/chat/completions</code> on agentbot.sh — the exact shape
        of the OpenAI API. Behind it, requests fan out to configured upstreams (Vercel AI Gateway
        first, OpenRouter as fallback) with automatic failover: if an upstream returns a retryable
        error, the gateway moves to the next one before your client ever sees a failure.
      </p>

      <p>
        Because the surface is OpenAI-compatible, adopting it is a one-line change in any SDK:
      </p>

      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://agentbot.sh/v1',
  apiKey: 'ogw_live_...',
})

const reply = await client.chat.completions.create({
  model: 'mimo-v2.5-pro',
  messages: [{ role: 'user', content: 'hello, gateway' }],
})`}</code>
      </pre>

      <p>Or straight from the terminal:</p>

      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`curl https://agentbot.sh/v1/chat/completions \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{"model": "mimo-v2.5-pro", "messages": [{"role": "user", "content": "hello"}]}'`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">Smart routing — stop picking models</h2>

      <p>
        Send <code>model: &quot;auto&quot;</code> and the gateway does the choosing. It scores each
        request from cheap structural signals — context size, tool definitions, code content,
        reasoning params — and routes to the cheapest model expected to handle it. If that model
        rate-limits, 5xxs, or returns an empty completion, it escalates up the cost/capability
        ladder before you ever see an error. You&apos;re billed at the rate of the model that
        actually served, and the <code>x-gateway-served-model</code> response header names it.
      </p>

      <p>
        An optional route hint shapes the decision and is stripped before it reaches any provider:
      </p>

      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`{
  "model": "auto",
  "route": { "priority": "cost", "max_cost_usd": 0.01 },
  "messages": [{ "role": "user", "content": "hello" }]
}`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">Keys that behave like production keys</h2>

      <p>
        Sign in at <Link href="/vercel-gateway" className="text-orange-500">/vercel-gateway</Link>,
        name a key, and copy it once — that&apos;s the only time you&apos;ll see it. Keys are stored
        as SHA-256 hashes, never raw, and revoking one is a single click. This is the same
        fail-closed pattern we covered in our{' '}
        <Link href="/blog/posts/agentbot-audit-improvements-june-2026" className="text-orange-500">
          security audit write-up
        </Link>
        : if a key can&apos;t be verified, the request doesn&apos;t go through.
      </p>

      <h2 className="text-2xl font-bold mt-10">Usage you can actually read</h2>

      <p>
        The console shows your requests, your token counts, and global gateway traffic broken down
        by model — refreshed live from the same tables the gateway writes on every request. No
        waiting for a monthly invoice to discover what your agent spent. Cost tracking is per-user
        and per-model, so when something spikes you know which model and which workload did it.
      </p>

      <h2 className="text-2xl font-bold mt-10">Free inference, sponsored</h2>

      <p>
        The default model is Xiaomi&apos;s <strong>MiMo-V2.5-Pro</strong>, available through the
        gateway for free. It&apos;s the same model that powers the Playground&apos;s app builder —
        good enough to generate working multi-file React apps, fast enough to stream them live.
        Bring requests for other models and the gateway routes them through the configured
        upstreams with the same key and the same endpoint.
      </p>

      <h2 className="text-2xl font-bold mt-10">Operational transparency</h2>

      <p>
        Gateway health is public: the console pings upstream providers and reports status, active
        provider, and latency on every load. There&apos;s also a raw health endpoint at{' '}
        <code>/api/vercel-gateway/health</code> if you want to wire it into your own monitoring —
        it returns provider-level checks and fails honestly when nothing is configured.
      </p>

      <h2 className="text-2xl font-bold mt-10">Get started</h2>

      <p>
        Open <Link href="/vercel-gateway" className="text-orange-500">agentbot.sh/vercel-gateway</Link>,
        create a key, and swap your base URL. If you want to see the gateway working before writing
        any code, open the <Link href="/playground" className="text-orange-500">Playground</Link>{' '}
        and build something — every token of that generation flows through the endpoint you just
        read about.
      </p>
    </article>
  )
}
