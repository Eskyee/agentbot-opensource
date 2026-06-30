import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const beginnerGuides = [
  {
    title: 'Deploy Your First Agent',
    description: 'Get your AI agent running in 60 seconds. No setup required.',
    href: '/onboard',
  },
  {
    title: 'Connect Telegram',
    description: 'Give your agent a voice. Chat via Telegram.',
    href: '/onboard',
  },
  {
    title: 'Add Your AI API Key',
    description: 'Bring your own key. OpenAI, Anthropic, Groq and more.',
    href: '/onboard',
  },
  {
    title: 'Choose Your Plan',
    description: 'From Starter to White Glove. Scale as you grow.',
    href: '/pricing',
  },
];

const advancedGuides = [
  {
    title: 'Agent Swarms',
    description: 'Deploy multiple agents that work together. Collective intelligence.',
    href: '/dashboard',
    label: 'agents',
  },
  {
    title: 'Custom Skills',
    description: 'Build reusable skills to extend your agent capabilities.',
    href: '/dashboard/skills',
    label: 'extensibility',
  },
  {
    title: 'Workflows & Automation',
    description: 'Schedule tasks, trigger events, build pipelines.',
    href: '/dashboard',
    label: 'automation',
  },
  {
    title: 'x402 Payments',
    description: 'Accept USDC payments. Build paid APIs for agents.',
    href: '/documentation',
    label: 'payments',
  },
  {
    title: 'Crypto Trading',
    description: 'Autonomous trading with Bankr. Connect your wallet.',
    href: '/dashboard/trading',
    label: 'finance',
  },
  {
    title: 'Production Deployment',
    description: 'Security, monitoring, scaling. Run agents at scale.',
    href: '/documentation',
    label: 'infra',
  },
  {
    title: 'Live Streaming',
    description: 'DJ sets, agent DJ streams. Go live on baseFM.',
    href: '/basefm',
    label: 'music',
  },
  {
    title: 'baseFM Guides',
    description: 'Beginner & advanced guides for streaming on baseFM.',
    href: 'https://basefm.space/guide',
    label: 'music',
  },
  {
    title: 'Vercel Workflows',
    description: 'Lightweight pause/resume agents. Coming soon.',
    href: '#',
    label: 'coming soon',
  },
];

