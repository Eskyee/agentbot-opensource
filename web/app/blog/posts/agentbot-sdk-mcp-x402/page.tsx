import Link from 'next/link'

export const metadata = {
  title: 'Agentbot SDK, MCP Server & x402 Payments — Full Stack AI Infrastructure',
  description: 'Announcing @agentbot/sdk, the Agentbot MCP Server, real tool execution, and x402 micropayments. The complete AI agent infrastructure stack.',
  openGraph: {
    title: 'Agentbot SDK, MCP Server & x402 Payments',
    description: 'The complete AI agent infrastructure stack. SDK, MCP, x402 — all MiMo-native.',
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        {/* Header */}
        <div className="mb-12">
          <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            ← Blog
          </Link>
          <div className="flex flex-wrap gap-2 mt-6 mb-4">
            <span className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Infrastructure
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              SDK
            </span>
            <span className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              MCP
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95] mt-8">
            <span className="text-orange-500">SDK.</span> MCP Server.<br />
            x402 Payments.<br />
            <span className="text-zinc-600">Full Stack.</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-6">
            June 3, 2026 · 6 min read
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <p>
            We just shipped three things that make Agentbot a complete AI agent infrastructure platform:
            a TypeScript SDK, an MCP server, and real x402 micropayment integration. All MiMo-native.
            All open source.
          </p>

          {/* ═══ SDK ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            1. <span className="text-orange-500">@agentbot/sdk</span>
          </h2>

          <p>
            A TypeScript SDK for building on Agentbot. Install it, connect, and you have full access
            to MiMo inference, agent management, and x402 payments.
          </p>

          <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs overflow-x-auto">
{`npm install @agentbot/sdk

import { AgentbotClient } from '@agentbot/sdk'

const client = new AgentbotClient({
  baseUrl: 'https://agentbot.sh',
  apiKey: 'your-api-key',
})

// Chat with MiMo V2.5 Pro
const response = await client.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'mimo-v2.5-pro',
})

// List available models
const models = await client.models()

// x402 micropayment
const result = await client.x402Pay({
  url: 'https://agentbot.sh/v1/x402/chat/completions',
  method: 'POST',
  body: { messages: [{ role: 'user', content: 'Hi' }] },
})`}
          </pre>

          <p>
            The SDK includes full TypeScript types for everything — <code>ChatMessage</code>,{' '}
            <code>ChatResponse</code>, <code>Model</code>, <code>Agent</code>, and more. No guessing.
            No <code>any</code> types. Just autocomplete.
          </p>

          <div className="grid grid-cols-2 gap-px bg-zinc-900 my-6">
            {[
              { module: 'client.ts', desc: 'AgentbotClient — chat, models, agents, health, x402Pay' },
              { module: 'types.ts', desc: 'Full TypeScript types for all API responses' },
              { module: 'x402.ts', desc: 'x402 payment helpers — discover, pay, check balance' },
              { module: 'mcp.ts', desc: 'MCP client — activate, deactivate, callTool' },
            ].map((item) => (
              <div key={item.module} className="bg-black p-4">
                <code className="text-orange-500 text-xs">{item.module}</code>
                <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ═══ MCP Server ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            2. <span className="text-orange-500">MCP Server</span>
          </h2>

          <p>
            A standalone MCP (Model Context Protocol) server that exposes MiMo inference, model
            discovery, x402 payments, and health checks as tools that any MCP-compatible client can use.
          </p>

          <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs overflow-x-auto">
{`# Install globally
npm install -g agentbot-mcp

# Run with MiMo key
MIMO_API_KEY=tp-ebz…3ou6 agentbot-mcp

# Or use with Claude Desktop / Cursor
# Add to your MCP config:
{
  "mcpServers": {
    "agentbot": {
      "command": "npx",
      "args": ["agentbot-mcp"],
      "env": {
        "MIMO_API_KEY": "tp-ebz…3ou6"
      }
    }
  }
}`}
          </pre>

          <p>
            Four tools, zero config:
          </p>

          <div className="space-y-px bg-zinc-900 my-6">
            {[
              { tool: 'chat', desc: 'Send chat completions to MiMo V2.5 Pro. 1M context, reasoning.' },
              { tool: 'list_models', desc: 'Discover available MiMo models and capabilities.' },
              { tool: 'x402_discover', desc: 'Search Agentic Market for paid services. Filter by category.' },
              { tool: 'health', desc: 'Check Agentbot platform health — main, gateway, models.' },
            ].map((item) => (
              <div key={item.tool} className="bg-black p-4 flex items-start gap-4">
                <code className="text-orange-500 text-xs shrink-0 w-28">{item.tool}</code>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <p>
            The MCP server runs on stdio — standard input/output. No HTTP server. No ports.
            Just pipe it into any MCP client and you have MiMo inference.
          </p>

          {/* ═══ x402 Payments ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            3. <span className="text-orange-500">x402 Micropayments</span>
          </h2>

          <p>
            Every <code>/v1/chat/completions</code> request now supports dual authentication:
            API key (existing users) or x402 payment signature (Agentic Market buyers).
          </p>

          <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs overflow-x-auto">
{`# No API key? Here's your 402:
curl https://agentbot.sh/v1/chat/completions

# Response: 402 Payment Required
# Header: PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Mi...

# Decoded:
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "maxAmountRequired": "1000",  // $0.001 USDC
    "payTo": "0x451cE4B37ad54BcFCD49b8a4140C17315358EDa5",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }]
}`}
          </pre>

          <p>
            Pay $0.001 USDC on Base, get MiMo V2.5 Pro inference. No account needed. No subscription.
            Just a wallet and a signature.
          </p>

          <p>
            We're indexed on Agentic Market — search for "Agentbot" and you'll find our inference
            endpoint alongside Claude, ChatGPT, and Groq. But 99% cheaper.
          </p>

          {/* ═══ MCP Handlers ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            4. <span className="text-orange-500">Real Tool Execution</span>
          </h2>

          <p>
            The MCP framework now executes real tools — not mocks:
          </p>

          <div className="space-y-px bg-zinc-900 my-6">
            {[
              { handler: 'websearch.search', desc: 'Brave Search API with DuckDuckGo fallback' },
              { handler: 'websearch.fetch_page', desc: 'Fetch URL, strip HTML, extract content' },
              { handler: 'context7.get_docs', desc: 'Context7 API with GitHub README fallback' },
              { handler: 'grep_app.search_code', desc: 'GitHub code search with rate-limit handling' },
              { handler: 'x402.discover_services', desc: 'Agentic Market API — search paid services' },
              { handler: 'x402.call_paid_endpoint', desc: 'Full x402 flow — 402 → sign → settle' },
              { handler: 'x402.check_balance', desc: 'USDC balance on Base via on-chain call' },
            ].map((item) => (
              <div key={item.handler} className="bg-black p-4 flex items-start gap-4">
                <code className="text-orange-500 text-xs shrink-0 w-48">{item.handler}</code>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <p>
            Skills can register custom handlers at runtime. The MCP manager handles activation,
            deactivation, idle timeouts (5 minutes), and capacity limits (10 concurrent MCPs).
          </p>

          {/* ═══ The Stack ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            The Full Stack
          </h2>

          <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs overflow-x-auto">
{`┌─────────────────────────────────────────────┐
│              @agentbot/sdk                  │
│  TypeScript client for everything below     │
├─────────────────────────────────────────────┤
│           Agentbot MCP Server               │
│  MiMo tools via Model Context Protocol      │
├─────────────────────────────────────────────┤
│          x402 Payment Protocol              │
│  USDC micropayments on Base                 │
├─────────────────────────────────────────────┤
│         Vercel Gateway (MiMo direct)        │
│  OpenAI-compat API, zero middleman          │
├─────────────────────────────────────────────┤
│           Xiaomi MiMo V2.5 Pro              │
│  1M context, reasoning, 99% cheaper         │
└─────────────────────────────────────────────┘`}
          </pre>

          <p>
            SDK → MCP → x402 → Gateway → MiMo. Five layers. All open source. All MiMo-native.
          </p>

          {/* ═══ Links ═══ */}
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter pt-8">
            Get Started
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            {[
              { label: 'SDK (npm)', href: 'https://www.npmjs.com/package/@agentbot/sdk' },
              { label: 'MCP Server (npm)', href: 'https://www.npmjs.com/package/agentbot-mcp' },
              { label: 'GitHub', href: 'https://github.com/Eskyee/agentbot-opensource' },
              { label: 'Documentation', href: '/documentation' },
              { label: 'MiMo Partnership', href: '/partner/mimo' },
              { label: 'Agentic Market', href: 'https://agentic.market' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="border border-zinc-800 hover:border-zinc-600 px-4 py-3 text-xs text-zinc-400 hover:text-white transition-colors text-center"
              >
                {link.label} →
              </a>
            ))}
          </div>

          <p className="text-zinc-500 text-xs pt-8 border-t border-zinc-900">
            Written by the Agentbot team. Powered by MiMo. Built on OpenClaw.
          </p>
        </div>
      </article>
    </main>
  )
}
