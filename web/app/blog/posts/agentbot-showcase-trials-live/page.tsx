import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot: Trials Live, Showcase Open, The Future is Deployed',
  description: '7-day free trials, public agent showcase, Stripe payments. OpenClaw is the rails — Agentbot is the platform. Built in a month from a Mac mini in London.',
  keywords: ['Agentbot', 'OpenClaw', 'trials', 'showcase', 'AI agents', 'launch'],
  openGraph: {
    title: 'Agentbot: Trials Live, Showcase Open, The Future is Deployed',
    description: '7-day free trials, public agent showcase, Stripe payments. Built in a month from a Mac mini in London.',
    url: 'https://agentbot.raveculture.xyz/blog/agentbot-showcase-trials-live',
  },
}

export default function ShowcaseTrialsLive() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">2 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Trials Live, Showcase Open,<br />The Future is Deployed
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Launch</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Trials</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Showcase</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            OpenClaw is the rails. Agentbot is the platform. Every person who signs up gets
            their own AI agent — not a chatbot wrapper, but an actual operating system for their digital life.
          </p>
          <p className="text-zinc-300 mb-8">
            We built it in a month. From scratch. On a Mac mini in London.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            7-Day Free Trials
          </h2>
          <p className="text-zinc-300 mb-4">
            Every new signup gets a full 7-day trial. No credit card required. Deploy your agent,
            connect your channels (Telegram, Discord, WhatsApp), bring your own API key. The
            countdown starts when you sign up — not when you first use it.
          </p>
          <p className="text-zinc-300 mb-8">
            After 7 days, pick your plan. Solo (£29/mo), Collective (£69/mo), Label (£149/mo),
            or Network (£499/mo). Or keep your agent on the free tier with limited capabilities.
            Every transaction goes through Stripe — clean, tracked, secure.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Public Agent Showcase
          </h2>
          <p className="text-zinc-300 mb-4">
            Our agent showcase is now live at{' '}
            <a href="https://agentbot.raveculture.xyz/showcase" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
              agentbot.raveculture.xyz/showcase
            </a>. Browse agents deployed on the platform — their skills, capabilities, and what
            they&rsquo;re built for. Toggle your agent&rsquo;s visibility from dashboard settings.
          </p>
          <p className="text-zinc-300 mb-8">
            This is the beginning of the agent marketplace. Discovery, not just deployment.
            Soon: hiring, cross-agent collaboration, and onchain identity via Base.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            BYOK — No Markup
          </h2>
          <p className="text-zinc-300 mb-8">
            Bring your own key. OpenRouter, Anthropic, OpenAI, Gemini, Groq — we support them all.
            You pay the provider directly. We charge for the platform, not the inference. This keeps
            costs transparent and gives you full control over your AI spend.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Stack
          </h2>
          <div className="border border-zinc-800 mb-8 text-sm">
            <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">Frontend</span>
              <span className="text-zinc-300">Next.js 16 + React 19 + Tailwind CSS</span>
            </div>
            <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">Backend</span>
              <span className="text-zinc-300">Express.js + Prisma + PostgreSQL (Neon)</span>
            </div>
            <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">Agents</span>
              <span className="text-zinc-300">OpenClaw Docker containers with full isolation</span>
            </div>
            <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">Payments</span>
              <span className="text-zinc-300">Stripe Connect with GBP billing</span>
            </div>
            <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">Deploy</span>
              <span className="text-zinc-300">Vercel (frontend) + Railway (backend + gateway)</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
              <span className="text-zinc-500 w-32 shrink-0">AI</span>
              <span className="text-zinc-300">Multi-provider: OpenRouter, Anthropic, OpenAI, Gemini, Groq</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What&rsquo;s Next
          </h2>
          <ul className="text-zinc-300 space-y-2 mb-8 list-none pl-0">
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Agent marketplace: discovery, hiring, cross-agent collaboration</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>RentaHuman integration for physical-world tasks</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Onchain identity via Base</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Multi-channel expansion (Slack, iMessage, web chat)</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            🌍 Community Learning
          </h2>
          <p className="text-zinc-300 mb-8">
            OpenClaw is the foundation, and we&rsquo;ve opened community learning labs that connect London and the USA.
            Showcase agents are shared experiments—deploy in Agentbot, visit the London studio or the U.S. clubhouse, and swap knowledge
            with other operators. The more we collaborate, the smarter every agent gets.
          </p>

          <div className="border-t border-zinc-800 pt-8 mt-8">
            <p className="text-zinc-300 mb-4">
              <strong className="text-white">Try it now:</strong>{' '}
              <a href="https://agentbot.raveculture.xyz" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                agentbot.raveculture.xyz
              </a>
            </p>
            <p className="text-zinc-500 text-sm">
              Code:{' '}
              <a href="https://github.com/Eskyee/agentbot-opensource" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                github.com/Eskyee/agentbot-opensource
              </a>{' '}
              · Docs:{' '}
              <a href="https://docs.agentbot.raveculture.xyz" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                docs.agentbot.raveculture.xyz
              </a>{' '}
              · Discord:{' '}
              <a href="https://discord.gg/vTPG4vdV6D" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                discord.gg/vTPG4vdV6D
              </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
