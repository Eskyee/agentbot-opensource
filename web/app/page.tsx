import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import dynamic from 'next/dynamic'
import { TokenCard } from '@/app/components/TokenCard'
const DashboardPreview = dynamic(() => import('@/app/components/DashboardPreview').then(m => ({ default: m.DashboardPreview })))

export default async function Home() {
  const session = await getAuthSession()

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden page-enter pt-14">

      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-screen flex items-center">
        <div className="hero-glow" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest mb-8">
            Always on
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent<br />
            works while<br />
            <span className="text-orange-500">you sleep.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed mt-6">
            Deploy an autonomous AI agent. It connects to Telegram, Discord,
            and WhatsApp. It handles your tasks, monitors your channels, and
            reports back — 24/7, on its own server, without you lifting a finger.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center bg-white text-black px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
                >
                  Deploy Your Agent
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center border border-zinc-800 px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors btn-press"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-6 pt-6 text-[10px] uppercase tracking-widest text-zinc-600">
            <div><span className="text-orange-500">24/7</span> always on</div>
            <div><span className="text-orange-500">3</span> channels</div>
            <div><span className="text-orange-500">2 min</span> to deploy</div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* ━━━ MiMo + OpenClaw ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Powered by MiMo + OpenClaw</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                label: 'MiMo v2.5',
                body: "Xiaomi's open-source reasoning model. Enterprise-grade intelligence at a fraction of the cost — your agent thinks for pennies, not dollars.",
              },
              {
                label: 'OpenClaw Runtime',
                body: 'The agent runtime that keeps your worker alive 24/7. Memory, skills, channels, heartbeat — all handled. Your agent never sleeps.',
              },
              {
                label: 'Your Server',
                body: 'Each agent runs on its own isolated server. Your data, your memory, your rules. No shared tenants. No compromised context.',
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

      {/* ━━━ THREE TRUTHS ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                title: 'It wakes up before you',
                body: 'Checks messages. Reviews overnight activity. Flags what matters. Sends you a briefing before your coffee.',
              },
              {
                title: 'It handles the routine',
                body: 'Replies to messages. Posts updates. Manages tasks. You set the rules once. It follows them every day.',
              },
              {
                title: 'It remembers everything',
                body: 'Every conversation, every decision, every preference. Your agent learns your style. Your server, your data.',
              },
            ].map((item, i) => (
              <div key={item.title} className={`bg-black p-6 sm:p-8 card-hover stagger-${i + 1}`}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING — inline, minimal ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Pricing</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              { name: 'Solo', price: '29', tagline: '1 agent, always on' },
              { name: 'Collective', price: '69', tagline: '3 agents, workflows', popular: true },
              { name: 'Label', price: '149', tagline: '10 agents, API access' },
            ].map((plan) => (
              <div key={plan.name} className={`bg-black p-6 sm:p-8 flex flex-col card-hover ${plan.popular ? 'popular-glow' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-2">
                  £{plan.price}<span className="text-xs font-normal text-zinc-600">/mo</span>
                </div>
                <p className="text-zinc-500 text-xs mb-6">{plan.tagline}</p>
                <Link
                  href={session ? '/dashboard' : '/signup'}
                  className={`mt-auto block w-full py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors btn-press ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  Deploy
                </Link>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-6">
            Every plan includes all channels, all skills, your own server. <Link href="/pricing" className="text-orange-500 hover:text-orange-400">Full details →</Link>
          </p>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Your agent.<br /><span className="text-orange-500">Always working.</span>
          </h2>
          <div className="pt-4">
            <Link
              href={session ? '/dashboard' : '/signup'}
              className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
            >
              {session ? 'Open Dashboard' : 'Deploy Your Agent'} →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ TOKEN CARD ━━━ */}
      <TokenCard />

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Agentbot</span>
          <div className="flex items-center gap-4">
            <Link href="/documentation" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Docs</Link>
            <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Blog</Link>
            <Link href="/basefm" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">baseFM</Link>
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

