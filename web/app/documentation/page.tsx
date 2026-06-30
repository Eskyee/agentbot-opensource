import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAppUrl } from '@/app/lib/app-url';

export const metadata: Metadata = {
  title: 'Docs — Agentbot',
  description:
    'Deploy and operate your AI agent. Connect Telegram, Discord, and WhatsApp. Your agent works 24/7.',
  openGraph: {
    title: 'Docs — Agentbot',
    description: 'Deploy and operate your AI agent.',
    url: buildAppUrl('/documentation'),
  },
};

// ─── Inline diagrams — same visual language as the homepage architecture SVG ──

function DeployFlowDiagram() {
  return (
    <svg
      viewBox="0 0 640 110"
      role="img"
      aria-label="Deploy flow: sign up, container boots in about 2 minutes, agent live 24/7"
      className="mt-6 w-full h-auto"
    >
      {[
        { x: 10, label: '1 · SIGN UP', sub: 'pick a plan' },
        { x: 230, label: '2 · BOOT', sub: '~2 min · own server' },
        { x: 450, label: '3 · LIVE 24/7', sub: 'give it work' },
      ].map((step, i) => (
        <g key={step.label}>
          <rect
            x={step.x}
            y={30}
            width={180}
            height={56}
            fill="none"
            stroke={i === 2 ? '#f97316' : '#27272a'}
            strokeOpacity={i === 2 ? 0.6 : 1}
          />
          <text
            x={step.x + 90}
            y={54}
            textAnchor="middle"
            fill={i === 2 ? '#f97316' : '#fafafa'}
            fontSize="11"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {step.label}
          </text>
          <text
            x={step.x + 90}
            y={72}
            textAnchor="middle"
            fill="#71717a"
            fontSize="9"
            fontFamily="monospace"
          >
            {step.sub}
          </text>
        </g>
      ))}
      <line x1={190} y1={58} x2={228} y2={58} stroke="#3f3f46" strokeDasharray="4 4" />
      <polygon points="228,54 236,58 228,62" fill="#f97316" />
      <line x1={410} y1={58} x2={448} y2={58} stroke="#3f3f46" strokeDasharray="4 4" />
      <polygon points="448,54 456,58 448,62" fill="#f97316" />
    </svg>
  );
}

function ChannelsDiagram() {
  return (
    <svg
      viewBox="0 0 640 170"
      role="img"
      aria-label="One agent brain with shared memory connected to Telegram, Discord, and WhatsApp"
      className="mt-6 w-full h-auto"
    >
      <rect
        x={10}
        y={50}
        width={200}
        height={70}
        fill="none"
        stroke="#f97316"
        strokeOpacity={0.6}
      />
      <text
        x={110}
        y={80}
        textAnchor="middle"
        fill="#fafafa"
        fontSize="11"
        fontFamily="monospace"
        letterSpacing="1"
      >
        YOUR AGENT
      </text>
      <text x={110} y={98} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">
        one brain · shared memory
      </text>
      {[
        { y: 15, label: 'Telegram', sub: 'bot token' },
        { y: 70, label: 'Discord', sub: 'bot token' },
        { y: 125, label: 'WhatsApp', sub: 'QR scan' },
      ].map((ch) => (
        <g key={ch.label}>
          <line x1={210} y1={85} x2={418} y2={ch.y + 17} stroke="#3f3f46" strokeDasharray="4 4" />
          <rect x={420} y={ch.y} width={200} height={34} fill="none" stroke="#27272a" />
          <text
            x={500}
            y={ch.y + 16}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="10"
            fontFamily="monospace"
          >
            {ch.label}
          </text>
          <text
            x={500}
            y={ch.y + 28}
            textAnchor="middle"
            fill="#52525b"
            fontSize="8"
            fontFamily="monospace"
          >
            {ch.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AutomationLoopDiagram() {
  return (
    <svg
      viewBox="0 0 640 130"
      role="img"
      aria-label="Automation loop: trigger fires, agent thinks, acts with skills, reports back, repeats on schedule"
      className="mt-6 w-full h-auto"
    >
      {[
        { x: 10, label: 'TRIGGER', sub: 'cron · event · "when X"' },
        { x: 172, label: 'THINK', sub: 'MiMo reasoning' },
        { x: 334, label: 'ACT', sub: 'skills do the work' },
        { x: 496, label: 'REPORT', sub: 'back to your channel' },
      ].map((step, i) => (
        <g key={step.label}>
          <rect x={step.x} y={30} width={134} height={52} fill="none" stroke="#27272a" />
          <text
            x={step.x + 67}
            y={52}
            textAnchor="middle"
            fill="#fafafa"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {step.label}
          </text>
          <text
            x={step.x + 67}
            y={68}
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
            fontFamily="monospace"
          >
            {step.sub}
          </text>
          {i < 3 && (
            <>
              <line
                x1={step.x + 134}
                y1={56}
                x2={step.x + 158}
                y2={56}
                stroke="#3f3f46"
                strokeDasharray="4 4"
              />
              <polygon
                points={`${step.x + 158},52 ${step.x + 166},56 ${step.x + 158},60`}
                fill="#f97316"
              />
            </>
          )}
        </g>
      ))}
      <path
        d="M 563 82 L 563 105 L 77 105 L 77 84"
        fill="none"
        stroke="#3f3f46"
        strokeDasharray="4 4"
      />
      <polygon points="73,86 77,78 81,86" fill="#f97316" />
      <text x={320} y={118} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">
        repeats on your schedule — no babysitting
      </text>
    </svg>
  );
}

const DIAGRAMS: Record<string, () => React.JSX.Element> = {
  'Get your agent running': DeployFlowDiagram,
  'Connect your channels': ChannelsDiagram,
  'Automate repetitive work': AutomationLoopDiagram,
};

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
      "Dashboard shows your agent's status, activity, and health at a glance",
      'View conversation history and task results',
      'Manage channels, skills, and settings from one place',
      'Health checks and uptime monitoring built in',
    ],
  },
  {
    title: 'Plans and pricing',
    items: [
      'Solo £29/mo — 1 agent, 1 OpenClaw deployment, always on',
      'Collective £69/mo — 5 agents, 5 OpenClaw deployments, custom workflows',
      'Label £149/mo — 20 agents, 20 OpenClaw deployments, API access, white-label',
      'All plans include every feature. No hidden tiers. No surprises.',
    ],
  },
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">
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
            Your agent.
            <br />
            <span className="text-orange-500">Everything you need.</span>
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
            {sections.map((section) => {
              const Diagram = DIAGRAMS[section.title];
              return (
                <section key={section.title} className="bg-black p-6 sm:p-8">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                    {section.title}
                  </h2>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="text-zinc-500 text-xs flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {Diagram && <Diagram />}
                </section>
              );
            })}
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
      </section>
    </main>
  );
}
