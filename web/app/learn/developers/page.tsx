import Link from 'next/link';

const devSections = [
  {
    category: 'API Reference',
    items: [
      {
        title: 'REST API',
        description: 'Full API for programmatic control. Provision agents, manage sessions, query health, trigger actions.',
        href: 'https://docs.openclaw.ai/api',
        tags: ['REST', 'JSON'],
      },
      {
        title: 'x402 Payment Gateway',
        description: 'Accept USDC on Base. POST /gateway/x402-node/settle for onchain settlement. Facilitator mode for A2A.',
        href: '/dashboard/x402',
        tags: ['Web3', 'USDC'],
      },
      {
        title: 'Bridge API',
        description: 'Agent-to-agent messaging. POST /api/bridge/send, GET /api/bridge/inbox. Secret-authenticated.',
        href: '/dashboard',
        tags: ['A2A', 'Messaging'],
      },
    ],
  },
  {
    category: 'SDKs & Libraries',
    items: [
      {
        title: '@bankr/sdk',
        description: 'Server-side minting, wallet ops, token management. Next.js API routes compatible.',
        href: 'https://docs.agentbot.raveculture.xyz',
        tags: ['Node.js', 'TypeScript'],
      },
      {
        title: 'OnchainKit',
        description: 'Coinbase wallet connection, Base network ops. wagmi v2 + viem v2 under the hood.',
        href: 'https://onchainkit.xyz',
        tags: ['React', 'Base'],
      },
      {
        title: 'OpenClaw CLI',
        description: 'openclaw init, configure, deploy, skills install. Full agent lifecycle from terminal.',
        href: 'https://docs.openclaw.ai/cli',
        tags: ['CLI', 'Automation'],
      },
    ],
  },
  {
    category: 'Architecture',
    items: [
      {
        title: 'Multi-Tenant Isolation',
        description: 'Per-user sessions, Prisma RLS, Docker containers. One platform, isolated agents.',
        href: '/dashboard/team',
        tags: ['Docker', 'Postgres'],
      },
      {
        title: 'Gateway Proxy Pattern',
        description: 'Dashboard → gateway-proxy → OpenClaw tools/invoke. Token-authenticated, per-user routing.',
        href: '/dashboard',
        tags: ['Proxy', 'Auth'],
      },
      {
        title: 'Provisioning Flow',
        description: 'Stripe → webhook → DB → frontend → backend → Docker agent. End-to-end automated.',
        href: '/onboard',
        tags: ['Stripe', 'Provision'],
      },
    ],
  },
  {
    category: 'Open Source',
    items: [
      {
        title: 'Agentbot Open Source',
        description: 'MIT license. Architecture demo, CI/CD patterns, contribution guidelines.',
        href: 'https://github.com/Eskyee/agentbot-opensource',
        tags: ['MIT', 'GitHub'],
      },
      {
        title: 'OpenClaw Framework',
        description: 'The agent runtime. 12+ channels, 34 models, plugin system, memory engine.',
        href: 'https://github.com/openclaw/openclaw',
        tags: ['Apache 2.0', 'GitHub'],
      },
      {
        title: 'ClawHub Skills',
        description: '5,400+ community skills. npm-compatible, hot-reload, vector search marketplace.',
        href: 'https://clawhub.net',
        tags: ['Marketplace', 'npm'],
      },
    ],
  },
];

const apiEndpoints = [
  { method: 'POST', path: '/api/provision', desc: 'Provision new agent instance' },
  { method: 'GET', path: '/api/health', desc: 'Platform health check' },
  { method: 'GET', path: '/api/agents', desc: 'List registered agents' },
  { method: 'POST', path: '/api/bridge/send', desc: 'Send agent-to-agent message' },
  { method: 'GET', path: '/api/bridge/inbox', desc: 'Read agent inbox' },
  { method: 'POST', path: '/api/x402', desc: 'x402 payment settlement' },
  { method: 'GET', path: '/api/gateway/status', desc: 'Combined gateway status' },
  { method: 'POST', path: '/api/cron', desc: 'Schedule recurring tasks' },
];

