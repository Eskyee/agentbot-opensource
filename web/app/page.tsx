import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import dynamic from 'next/dynamic'

const DashboardPreview = dynamic(() => import('@/app/components/DashboardPreview').then(m => ({ default: m.DashboardPreview })))

export default async function Home() {
  const session = await getAuthSession()

  return (
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30 font-mono overflow-x-hidden">

      {/* ━━━ HERO — MiMo + OpenClaw, one sentence ━━━ */}
      <section className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36 md:py-48">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
              Powered by MiMo
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Built on OpenClaw
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your AI agent.<br />
            <span className="text-orange-500">99% cheaper.</span><br />
            Deployed in<br />
            <span className="text-zinc-600">2 minutes.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Agentbot runs your personal AI assistant 24/7 — powered by Xiaomi MiMo
            and OpenClaw. Monitors your inbox, manages your calendar, posts to X,
            and handles tasks while you sleep. One click to deploy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup?plan=free"
                  className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Start Free — BYOK
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Deploy Agent — £29/mo
                </Link>
              </>
            )}
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              See Demo
            </Link>
          </div>

          {/* MiMo stat bar */}
          <div className="flex flex-wrap gap-6 pt-4 text-[10px] uppercase tracking-widest text-zinc-600">
            <div><span className="text-orange-500">99%</span> cheaper than GPT</div>
            <div><span className="text-orange-500">1M</span> token context</div>
            <div><span className="text-orange-500">82B</span> credits/mo</div>
            <div><span className="text-orange-500">24/7</span> always on</div>
          </div>
        </div>
      </section>

      {/* ━━━ PARTNERSHIP — MiMo + OpenClaw ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">The Stack</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">Xiaomi MiMo</div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">The Brain</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                MiMo V2.5 Pro — 1M context window, built-in reasoning, multimodal.
                99% cheaper than GPT-5.5. Token plans with 82B credits.
                20% off during off-peak hours. TTS models included free.
              </p>
            </div>
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">OpenClaw</div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">The Body</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Open-source personal AI runtime. Connects to Telegram, WhatsApp,
                Discord, and X. Persistent memory, skills, heartbeats, cron jobs.
                Your agent runs on your infra — not a walled garden.
              </p>
            </div>
          </div>
          <div className="mt-px bg-zinc-900">
            <div className="bg-black p-6 sm:p-8 text-center">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Together</div>
              <p className="text-zinc-400 text-sm">
                Agentbot is the <span className="text-white font-bold">first managed platform</span> combining
                MiMo inference with OpenClaw runtime. One click. Your agent is live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS — three steps ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">How It Works</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                num: '01',
                title: 'Deploy',
                body: 'Sign up, pick a plan, connect your channels. Your agent is live in under 2 minutes. MiMo handles the thinking.',
              },
              {
                num: '02',
                title: 'Configure',
                body: 'Tell your agent what to monitor, who to reply to, what to approve. Skills, workflows, and memory — all customizable.',
              },
              {
                num: '03',
                title: 'Scale',
                body: 'Add more agents, bring your own MiMo key (BYOK), connect Telegram, Discord, WhatsApp. Your fleet, your rules.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4">{step.num}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ WHAT YOUR AGENT DOES ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">What Your Agent Does</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              { label: 'Monitors X', body: 'Watches mentions, keywords, and high-signal posts. Surfaces what matters without you scrolling.' },
              { label: 'Drafts Replies', body: 'Generates replies and threads in your voice. You approve before anything goes live.' },
              { label: 'Manages Email', body: 'Reads your inbox, drafts responses, flags urgent messages. Works while you sleep.' },
              { label: 'Runs Workflows', body: 'Custom automations, cron jobs, scheduled tasks. Your agent does the repetitive work.' },
              { label: 'Streams Music', body: 'Connect to baseFM. Your agent can DJ, manage playlists, and run live streams.' },
              { label: 'Handles Payments', body: 'x402 onchain payments, Stripe billing, invoice generation. Bankr wallet integration for multi-chain balances and trades. Money moves automatically.' },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.label}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ DASHBOARD PREVIEW ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Your Command Center</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase">
              Monitor. Draft. <span className="text-zinc-700">Approve.</span>
            </h2>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* ━━━ BYOK — Bring Your Own Key ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Power Users</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-6">
            Bring Your Own <span className="text-orange-500">MiMo Key.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg leading-relaxed mb-8">
            Already have a Xiaomi MiMo subscription? Paste your API key and your
            agent runs on your credits — zero platform cost. 82B tokens/month.
            All MiMo V2.5 models. Your key, your usage, your relationship with Xiaomi.
          </p>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              { num: '01', title: 'Get Key', body: 'Buy a MiMo Max Monthly Plan at mimo.xiaomi.com. 82B credits, all models.' },
              { num: '02', title: 'Paste', body: 'Settings → BYOK → paste your key. We validate it live against the MiMo API.' },
              { num: '03', title: 'Run Free', body: 'Your agent uses your subscription. Zero platform charges. Full speed.' },
            ].map((step) => (
              <div key={step.num} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4">{step.num}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Pricing</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">
            Start free. <span className="text-orange-500">Scale when ready.</span>
          </h2>
          <p className="text-zinc-500 text-sm mb-12 max-w-md">
            Bring your own MiMo key and use Agentbot for free — forever.
            Or let us handle everything from £29/mo.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-zinc-900">
            {[
              {
                id: 'free',
                name: 'Free',
                price: '0',
                badge: 'BYOK',
                features: ['1 agent, 24/7 runtime', 'All channels', 'All 50+ skills', 'Full dashboard', 'Your own MiMo key (~$20/mo)'],
              },
              {
                id: 'solo',
                name: 'Solo',
                price: '29',
                features: ['1 agent, 24/7 runtime', 'MiMo V2.5 Pro included', 'All channels', 'All 50+ skills', 'No per-token charges'],
              },
              {
                id: 'collective',
                name: 'Collective',
                price: '69',
                popular: true,
                features: ['3 agents, 24/7 runtime', 'MiMo V2.5 Pro — unlimited', 'Custom workflows', 'Thread drafting', 'Priority support'],
              },
              {
                id: 'label',
                name: 'Label',
                price: '149',
                features: ['10 agents, 24/7 runtime', 'Everything in Collective', 'Team management', 'API access', 'White-label'],
              },
              {
                id: 'network',
                name: 'Network',
                price: '499',
                features: ['Unlimited agents', 'Everything in Label', 'Dedicated infra', 'Custom models', '99.9% SLA'],
              },
            ].map((plan) => (
              <div key={plan.id} className="bg-black p-6 sm:p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.badge && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">{plan.badge}</span>
                  )}
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-6">
                  £{plan.price}<span className="text-xs font-normal text-zinc-600">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-zinc-500 text-xs flex items-center gap-2">
                      <span className="text-orange-500">→</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'free' ? '/signup?plan=free' : `/api/stripe/checkout?plan=${plan.id}`}
                  className={`mt-auto block w-full py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    plan.id === 'free'
                      ? 'border border-orange-500/30 text-orange-500 hover:bg-orange-500/10'
                      : plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  {plan.id === 'free' ? 'Start Free' : 'Deploy'}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-6">
            Free plan requires a MiMo API key · Get one at <a href="https://mimo.xiaomi.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400">mimo.xiaomi.com</a>
          </p>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Your AI agent.<br />
            <span className="text-orange-500">Live in 2 minutes.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Powered by Xiaomi MiMo. Built on OpenClaw. No code. No infra. Just deploy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors w-full sm:w-auto"
            >
              Deploy Your Agent →
            </Link>
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-800 px-10 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors w-full sm:w-auto"
            >
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Agentbot</span>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] text-zinc-700">Powered by MiMo</span>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] text-zinc-700">Built on OpenClaw</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/documentation" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Docs</Link>
            <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Blog</Link>
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">GitHub</a>
            <a href="https://mimo.xiaomi.com" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">MiMo</a>
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">OpenClaw</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
