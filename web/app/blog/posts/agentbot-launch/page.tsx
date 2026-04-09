import Link from 'next/link';

export default function AgentbotLaunchPost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">March 31, 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Agentbot: The Managed Platform for Self-Hosted AI Agents</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Launch</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">v0.1.0-beta.1</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Self-Hosted</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Base</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6 font-bold">
 Your AI agent. Your hardware. Your rules.
 </p>

 <p className="text-lg text-zinc-300 mb-6">
 Today we&apos;re launching Agentbot — a managed platform for deploying autonomous AI agents on your own hardware. One command. Your API key. Your channels. Your data.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Problem</h2>
 <p className="text-zinc-300 mb-4">
 Cloud AI tools log your data, mark up your API costs, and lock you in. You&apos;re renting intelligence you don&apos;t control.
 </p>
 <p className="text-zinc-300 mb-4">
 ChatGPT, Claude, and every &quot;AI assistant&quot; SaaS share the same model: your data goes to their servers, they charge you a premium on top of the LLM provider&apos;s cost, and switching providers means losing everything.
 </p>
 <p className="text-zinc-300 mb-4 font-bold">
 That&apos;s not a product. That&apos;s a trap.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Solution</h2>
 <p className="text-zinc-300 mb-4">
 Agentbot puts the agent on <strong>your</strong> hardware.
 </p>
 <p className="text-zinc-300 mb-4 font-mono text-sm bg-zinc-950 p-4 border border-zinc-800">
 curl agentbot.raveculture.xyz/install | bash
 </p>
 <p className="text-zinc-300 mb-4">
 That&apos;s it. One command. Your agent is running on your machine — connected to Telegram, Discord, or WhatsApp. Your API key talks directly to your LLM provider. We don&apos;t touch the costs.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What You Get</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Self-hosted by design.</strong> Your data never leaves your machine. No cloud dependency. No vendor lock-in. Run it on a Raspberry Pi, a Mac Mini, or a VPS — wherever you have Docker.</li>
 <li><strong>Multi-channel out of the box.</strong> Connect your agent to Telegram, Discord, and WhatsApp simultaneously. One agent, multiple channels, unified memory.</li>
 <li><strong>BYOK — Bring Your Own Key.</strong> Use OpenAI, Anthropic, Google, or any OpenRouter-compatible provider. You pay them directly. Zero markup from us.</li>
 <li><strong>Autonomous agents, not chatbots.</strong> Memory that persists across conversations. Skills that compound. Scheduled tasks that run while you sleep. This isn&apos;t a decision tree — it&apos;s a thinking machine.</li>
 <li><strong>Onchain-native payments.</strong> x402 settlement on Base. Agent-to-agent marketplace. $AGENTBOT token for governance. The agent economy isn&apos;t coming — it&apos;s here.</li>
 <li><strong>Open source core.</strong> The architecture is MIT-licensed on GitHub. Inspect the code. Fork it. Build with us.</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">How It Works</h2>
 <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Install</strong> — Run one command on your machine</li>
 <li><strong>Configure</strong> — Set your API key and connect your channels</li>
 <li><strong>Deploy</strong> — Your agent is live in 60 seconds</li>
 <li><strong>Customize</strong> — Add skills, set memory, schedule tasks</li>
 </ol>
 <p className="text-zinc-300 mb-4">
 No YAML. No config files. No DevOps degree required.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Pricing</h2>
 <p className="text-zinc-300 mb-4">
 We don&apos;t do free tiers. Everyone pays. This is a feature — it filters out noise and signals quality.
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Solo:</strong> £29/mo — 1 agent, personal use</li>
 <li><strong>Collective:</strong> £69/mo — 3 agents, small team</li>
 <li><strong>Label:</strong> £149/mo — 10 agents, white-label for clients</li>
 <li><strong>Network:</strong> £499/mo — Unlimited agents, enterprise</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Stack</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Frontend:</strong> Next.js 16 (Vercel)</li>
 <li><strong>Backend:</strong> Node.js + Docker (Render)</li>
 <li><strong>Database:</strong> PostgreSQL + Redis</li>
 <li><strong>Payments:</strong> Stripe + x402 on Base</li>
 <li><strong>Auth:</strong> NextAuth (GitHub, Google, Wallet/SIWE)</li>
 <li><strong>Agent Runtime:</strong> OpenClaw (Docker)</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security</h2>
 <p className="text-zinc-300 mb-4">
 AI agents handle sensitive data. We took security seriously from day one:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Edge auth middleware (NextAuth session gate)</li>
 <li>Rate limiting on all auth endpoints</li>
 <li>AES-256-GCM token encryption at rest</li>
 <li>HMAC-signed OAuth state parameters</li>
 <li>0 npm vulnerabilities</li>
 <li>Webhook signature verification (Stripe, Resend, Mux)</li>
 <li>SSRF protection on all external API calls</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Vision</h2>
 <p className="text-zinc-300 mb-4">
 The agent economy is here. Agents that run on your hardware. Pay with x402 on Base. Memory that persists. Skills that compound.
 </p>
 <p className="text-zinc-300 mb-4 font-bold">
 We&apos;re not building a chatbot wrapper. We&apos;re building the infrastructure layer for autonomous AI agents.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Get Started</h2>
 <p className="text-zinc-300 mb-4">
 → <Link href="/onboard" className="text-blue-400 hover:text-blue-300">agentbot.raveculture.xyz</Link>
 </p>
 <p className="text-zinc-300 mb-4">
 → <a href="https://github.com/Eskyee/agentbot-opensource" className="text-blue-400 hover:text-blue-300">GitHub (MIT)</a>
 </p>
 <p className="text-zinc-300 mb-4">
 → <a href="https://raveculture.mintlify.app" className="text-blue-400 hover:text-blue-300">Docs</a>
 </p>

 <p className="text-xl text-zinc-300 mt-12 mb-4">
 Your AI agent. Your hardware. Your rules.
 </p>
 </article>
 </div>
 </main>
 );
}
