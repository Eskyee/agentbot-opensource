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

      {/* Diagram: request path with failover */}
      <svg viewBox="0 0 720 220" role="img" aria-label="Your client sends one request to the Agentbot gateway, which authenticates the key, then tries Vercel AI Gateway and falls back to OpenRouter before reaching the model" className="my-8 w-full h-auto rounded-lg border border-zinc-900 bg-zinc-950 p-3">
        {/* client */}
        <rect x="12" y="90" width="120" height="44" fill="#000000" stroke="#27272a" />
        <text x="72" y="110" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace">your client</text>
        <text x="72" y="125" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">OpenAI SDK</text>
        <line x1="132" y1="112" x2="176" y2="112" stroke="#3f3f46" strokeDasharray="4 4" />
        <polygon points="176,108 184,112 176,116" fill="#EF6F2E" />
        {/* gateway */}
        <rect x="186" y="80" width="150" height="64" fill="none" stroke="#EF6F2E" strokeOpacity="0.5" />
        <text x="261" y="104" textAnchor="middle" fill="#EF6F2E" fontSize="11" fontFamily="monospace" letterSpacing="1">AGENTBOT /v1</text>
        <text x="261" y="119" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">verify key · rate limit</text>
        <text x="261" y="133" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">record usage</text>
        {/* to upstream 1 */}
        <line x1="336" y1="100" x2="392" y2="74" stroke="#3f3f46" strokeDasharray="4 4" />
        <polygon points="392,70 400,74 391,79" fill="#EF6F2E" />
        <rect x="402" y="52" width="150" height="44" fill="#09090b" stroke="#27272a" />
        <text x="477" y="72" textAnchor="middle" fill="#fafafa" fontSize="10" fontFamily="monospace">Vercel AI Gateway</text>
        <text x="477" y="86" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">primary</text>
        {/* failover to upstream 2 */}
        <line x1="336" y1="124" x2="392" y2="150" stroke="#3f3f46" strokeDasharray="4 4" />
        <polygon points="392,146 400,150 391,155" fill="#3f3f46" />
        <rect x="402" y="128" width="150" height="44" fill="#09090b" stroke="#27272a" />
        <text x="477" y="148" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="monospace">OpenRouter</text>
        <text x="477" y="162" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">failover</text>
        {/* to model */}
        <line x1="552" y1="112" x2="600" y2="112" stroke="#3f3f46" strokeDasharray="4 4" />
        <polygon points="600,108 608,112 600,116" fill="#EF6F2E" />
        <rect x="610" y="90" width="98" height="44" fill="#09090b" stroke="#27272a" />
        <text x="659" y="116" textAnchor="middle" fill="#fafafa" fontSize="10" fontFamily="monospace">model</text>
      </svg>

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

      {/* Diagram: cost/capability ladder with escalation */}
      <svg viewBox="0 0 720 220" role="img" aria-label="Auto routing scores the request, picks the cheapest capable model, and escalates up the ladder on failure" className="my-8 w-full h-auto rounded-lg border border-zinc-900 bg-zinc-950 p-3">
        <text x="16" y="28" fill="#71717a" fontSize="10" fontFamily="monospace" letterSpacing="1">SCORE REQUEST → PICK CHEAPEST CAPABLE → ESCALATE ON FAILURE</text>
        {[
          { x: 16, name: 'MiMo Flash', tag: 'cheapest', cap: 'simple' },
          { x: 192, name: 'MiMo V2.5 Pro', tag: 'default', cap: 'general' },
          { x: 368, name: 'Gemini Flash', tag: '', cap: 'long ctx' },
          { x: 544, name: 'Claude Sonnet', tag: 'priciest', cap: 'hard' },
        ].map((m, i) => (
          <g key={m.name}>
            <rect x={m.x} y="60" width="160" height="60" fill="#000000" stroke={i === 1 ? '#EF6F2E' : '#27272a'} strokeOpacity={i === 1 ? 0.6 : 1} />
            <text x={m.x + 80} y="84" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace">{m.name}</text>
            <text x={m.x + 80} y="100" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">{m.cap}</text>
            {m.tag && <text x={m.x + 80} y="113" textAnchor="middle" fill="#EF6F2E" fontSize="8" fontFamily="monospace">{m.tag}</text>}
            {i < 3 && (
              <g>
                <line x1={m.x + 160} y1="90" x2={m.x + 176} y2="90" stroke="#3f3f46" strokeDasharray="3 3" />
                <polygon points={`${m.x + 176},86 ${m.x + 184},90 ${m.x + 176},94`} fill="#EF6F2E" />
              </g>
            )}
          </g>
        ))}
        <text x="16" y="150" fill="#a1a1aa" fontSize="10" fontFamily="monospace">↑ cheaper · billed at the model that actually answered</text>
        <text x="16" y="170" fill="#71717a" fontSize="10" fontFamily="monospace">on rate-limit / 5xx / empty → step right, up to 3 attempts</text>
        <text x="16" y="196" fill="#EF6F2E" fontSize="10" fontFamily="monospace">x-gateway-served-model: names the winner</text>
      </svg>

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
