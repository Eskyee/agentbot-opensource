import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import dynamic from 'next/dynamic'

const DashboardPreview = dynamic(() => import('@/app/components/DashboardPreview').then(m => ({ default: m.DashboardPreview })))

export default async function Home() {
  const session = await getAuthSession()

  return (
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30 font-mono overflow-x-hidden">

      {/* ━━━ HERO — one sentence, one action ━━━ */}
      <section className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36 md:py-48">
        <div className="space-y-8">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
            X Agent Hosting
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your AI agent<br />
            monitors X.<br />
            <span className="text-zinc-600">You approve.</span><br />
            <span className="text-zinc-800">It posts.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Connect your X account. Your agent watches mentions, drafts replies,
            and queues threads — you approve before anything goes live.
            No code. No setup. Just signal.
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
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Get Started — £29/mo
              </Link>
            )}
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              See Demo
            </Link>
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
                title: 'Connect X',
                body: 'One OAuth flow. Your agent starts monitoring mentions, keywords, and high-signal posts immediately.',
              },
              {
                num: '02',
                title: 'Review Drafts',
                body: 'Your agent drafts replies and threads. You approve, edit, or reject — nothing goes live without you.',
              },
              {
                num: '03',
                title: 'Scale Up',
                body: 'Add more agents, connect Telegram, build custom workflows. OpenClaw powers it all under the hood.',
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

      {/* ━━━ DASHBOARD PREVIEW — show, don't tell ━━━ */}
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

      {/* ━━━ WHO IT'S FOR — four audiences ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Built For</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                label: 'Founders',
                body: 'Stop living in notifications. Your agent monitors the timeline and surfaces what matters.',
              },
              {
                label: 'Creators',
                body: 'Keep the conversation moving while protecting your voice. Every post gets your approval.',
              },
              {
                label: 'Crypto Teams',
                body: 'Monitor mentions, respond faster, and route attention into onchain actions.',
              },
              {
                label: 'Agencies',
                body: 'Run multiple X accounts from one dashboard. Approval queues for every client.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.label}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING — simple, two tiers ━━━ */}
      <section id="pricing" className="border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Pricing</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-12">
            Simple. <span className="text-zinc-700">No Markup.</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                id: 'solo',
                name: 'Solo',
                price: '29',
                features: ['1 X account', 'Mention monitoring', 'Reply drafting', 'Approval queue', 'Daily digests'],
              },
              {
                id: 'collective',
                name: 'Team',
                price: '69',
                popular: true,
                features: ['3 X accounts', 'Everything in Solo', 'Thread drafting', 'Custom workflows', 'Priority support'],
              },
            ].map((plan) => (
              <div key={plan.id} className="bg-black p-8 sm:p-10 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-4xl font-bold tracking-tighter mb-8">
                  £{plan.price}<span className="text-sm font-normal text-zinc-600">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="text-zinc-400 text-sm flex items-center gap-2">
                      <span className="text-orange-500 text-xs">→</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/api/stripe/checkout?plan=${plan.id}`}
                  className={`mt-auto block w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest transition-colors ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA — close the loop ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Stop scrolling.<br />
            <span className="text-zinc-700">Start shipping.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Your first agent is live in under 5 minutes. No code, no infra, no drama.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors w-full sm:w-auto"
            >
              Get Started — £29/mo →
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

      {/* ━━━ FOOTER — minimal ━━━ */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Agentbot</span>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] text-zinc-700">Built on OpenClaw</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/documentation" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Docs</Link>
            <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Blog</Link>
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">GitHub</a>
            <Link href="/basefm/live" className="text-[10px] uppercase tracking-widest text-zinc-700 hover:text-white transition-colors">baseFM</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
