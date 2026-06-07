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
    title: 'Getting Started',
    items: [
      'Sign up and deploy your agent — under 2 minutes',
      'Connect Telegram, Discord, or WhatsApp from the dashboard',
      'Give your agent its first task',
      'Your agent runs 24/7 on its own server',
    ],
  },
  {
    title: 'Channels',
    items: [
      'Telegram — connect via bot token',
      'Discord — connect via bot token',
      'WhatsApp — connect via QR code pairing',
      'All channels share one brain — your agent remembers everything',
    ],
  },
  {
    title: 'Skills',
    items: [
      'Skills are what your agent can do — email, web search, crypto, and more',
      'All skills included on every plan — no tiers, no paywalls',
      'Install skills from the dashboard or the skill library',
      'Create custom skills with the skill creator',
    ],
  },
  {
    title: 'Workflows',
    items: [
      'Automate repetitive tasks — daily briefings, monitoring, scheduled posts',
      'Set up cron jobs for recurring work',
      'Chain actions together — "when X happens, do Y"',
      'Your agent executes workflows autonomously',
    ],
  },
  {
    title: 'Dashboard',
    items: [
      'See your agent\'s status, activity, and health',
      'View conversation history and task results',
      'Manage channels, skills, and settings',
      'Monitor resource usage and uptime',
    ],
  },
  {
    title: 'Billing',
    items: [
      'Solo £29/mo — 1 agent',
      'Collective £69/mo — 3 agents',
      'Label £149/mo — 10 agents',
      'All plans include everything — no hidden tiers',
    ],
  },
]

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Docs</span>
          <h1 className="text-4xl sm:5xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent.<br /><span className="text-orange-500">Everything you need.</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
            Deploy your agent, connect your channels, give it tasks. It handles the rest.
          </p>
        </section>

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
