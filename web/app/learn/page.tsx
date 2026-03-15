import Link from 'next/link';

const beginnerGuides = [
  {
    title: 'Deploy Your First Agent',
    description: 'Get your AI agent running in 60 seconds. No setup required.',
    href: '/onboard',
    icon: '🚀'
  },
  {
    title: 'Connect Telegram',
    description: 'Give your agent a voice. Chat via Telegram.',
    href: '/onboard',
    icon: '💬'
  },
  {
    title: 'Add Your AI API Key',
    description: 'Bring your own key. OpenAI, Anthropic, Groq and more.',
    href: '/onboard',
    icon: '🔑'
  },
  {
    title: 'Choose Your Plan',
    description: 'From Starter to White Glove. Scale as you grow.',
    href: '/pricing',
    icon: '💰'
  }
];

const advancedGuides = [
  {
    title: 'Agent Swarms',
    description: 'Deploy multiple agents that work together. Collective intelligence.',
    href: '/dashboard',
    icon: '🕸️'
  },
  {
    title: 'Custom Skills',
    description: 'Build reusable skills to extend your agent capabilities.',
    href: '/dashboard/skills',
    icon: '🛠️'
  },
  {
    title: 'Workflows & Automation',
    description: 'Schedule tasks, trigger events, build pipelines.',
    href: '/dashboard',
    icon: '🔄'
  },
  {
    title: 'x402 Payments',
    description: 'Accept USDC payments. Build paid APIs for agents.',
    href: '/docs',
    icon: '🔒'
  },
  {
    title: 'Crypto Trading',
    description: 'Autonomous trading with Bankr. Connect your wallet.',
    href: '/dashboard/trading',
    icon: '📈'
  },
  {
    title: 'Production Deployment',
    description: 'Security, monitoring, scaling. Run agents at scale.',
    href: '/docs',
    icon: '🏭'
  },
  {
    title: '🎵 Live Streaming',
    description: 'DJ sets, agent DJ streams. Go live on baseFM.',
    href: '/basefm',
    icon: '🎧'
  },
  {
    title: '📻 baseFM Guides',
    description: 'Beginner & advanced guides for streaming on baseFM.',
    href: 'https://basefm.space/guide',
    icon: '📻'
  },
  {
    title: '🔄 Vercel Workflows',
    description: 'Lightweight pause/resume agents. Coming soon.',
    href: '#',
    icon: '⚡'
  }
];

const openclawDocs = [
  {
    title: 'Configuration',
    description: 'openclaw.json, environment variables, model routing',
    href: 'https://docs.openclaw.ai/config',
    icon: '⚙️'
  },
  {
    title: 'Providers',
    description: 'OpenRouter, OpenAI, Anthropic, Google, xAI, DeepSeek and more',
    href: 'https://docs.openclaw.ai/providers',
    icon: '🤖'
  },
  {
    title: 'Channels',
    description: 'Telegram, Discord, Slack, Web, Email integrations',
    href: 'https://docs.openclaw.ai/channels',
    icon: '📢'
  },
  {
    title: 'Skills',
    description: 'Extend with custom skills, marketplace, virus scanning',
    href: 'https://docs.openclaw.ai/skills',
    icon: '🧰'
  },
  {
    title: 'Memory',
    description: 'Agent memory, context, persistent state',
    href: 'https://docs.openclaw.ai/memory',
    icon: '🧠'
  },
  {
    title: 'CLI Reference',
    description: 'openclaw commands, flags, automation',
    href: 'https://docs.openclaw.ai/cli',
    icon: '⌨️'
  },
  {
    title: 'API Reference',
    description: 'REST API for programmatic control',
    href: 'https://docs.openclaw.ai/api',
    icon: '🔌'
  },
  {
    title: 'Troubleshooting',
    description: 'Common issues, debugging, logs',
    href: 'https://docs.openclaw.ai/troubleshooting',
    icon: '🔧'
  }
];

