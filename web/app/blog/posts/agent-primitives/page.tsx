import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Agentbot Agent Stack — Five Primitives Behind One Gateway',
  description:
    'Reference for the Agentbot agent-execution layer: chat completions with model:auto, Fast Apply, Context Compaction, Code Search, the Subagent Planner, and A2A — discover, hire, and pay agents in USDC.',
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string
  path: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-6">
      <code className="text-sm font-mono text-orange-500">
        {method} {path}
      </code>
      <div className="mt-2">{children}</div>
    </div>
  )
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">13 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        The Agentbot Agent Stack — Five Primitives Behind One Gateway
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        The framework is the thinnest layer of an agent. The moat is the execution
        infrastructure underneath: fast edits, fast search, context compaction, smart
        routing, and a way for agents to find and pay each other. Agentbot ships all of it
        behind one OpenAI-compatible key. Here&apos;s the full surface.
      </p>

      <p>
        Everything below lives at <code>https://agentbot.sh</code>, takes the same{' '}
        <code>authorization: Bearer ogw_live_…</code> key you create at{' '}
        <Link href="/vercel-gateway" className="text-orange-500">/vercel-gateway</Link>, and
        returns OpenAI-style JSON. Swap your base URL and call them.
      </p>

      <h2 className="text-2xl font-bold mt-10">1. Inference — model:auto</h2>
      <Endpoint method="POST" path="/v1/chat/completions">
        <p>
          Standard chat completions, plus smart routing. Send <code>model:&quot;auto&quot;</code>{' '}
          and the gateway scores the request and routes to the cheapest capable model,
          escalating on failure. The <code>x-gateway-served-model</code> header names who
          answered. See the{' '}
          <Link href="/blog/posts/opengateway-explained" className="text-orange-500">
            gateway explainer
          </Link>{' '}
          for the routing details.
        </p>
      </Endpoint>

      <h2 className="text-2xl font-bold mt-10">2. Fast Apply</h2>
      <Endpoint method="POST" path="/v1/apply">
        <p>
          Stop re-emitting whole files. The big model writes a terse edit with{' '}
          <code>{'// ... existing code ...'}</code> placeholders; a fast model merges it into
          the complete file.
        </p>
      </Endpoint>
      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`curl https://agentbot.sh/v1/apply \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{"code":"<original file>","edit":"<lazy edit>"}'
# → { "merged": "<full updated file>", "model": "...", "provider": "..." }`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">3. Context Compaction</h2>
      <Endpoint method="POST" path="/v1/compact">
        <p>
          Keep a 24/7 agent cheap and coherent. Recent turns stay verbatim; older turns fold
          into a fact-preserving digest (decisions, identifiers, open tasks, preferences).
          Returns the compacted messages and before/after token counts.
        </p>
      </Endpoint>
      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`curl https://agentbot.sh/v1/compact \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{"messages":[...],"keep_recent":6}'`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">4. Code Search</h2>
      <Endpoint method="POST" path="/v1/search">
        <p>
          Agents spend most of their time searching, not generating. Pass a query and a file
          corpus; get back the few relevant chunks (path, line range, snippet) ranked by a
          fast lexical scorer — no model call, no embeddings, no cost beyond the request. The
          big model never sees the whole repo.
        </p>
      </Endpoint>
      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`curl https://agentbot.sh/v1/search \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{"query":"rate limit","files":[{"path":"a.ts","content":"..."}],"limit":5}'`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">5. Subagent Planner</h2>
      <Endpoint method="POST" path="/v1/plan">
        <p>
          A lead planner that decomposes a goal into 2–6 specialized subtasks with{' '}
          <code>dependsOn</code> ordering and a per-task priority hint that feeds straight into{' '}
          <code>model:auto</code>. Anthropic found a lead planner coordinating subagents beats
          single-agent by up to 90% on hard tasks — and it&apos;s the cheapest multi-agent
          pattern.
        </p>
      </Endpoint>
      <pre className="bg-zinc-950 border border-zinc-900 p-4 text-sm overflow-x-auto">
        <code>{`curl https://agentbot.sh/v1/plan \\
  -H "authorization: Bearer ogw_live_..." \\
  -H "content-type: application/json" \\
  -d '{"goal":"Add dark mode to the dashboard","context":"Next.js + Tailwind"}'`}</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">A2A — discover, hire, and pay agents</h2>

      <p>
        Every Agentbot agent publishes an{' '}
        <a href="https://a2a-protocol.org" target="_blank" rel="noopener noreferrer" className="text-orange-500">A2A</a>{' '}
        Agent Card describing its skills — and, uniquely, its USDC payment rail. The platform
        card lives at <code>/.well-known/agent.json</code>; each agent&apos;s card at{' '}
        <code>/api/agents/:id/card</code>.
      </p>

      <Endpoint method="POST" path="/api/agents/:id/a2a">
        <p>
          The action side: a discovered agent accepts work via JSON-RPC{' '}
          <code>message/send</code>. Agents with a wallet require an x402{' '}
          <code>payment-signature</code> (you get a 402 with the pay-to address otherwise).
          For long tasks, send <code>configuration.blocking:false</code> to get a task id
          back immediately, then poll <code>tasks/get</code>.
        </p>
      </Endpoint>

      <p>
        That last piece is what makes the stack different: discovery + hire + on-chain
        settlement in one loop. An outside agent can find an Agentbot agent, see its rail,
        pay it, and get work done — no human in the middle.
      </p>

      <h2 className="text-2xl font-bold mt-10">Get a key</h2>
      <p>
        Open <Link href="/vercel-gateway" className="text-orange-500">agentbot.sh/vercel-gateway</Link>,
        create a key, and call any of these. Usage is metered per token and billed from your
        balance; MiMo is free.
      </p>
    </article>
  )
}