const codeExamples = [
  {
    title: 'Provision Agent',
    language: 'bash',
    code: `curl -X POST https://agentbot.raveculture.xyz/api/provision \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "dev@example.com",
    "plan": "collective",
    "stripeSubscriptionId": "sub_..."
  }'`,
  },
  {
    title: 'Agent Bridge',
    language: 'bash',
    code: `# Send message between agents
curl -X POST https://agentbot.raveculture.xyz/api/bridge/send \\
  -H "X-Bridge-Secret: $SECRET" \\
  -d '{
    "sender": "agent-alpha",
    "channel": "tasks",
    "content": "Deploy to staging"
  }'`,
  },
  {
    title: 'x402 Settlement',
    language: 'bash',
    code: `# Settle x402 payment on Base
curl -X POST https://agentbot.raveculture.xyz/api/x402 \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "0.01",
    "asset": "USDC",
    "network": "base"
  }'`,
  },
  {
    title: 'OpenClaw Config',
    language: 'json',
    code: `{
  "model": "openrouter/xiaomi/mimo-v2-pro",
  "channels": {
    "telegram": { "enabled": true },
    "discord": { "enabled": true }
  },
  "tools": {
    "exec": { "requireApproval": true },
    "memory": { "enabled": true }
  },
  "heartbeat": {
    "intervalMs": 1800000
  }
}`,
  },
];

export default function LearnDevelopersPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/learn" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Learn</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">Developers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">For Developers</h1>
          <p className="text-zinc-400 text-sm max-w-lg">
            APIs, SDKs, architecture, and code. Everything you need to build on Agentbot.
          </p>
        </div>

        {/* Topic Sections */}
        {devSections.map((section) => (
          <section key={section.category} className="mb-16">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tighter uppercase">{section.category}</h2>
            </div>
            <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
                >
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-900 px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                  <h3 className="text-sm font-bold tracking-tight mb-2 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* API Endpoints */}
        <section className="mb-16">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">Quick Reference</span>
            <h2 className="text-xl font-bold tracking-tighter uppercase">API Endpoints</h2>
          </div>
          <div className="border border-zinc-800 overflow-hidden">
            {apiEndpoints.map((ep, i) => (
              <div key={ep.path} className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-zinc-900' : ''}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 flex-shrink-0 ${
                  ep.method === 'POST' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'
                }`}>{ep.method}</span>
                <code className="text-xs text-zinc-300 flex-shrink-0">{ep.path}</code>
                <span className="text-xs text-zinc-600 ml-auto hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">Code</span>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Examples</h2>
          </div>
          <div className="grid gap-px bg-zinc-800 md:grid-cols-2">
            {codeExamples.map((example) => (
              <div key={example.title} className="bg-black p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{example.title}</h3>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-700">{example.language}</span>
                </div>
                <pre className="text-[11px] text-zinc-500 overflow-x-auto leading-relaxed">{example.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">Stack</span>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Architecture</h2>
          </div>
          <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Runtime', value: 'OpenClaw 2026.4.7' },
              { label: 'Frontend', value: 'Next.js 14 + React 19' },
              { label: 'Backend', value: 'Express + Prisma' },
              { label: 'Database', value: 'Neon Postgres' },
              { label: 'Cache', value: 'Upstash Redis' },
              { label: 'Hosting', value: 'Vercel + Railway' },
              { label: 'Payments', value: 'Stripe + x402' },
              { label: 'AI Models', value: '34 via OpenRouter' },
            ].map(item => (
              <div key={item.label} className="bg-black p-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-3">Start Building</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-lg">
            Open source, MIT license. Fork it, break it, ship it.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/onboard"
              className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
            >
              Deploy
            </Link>
            <a
              href="https://docs.openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
            >
              OpenClaw Docs
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
