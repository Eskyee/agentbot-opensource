import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">2 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">How We Built a Multi-Tenant AI Agent Platform (And Open-Sourced It)</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Multi-Tenant</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Architecture</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-4">
            We just published a deep-dive on how we built Agentbot — a multi-tenant AI agent platform that lets anyone deploy autonomous agents in under a minute. Here's the breakdown.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What the Article Covers</h2>
          <ul className="list-disc list-inside text-zinc-300 mb-4">
            <li><strong>Multi-tenancy architecture</strong> — isolated user data, session management, and resource allocation</li>
            <li><strong>OpenClaw Gateway</strong> — 8 channels (Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Google Chat, Nostr)</li>
            <li><strong>BYOK infrastructure</strong> — bring your own AI key, pay wholesale rates</li>
            <li><strong>Open source strategy</strong> — why we built in the open, shipped in private</li>
            <li><strong>Docker agent containers</strong> — OpenClaw running in Railway with auto-provisioning</li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why We Open Sourced</h2>
          <p className="text-zinc-300 mb-4">
            The open source repo (<a href="https://github.com/Eskyee/agentbot-opensource" className="text-blue-400 hover:text-blue-300">github.com/Eskyee/agentbot-opensource</a>) shows our architecture, CI quality, and code standards. The private repo has real features, customer data, and production infra.
          </p>
          <p className="text-zinc-300 mb-4">
            Building in the open builds trust. Contributors see the architecture, users see the code quality, and we attract talent without handing over the sauce.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Read the Full Article</h2>
          <p className="text-zinc-300 mb-4">
            → <a href="https://dev.to/agentbot/how-we-built-a-multi-tenant-ai-agent-platform-and-open-sourced-it-521g" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">How We Built a Multi-Tenant AI Agent Platform (And Open-Sourced It)</a>
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Links</h2>
          <ul className="list-disc list-inside text-zinc-300 mb-4">
            <li><strong>Live Platform:</strong> <a href="https://agentbot.sh" className="text-blue-400 hover:text-blue-300">agentbot.sh</a></li>
            <li><strong>Open Source:</strong> <a href="https://github.com/Eskyee/agentbot-opensource" className="text-blue-400 hover:text-blue-300">github.com/Eskyee/agentbot-opensource</a></li>
            <li><strong>Docs:</strong> <a href="https://raveculture.mintlify.app" className="text-blue-400 hover:text-blue-300">raveculture.mintlify.app</a></li>
          </ul>
        </article>
      </div>
    </main>
  );
}
