import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'

export default async function Home() {
  const session = await getAuthSession()

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden page-enter">

      {/* ━━━ HERO — one sentence, one truth ━━━ */}
      <section className="relative max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36 md:py-48">
        <div className="hero-glow" />
        <div className="relative space-y-8">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
            Always on
          </div>

          <h1 className="text-4xl sm:text-5xl md:6xl lg:7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent<br />
            works while<br />
            <span className="text-orange-500">you sleep.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Deploy an autonomous AI agent. It connects to Telegram, Discord,
            and WhatsApp. It handles your tasks, monitors your channels, and
            reports back — 24/7, on its own server, without you lifting a finger.
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
                  href="/signup"
                  className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Deploy Your Agent
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-6 pt-4 text-[10px] uppercase tracking-widest text-zinc-600">
            <div><span className="text-orange-500">24/7</span> always on</div>
            <div><span className="text-orange-500">3</span> channels</div>
            <div><span className="text-orange-500">2 min</span> to deploy</div>
          </div>
        </div>
      </section>

      {/* ━━━ WHAT IT DOES — one section, one truth ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">What It Does</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                title: 'It wakes up before you',
                body: 'Checks messages. Reviews overnight activity. Flags what matters. Sends you a briefing before your morning coffee.',
              },
              {
                title: 'It handles the routine',
                body: 'Replies to messages. Posts updates. Manages tasks. You set the rules once — it follows them every day, without asking.',
              },
              {
                title: 'It remembers everything',
                body: 'Every conversation, every decision, every preference. Your agent learns your style and gets sharper over time. Your server, your data, your agent.',
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

      {/* ━━━ HOW IT WORKS — three steps ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">How It Works</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                num: '01',
                title: 'Deploy',
                body: 'Sign up. Pick a name. Your agent is live in under 2 minutes — no code, no config, no infrastructure.',
              },
              {
                num: '02',
                title: 'Connect',
                body: 'Link Telegram, Discord, or WhatsApp. Give your agent its first task. Watch it start working immediately.',
              },
              {
                num: '03',
                title: 'Walk away',
                body: 'Your agent runs 24/7 on its own server. It will message you when something needs attention. Everything else, it handles.',
              },
            ].map((step, i) => (
              <div key={step.num} className={`bg-black p-6 sm:p-8 card-hover stagger-${i + 1}`}>
                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4">{step.num}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ WHAT MAKES IT DIFFERENT ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Not Another Chatbot</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                label: 'Chatbots wait',
                contrast: 'Agents act',
                body: 'A chatbot sits there until you type. Your agent wakes up, checks your channels, makes decisions, and sends you results. It starts the conversation, not you.',
              },
              {
                label: 'Shared infra',
                contrast: 'Your server',
                body: 'Other platforms put your agent on shared servers with shared memory. You get your own container, your own database, your own process. Nobody else touches it.',
              },
              {
                label: 'Email + password',
                contrast: 'Wallet sign-in',
                body: 'Sign in with your Base wallet. One signature. No passwords to remember, no emails to verify, no accounts to create. Your wallet is your identity.',
              },
              {
                label: 'Black box',
                contrast: 'Open source',
                body: 'The runtime is OpenClaw. The code is on GitHub. Fork it, inspect it, self-host it. We earn your trust by showing you everything.',
              },
            ].map((item, i) => (
              <div key={item.label} className={`bg-black p-6 sm:p-8 card-hover stagger-${i + 1}`}>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{item.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.contrast}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING — simple ━━━ */}
      <section id="pricing" className="border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Pricing</div>
          <h2 className="text-2xl sm:3xl font-bold tracking-tighter uppercase mb-12">
            One agent. <span className="text-orange-500">One price.</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                name: 'Solo',
                price: '29',
                features: ['1 agent, always on', 'Telegram, Discord, WhatsApp', 'Every skill in the library', 'Your own isolated server'],
              },
              {
                name: 'Collective',
                price: '69',
                popular: true,
                features: ['3 agents, always on', 'Custom workflows and automations', 'Draft threads and auto-replies', 'Priority support — 24h response'],
              },
              {
                name: 'Label',
                price: '149',
                features: ['10 agents, always on', 'Team roles and permissions', 'Full API access', 'Your brand, our infrastructure'],
              },
            ].map((plan) => (
              <div key={plan.name} className={`bg-black p-6 sm:p-8 flex flex-col card-hover ${plan.popular ? 'popular-glow' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
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
                  href={`/api/stripe/checkout?plan=${plan.name.toLowerCase()}`}
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
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:4xl font-bold tracking-tighter uppercase">
            Your agent.<br />
            <span className="text-orange-500">Works while you sleep.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Deploy in 2 minutes. Connect your channels. Walk away.
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
          </div>
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