const openclawDocs = [
  {
    title: 'Configuration',
    description: 'openclaw.json, env vars, model routing',
    href: 'https://docs.openclaw.ai/config',
  },
  {
    title: 'Providers',
    description: 'OpenRouter, OpenAI, Anthropic, Google, xAI',
    href: 'https://docs.openclaw.ai/providers',
  },
  {
    title: 'Channels',
    description: 'Telegram, Discord, Slack, Web, Email',
    href: 'https://docs.openclaw.ai/channels',
  },
  {
    title: 'Skills',
    description: 'Extend with custom skills, marketplace',
    href: 'https://docs.openclaw.ai/skills',
  },
  {
    title: 'Memory',
    description: 'Agent memory, context, persistent state',
    href: 'https://docs.openclaw.ai/memory',
  },
  {
    title: 'CLI Reference',
    description: 'openclaw commands, flags, automation',
    href: 'https://docs.openclaw.ai/cli',
  },
  {
    title: 'API Reference',
    description: 'REST API for programmatic control',
    href: 'https://docs.openclaw.ai/api',
  },
  {
    title: 'Troubleshooting',
    description: 'Common issues, debugging, logs',
    href: 'https://docs.openclaw.ai/troubleshooting',
  },
];

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">
            Documentation
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Learn Agentbot
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg">
            This is the main “how to use Agentbot” hub. Start here if you want guided paths,
            platform walkthroughs, and the cleanest route from zero to a working agent.
          </p>
        </div>

        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              New Operators
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">Interactive Coaching</h2>
          </div>
          <div className="border border-orange-500/20 bg-orange-500/5 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-orange-400 mb-2">
                  Agentbot Coach
                </h3>
                <p className="text-sm text-zinc-400 max-w-lg">
                  Follow the interactive factory protocol. Step-by-step coaching modules to master
                  agent deployment, verification, and Bitcoin integration.
                </p>
              </div>
              <Link
                href="/dashboard/coach"
                className="inline-flex items-center gap-2 bg-orange-500 text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors whitespace-nowrap"
              >
                Start Coaching Module
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Start Here
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              Choose The Right Guide
            </h2>
          </div>
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-3">
            <Link href="/why" className="bg-black p-6 hover:bg-zinc-950 transition-colors group">
              <h3 className="text-sm font-bold tracking-tight uppercase mb-2 group-hover:text-white transition-colors">
                Why Agentbot
              </h3>
              <p className="text-xs text-zinc-500">
                Best starting point for understanding what Agentbot is, why it exists, and how it
                compares to running OpenClaw locally.
              </p>
            </Link>
            <Link
              href="/documentation"
              className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
            >
              <h3 className="text-sm font-bold tracking-tight uppercase mb-2 group-hover:text-white transition-colors">
                Docs & Operator Guide
              </h3>
              <p className="text-xs text-zinc-500">
                Use this when you need structured reference material for plans, runtime behavior,
                models, features, and platform operations.
              </p>
            </Link>
            <Link
              href="/learn/developers"
              className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
            >
              <h3 className="text-sm font-bold tracking-tight uppercase mb-2 group-hover:text-white transition-colors">
                For Developers
              </h3>
              <p className="text-xs text-zinc-500">
                Use this when you want APIs, SDKs, architecture, Gitlawb, runtime guides, and
                implementation-facing documentation.
              </p>
            </Link>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 01
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">Getting Started</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            New to Agentbot? Start here. This section is about using the platform, not building the
            platform.
          </p>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            {beginnerGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
              >
                <h3 className="text-sm font-bold tracking-tight uppercase mb-2 group-hover:text-white transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-zinc-500">{guide.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Advanced */}
        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 02
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">Advanced</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            Power user? Go deep. Swarms, skills, workflows, payments, and production scale.
          </p>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <Link
              href="/learn/advanced"
              className="group block bg-black p-8 hover:bg-zinc-950 transition-colors"
            >
              <h3 className="text-lg font-bold tracking-tighter uppercase mb-3 group-hover:text-white transition-colors">
                Advanced Guides →
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                Multi-agent swarms, x402 payments, autonomous trading, production hardening, ACP
                sessions, streaming.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Swarms', 'Payments', 'Trading', 'Security', 'Streaming'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
            <Link
              href="/learn/developers"
              className="group block bg-black p-8 hover:bg-zinc-950 transition-colors"
            >
              <h3 className="text-lg font-bold tracking-tighter uppercase mb-3 group-hover:text-white transition-colors">
                For Developers →
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                APIs, SDKs, code examples, runtime guides, architecture docs, open source repos.
                Build on Agentbot.
              </p>
              <div className="flex flex-wrap gap-2">
                {['API', 'SDKs', 'x402', 'Open Source', 'Architecture'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </div>
        </section>

        {/* OpenClaw Docs */}
        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 03
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              OpenClaw Documentation
            </h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            Full OpenClaw framework docs. Updated daily with the latest features.
          </p>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
            {openclawDocs.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black p-4 hover:bg-zinc-950 transition-colors group"
              >
                <h3 className="text-xs font-bold tracking-tight mb-1 group-hover:text-white transition-colors flex items-center gap-1">
                  {doc.title}
                  <svg
                    className="w-3 h-3 text-zinc-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </h3>
                <p className="text-[10px] text-zinc-600">{doc.description}</p>
              </a>
            ))}
          </div>

          <div className="mt-6 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">
              Docs synced daily from{' '}
              <a
                href="https://docs.openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline"
              >
                docs.openclaw.ai
              </a>
            </p>
          </div>
        </section>

        {/* baseFM Streaming */}
        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 04
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">baseFM Streaming</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            Go live on baseFM — the onchain radio station. Human DJs and AI agent streams.
          </p>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <a
              href="https://basefm.space/guide/beginner"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
                Beginner
              </span>
              <h3 className="text-sm font-bold tracking-tight uppercase mb-3 group-hover:text-white transition-colors">
                Beginner Guide
              </h3>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>What is baseFM?</li>
                <li>Setting up your wallet</li>
                <li>Getting RAVE tokens</li>
                <li>Tipping DJs & buying tickets</li>
              </ul>
            </a>
            <a
              href="https://basefm.space/guide/advanced"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black p-6 hover:bg-zinc-950 transition-colors group"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
                Advanced
              </span>
              <h3 className="text-sm font-bold tracking-tight uppercase mb-3 group-hover:text-white transition-colors">
                Advanced Guide
              </h3>
              <ul className="text-xs text-zinc-500 space-y-1">
                <li>Tech stack & architecture</li>
                <li>Smart contract details</li>
                <li>Streaming setup (OBS, Mux)</li>
                <li>API reference & webhooks</li>
              </ul>
            </a>
          </div>

          <div className="mt-px bg-zinc-800">
            <div className="bg-black p-4">
              <p className="text-xs text-zinc-500">
                Listen live:{' '}
                <a
                  href="https://basefm.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline"
                >
                  basefm.space
                </a>{' '}
                — 24/7 AI & human DJ streams. Or{' '}
                <a href="/basefm" className="text-white underline">
                  deploy your own DJ agent
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ClawSkills */}
        <section className="mb-16">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 05
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              ClawSkills Marketplace
            </h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            5,400+ community-built skills. Extend your agent with superpowers.
          </p>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="https://clawhub.net"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black p-5 hover:bg-zinc-950 transition-colors group"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
                3,286 skills
              </span>
              <h3 className="text-sm font-bold tracking-tight mb-1 group-hover:text-white transition-colors">
                ClawHub
              </h3>
              <p className="text-xs text-zinc-500">
                Official skill marketplace with vector search, ratings, and 1.5M+ downloads.
              </p>
            </a>
            <a
              href="https://github.com/VoltAgent/awesome-openclaw-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black p-5 hover:bg-zinc-950 transition-colors group"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
                5,400+ skills
              </span>
              <h3 className="text-sm font-bold tracking-tight mb-1 group-hover:text-white transition-colors">
                Awesome List
              </h3>
              <p className="text-xs text-zinc-500">
                Curated collection of best skills from the community.
              </p>
            </a>
            <a
              href="https://learnopenclaw.com/core-concepts/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black p-5 hover:bg-zinc-950 transition-colors group"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
                Docs & guides
              </span>
              <h3 className="text-sm font-bold tracking-tight mb-1 group-hover:text-white transition-colors">
                Learn OpenClaw
              </h3>
              <p className="text-xs text-zinc-500">
                How skills work, how to build them, and best practices.
              </p>
            </a>
          </div>

          <div className="mt-px bg-zinc-800">
            <div className="bg-black p-4">
              <p className="text-xs text-zinc-500">
                Trending: GitHub, AgentMail, Tavily Search, Autonomous Brain, Security Suite
              </p>
            </div>
          </div>
        </section>

        {/* Quick Reference */}
        <section>
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 block">
              Section 06
            </span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">Quick Reference</h2>
          </div>

          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            <div className="bg-black p-6">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">
                Environment Variables
              </span>
              <pre className="text-xs text-zinc-400 overflow-x-auto">
                {`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=...
OPENROUTER_API_KEY=...`}
              </pre>
            </div>
            <div className="bg-black p-6">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">
                Default Models
              </span>
              <pre className="text-xs text-zinc-400 overflow-x-auto">
                {`Primary: Kimi K2.5 (fast)
Fallback: GPT-4o Mini
Reasoning: DeepSeek R1
Vision: Claude 3.5 Sonnet`}
              </pre>
            </div>
          </div>
        </section>

        <section className="mt-16 border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
            Still Not Sure?
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/why" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Read why Agentbot exists →
            </Link>
            <Link
              href="/documentation"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Open docs and operator guide →
            </Link>
            <Link
              href="/learn/developers/openclaw-dashboard"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Open runtime & skills setup guide →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
