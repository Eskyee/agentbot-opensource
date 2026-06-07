import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { HeroActivity } from '@/app/components/HeroActivity'

export default async function Home() {
  const session = await getAuthSession()

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden page-enter">

      {/* ━━━ HERO — show, don't tell ━━━ */}
      <section className="relative min-h-screen flex items-center">
        <div className="hero-glow" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent<br />
            works while<br />
            <span className="text-orange-500">you sleep.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed mt-6">
            Not a chatbot. An agent that wakes up, handles your tasks,
            and reports back — 24/7, on its own server.
          </p>

          <div className="mt-8">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
              >
                Open Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
              >
                Deploy Your Agent
              </Link>
            )}
          </div>

          <HeroActivity />
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

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Agentbot</span>
          <div className="flex items-center gap-4">
            <Link href="/documentation" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Docs</Link>
            <Link href="/blog" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Blog</Link>
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