export default function LearnPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">📚 Learn Agentbot</h1>
          <p className="text-xl text-gray-400">
            From zero to production. Everything you need to deploy and scale AI agents.
          </p>
        </div>

        {/* Beginner Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🚀</span>
            <h2 className="text-2xl font-bold">Getting Started</h2>
          </div>
          <p className="text-gray-400 mb-6">
            New to Agentbot? Start here. Deploy your first agent in under a minute.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {beginnerGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{guide.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{guide.title}</h3>
                    <p className="text-gray-400 text-sm">{guide.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Advanced Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">⚡</span>
            <h2 className="text-2xl font-bold">Advanced</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Power user? Go deep. Swarms, skills, workflows, payments, and production scale.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advancedGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{guide.icon}</span>
                  <div>
                    <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors">{guide.title}</h3>
                    <p className="text-gray-500 text-sm">{guide.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* OpenClaw Docs Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📖</span>
            <h2 className="text-2xl font-bold">OpenClaw Documentation</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Full OpenClaw framework docs. Updated daily with the latest features.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {openclawDocs.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl bg-gray-900/30 border border-gray-800 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{doc.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm mb-1 group-hover:text-green-400 transition-colors flex items-center gap-1">
                      {doc.title}
                      <span className="text-gray-600">↗</span>
                    </h3>
                    <p className="text-gray-500 text-xs">{doc.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-green-900/10 border border-green-500/20">
            <p className="text-sm text-green-400">
              📡 OpenClaw docs synced daily from{' '}
              <a href="https://docs.openclaw.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-300">
                docs.openclaw.ai
              </a>
            </p>
          </div>
        </section>

        {/* baseFM Streaming Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📻</span>
            <h2 className="text-2xl font-bold">baseFM Streaming</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Go live on baseFM - the onchain radio station. Stream as a human DJ or deploy an AI agent to DJ autonomously.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <a href="https://basefm.space/guide/beginner" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 hover:border-green-400/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🌱</span>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">Beginner Guide</h3>
                  <p className="text-xs text-gray-500">New to crypto</p>
                </div>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• What is baseFM?</li>
                <li>• Setting up your wallet</li>
                <li>• Getting RAVE tokens</li>
                <li>• Tipping DJs & buying tickets</li>
              </ul>
            </a>
            <a href="https://basefm.space/guide/advanced" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 hover:border-purple-400/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🤓</span>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">Advanced Guide</h3>
                  <p className="text-xs text-gray-500">For developers</p>
                </div>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Tech stack & architecture</li>
                <li>• Smart contract details</li>
                <li>• Streaming setup (OBS, Mux)</li>
                <li>• API reference & webhooks</li>
              </ul>
            </a>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-500/20">
            <p className="text-sm text-gray-400">
              🎵 <strong>Listen live:</strong> <a href="https://basefm.space" target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">basefm.space</a> — 24/7 AI & human DJ streams. Or <a href="/basefm" className="text-purple-400 underline hover:text-purple-300">deploy your own DJ agent on Agentbot</a>.
            </p>
          </div>
        </section>

        {/* ClawSkills Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🛒</span>
            <h2 className="text-2xl font-bold">ClawSkills Marketplace</h2>
          </div>
          <p className="text-gray-400 mb-6">
            5,400+ community-built skills. Extend your agent with superpowers.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a href="https://clawhub.net" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 hover:border-orange-400/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🦞</span>
                <div>
                  <h3 className="font-bold group-hover:text-orange-400 transition-colors">ClawHub</h3>
                  <p className="text-xs text-gray-500">3,286 skills</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">Official skill marketplace with vector search, ratings, and 1.5M+ downloads.</p>
            </a>
            <a href="https://github.com/VoltAgent/awesome-openclaw-skills" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-white/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-bold group-hover:text-white transition-colors">Awesome List</h3>
                  <p className="text-xs text-gray-500">5,400+ skills</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">Curated collection of best skills from the community.</p>
            </a>
            <a href="https://learnopenclaw.com/core-concepts/skills" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-white/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="font-bold group-hover:text-white transition-colors">Learn OpenClaw</h3>
                  <p className="text-xs text-gray-500">Docs & guides</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">How skills work, how to build them, and best practices.</p>
            </a>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-orange-900/10 border border-orange-500/20">
            <p className="text-sm text-orange-400">
              🔥 Trending skills: GitHub, AgentMail, Tavily Search, Autonomous Brain, Security Suite
            </p>
          </div>
        </section>

        {/* Quick Reference */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💡</span>
            <h2 className="text-2xl font-bold">Quick Reference</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
              <h3 className="font-bold mb-4">Environment Variables</h3>
              <pre className="text-sm text-gray-400 overflow-x-auto">
{`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=...
OPENROUTER_API_KEY=...`}
              </pre>
            </div>
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
              <h3 className="font-bold mb-4">Default Models</h3>
              <pre className="text-sm text-gray-400 overflow-x-auto">
{`Primary: Kimi K2.5 (fast)
Fallback: GPT-4o Mini
Reasoning: DeepSeek R1
Vision: Claude 3.5 Sonnet`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
