import type { Metadata } from 'next'
import Link from 'next/link'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Docs — Agentbot',
  description: 'Deploy and operate your AI agent. Connect Telegram, Discord, and WhatsApp. Your agent works 24/7.',
  openGraph: {
    title: 'Docs — Agentbot',
    description: 'Deploy and operate your AI agent.',
    url: buildAppUrl('/documentation'),
  },
}

const sections = [
  {
    title: 'Get your agent running',
    items: [
      'Sign up — your agent deploys in under 2 minutes',
      'Connect Telegram, Discord, or WhatsApp from the dashboard',
      'Give your agent its first task — try "check my inbox" or "summarise this"',
      'Your agent runs 24/7 on its own server. Check back when you want.',
    ],
  },
  {
    title: 'Connect your channels',
    items: [
      'Telegram — paste your bot token',
      'Discord — paste your bot token',
      'WhatsApp — scan a QR code',
      'One brain, multiple channels — your agent remembers everything across all of them',
    ],
  },
  {
    title: 'What your agent can do',
    items: [
      'Skills are capabilities — email, web search, crypto, file management, and more',
      'Every skill is included on every plan. No tiers. No paywalls.',
      'Install skills from the dashboard or the skill library',
      'Create custom skills with the skill creator',
    ],
  },
  {
    title: 'Automate repetitive work',
    items: [
      'Set up automations — daily briefings, monitoring, scheduled posts',
      'Cron jobs for recurring work — your agent runs them on schedule',
      'Chain actions: "when X happens, do Y"',
      'Your agent executes everything autonomously. You set the rules once.',
    ],
  },
  {
    title: 'Monitor and manage',
    items: [
      'Dashboard shows your agent\'s status, activity, and health at a glance',
      'View conversation history and task results',
      'Manage channels, skills, and settings from one place',
      'Health checks and uptime monitoring built in',
    ],
  },
  {
    title: 'Plans and pricing',
    items: [
      'Solo £29/mo — 1 agent, always on',
      'Collective £69/mo — 3 agents, custom workflows',
      'Label £149/mo — 10 agents, API access, white-label',
      'All plans include every feature. No hidden tiers. No surprises.',
    ],
  },
]

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Docs
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Getting Started
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent.<br /><span className="text-orange-500">Everything you need.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Deploy your agent, connect your channels, give it tasks. It handles the rest.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16">

        <div className="space-y-px bg-zinc-800">
          {sections.map((section) => (
            <section key={section.title} className="bg-black p-6 sm:p-8">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">{section.title}</h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="text-zinc-500 text-xs flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-16 text-center">
          <p className="text-zinc-500 text-sm mb-6">Ready to deploy?</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Deploy Your Agent →
          </Link>
        </section>
      </div>
    </main>
  )
}
