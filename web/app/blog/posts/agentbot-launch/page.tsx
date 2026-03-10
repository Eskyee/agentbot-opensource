import Link from 'next/link';

export default function AgentbotLaunchPost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">March 2026</p>
            <h1 className="text-4xl font-bold mb-4">Introducing Agentbot: Your AI Agent. Hosted. Always Online.</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Launch</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">OpenClaw</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            After 3 months of building, security hardening, and infrastructure work—Agentbot is live. Here's the story behind it and why it exists.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">The Problem</h2>
          <p className="text-gray-300 mb-4">
            Building AI agents is easy. Deploying them is hard.
          </p>
          <p className="text-gray-300 mb-4">
            OpenClaw is an incredible framework—an AI assistant with personality, memory, and skills. But running it 24/7? That requires:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Server infrastructure</li>
            <li>Docker orchestration</li>
            <li>SSL certificates</li>
            <li>Reverse proxies</li>
            <li>Payment integration</li>
            <li>Security hardening</li>
            <li>24/7 monitoring</li>
          </ul>
          <p className="text-gray-300 mb-4">
            Most developers just want to <em>talk</em> to their AI agent. Not manage a server farm.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">The Solution</h2>
          <p className="text-gray-300 mb-4">
            Agentbot = OpenClaw as a Service.
          </p>
          <p className="text-gray-300 mb-4">
            One-click deploy. Your API key. No markup. No credit system. Just conversation.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's Included</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>One-click deploy</strong> — From signup to chatting with your agent in under 60 seconds</li>
            <li><strong>24/7 availability</strong> — Cloud-hosted, always online, zero maintenance</li>
            <li><strong>Multi-channel</strong> — Telegram, Discord, WhatsApp support</li>
            <li><strong>Custom domains</strong> — White-label ready for agencies</li>
            <li><strong>Your API key</strong> — We never touch it. You pay your AI provider directly.</li>
            <li><strong>A+ Security</strong> — Rate limiting, CSRF protection, session auth everywhere</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Pricing</h2>
          <p className="text-gray-300 mb-4">
            Simple. Transparent. Scale as you grow.
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Starter:</strong> £19/mo — 1 agent, 2GB RAM, Telegram</li>
            <li><strong>Pro:</strong> £39/mo — Custom domain, WhatsApp, 4GB RAM</li>
            <li><strong>Scale:</strong> £79/mo — 3 agents, 8GB RAM, white-label</li>
            <li><strong>Enterprise:</strong> £149/mo — Unlimited agents, 24/7 support</li>
            <li><strong>White Glove:</strong> £199/mo — 32GB RAM, dedicated account manager</li>
          </ul>
          <p className="text-gray-300 mb-4">
            First 14 days free. Cancel anytime.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Security First</h2>
          <p className="text-gray-300 mb-4">
            AI agents handle sensitive data. We took security seriously from day one:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>A+ security grade (verified)</li>
            <li>Rate limiting (Redis-backed)</li>
            <li>CSRF protection on all state-changing operations</li>
            <li>Session authentication on every protected route</li>
            <li>Debug routes blocked in production</li>
            <li>No hardcoded secrets—centralized API key management</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">The Stack</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Frontend:</strong> Next.js 16 (Vercel)</li>
            <li><strong>Backend:</strong> Node.js + Docker (Render)</li>
            <li><strong>Database:</strong> Neon (PostgreSQL)</li>
            <li><strong>Payments:</strong> Stripe</li>
            <li><strong>Auth:</strong> NextAuth (GitHub, Google, Email)</li>
            <li><strong>AI:</strong> OpenRouter (Kimi K2.5 default)</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's Next</h2>
          <p className="text-gray-300 mb-4">
            We're just getting started. Here's what's on the roadmap:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Usage analytics dashboard</li>
            <li>Agent templates (pre-configured for common use cases)</li>
            <li>Multi-agent support</li>
            <li>API access & webhooks</li>
            <li>More messaging channels</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Get Started</h2>
          <p className="text-gray-300 mb-4">
            → <Link href="/signup" className="text-blue-400 hover:text-blue-300">agentbot.raveculture.xyz</Link>
          </p>
          <p className="text-gray-300 mb-4">
            Questions? DM me or email hello@agentbot.raveculture.xyz
          </p>

          <p className="text-xl text-gray-300 mt-12 mb-4">
            🦞
          </p>
        </article>
      </div>
    </main>
  );
}
