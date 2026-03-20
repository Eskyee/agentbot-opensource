import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32 md:py-44">
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
            Platform Operator Protocol
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">
            Deploy AI<br />
            <span className="text-zinc-700">Agents</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-8">
            Your autonomous crew handles bookings, splits, and promo — while you
            stay in the studio. Agentbot is the creative crew. OpenClaw is the business mind.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Mission Control
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Deploy Fleet
              </Link>
            )}
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Try Demo
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </section>

      {/* baseFM */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1 space-y-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Now Streaming</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">baseFM</h2>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                The underground is live. Tune in now.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://basefm.space/live"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Listen Live
                </a>
                <a
                  href="https://bankr.bot/agents/basefm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Support $BASEFM
                </a>
              </div>
            </div>
            <div className="text-zinc-600 text-[10px] font-mono">
              $BASEFM · 0x9a4376bab717ac0a3901eeed8308a420c59c0ba3 · Base
            </div>
          </div>
        </div>
      </section>

      {/* MiniMax */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl space-y-10">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Powered by MiniMax M2.7</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Your 24/7<br />
              <span className="text-zinc-700">Personal Assistant</span>
            </h2>

            <div className="space-y-8 pt-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Make it yours.</h3>
                <p className="text-zinc-500 text-sm">Name it, shape its personality, and it remembers every conversation and preference.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Always on, zero wait.</h3>
                <p className="text-zinc-500 text-sm">Live in 10 seconds, running 24/7 in the cloud.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Right where you need it.</h3>
                <p className="text-zinc-500 text-sm">Accessible in your daily apps, with expanding support for more.</p>
              </div>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Get Agentbot
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { num: '01', label: 'Intelligence', title: 'Tiered Sovereignty', desc: 'OpenRouter-powered inference with DeepSeek R1 and Llama 3.3. BYOK with zero markup.' },
              { num: '02', label: 'Economy', title: 'Autonomous Splits', desc: 'Self-executing royalty splits and booking contracts via CDP wallets on Base.' },
              { num: '03', label: 'Network', title: 'A2A Protocol', desc: 'Cryptographic agent-to-agent coordination for bookings, promotion, and trade.' },
              { num: '04', label: 'Mission', title: 'Industrial Control', desc: 'High-fidelity visualization of agent swarms and execution traces in real-time.' },
            ].map((f) => (
              <div key={f.num}>
                <div className="text-blue-500 text-[10px] uppercase tracking-widest mb-4">{f.num} // {f.label}</div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 text-center mb-6">Powered By</div>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {['Vercel', 'Render', 'Base', 'Coinbase', 'OpenRouter', 'Mux'].map((name) => (
              <span key={name} className="text-zinc-600 text-xs uppercase tracking-widest hover:text-white transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-16">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              One Creative Crew,<br />
              <span className="text-zinc-700">One Business Mind</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-4 max-w-md">
              Agentbot handles your fans. OpenClaw handles your inbox. Both run on Base, paid in USDC.
            </p>
          </div>

          {/* What's included */}
          <div className="grid sm:grid-cols-3 gap-8 mb-16 pb-16 border-b border-zinc-900">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Agentbot</div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Creative Crew</h4>
              <ul className="space-y-1.5 text-xs text-zinc-500">
                <li>Fan engagement (Telegram/WhatsApp)</li>
                <li>BlockDB queries for A&R</li>
                <li>Base FM submissions</li>
                <li>Visual artwork generation</li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">OpenClaw</div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Business Operations</h4>
              <ul className="space-y-1.5 text-xs text-zinc-500">
                <li>Email inbox management</li>
                <li>Contract/Rider analysis (PDF)</li>
                <li>Web scraping (gig listings)</li>
                <li>x402 USDC invoicing</li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">You Provide</div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Your Own Keys</h4>
              <ul className="space-y-1.5 text-xs text-zinc-500">
                <li>Your own AI API key</li>
                <li>OpenAI, Anthropic, Ollama</li>
                <li>No markup — wholesale rates</li>
                <li>Switch models anytime</li>
              </ul>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {[
              { id: 'solo', name: 'Solo', price: '29', features: ['1 Creative Agent thread', 'Fan engagement (Telegram)', 'BlockDB queries for A&R'] },
              { id: 'collective', name: 'Collective', price: '69', popular: true, features: ['3 Creative Agent threads', '1 OpenClaw Business seat', 'Email Triage (50/day)', 'x402 USDC Invoicing'] },
              { id: 'label', name: 'Label', price: '149', features: ['10 Creative Agent threads', '3 OpenClaw Business seats', 'Multi-inbox (A&R@, Booking@)', 'White-label emails'] },
              { id: 'network', name: 'Network', price: '499', features: ['Unlimited Creative Agents', 'Unlimited OpenClaw seats', 'White-label (resell)', '99.9% SLA guarantee'] },
            ].map((plan) => (
              <div key={plan.id} className="bg-black p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[9px] uppercase tracking-widest text-blue-500 border border-blue-500/30 px-2 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-6">
                  £{plan.price}<span className="text-sm font-normal text-zinc-600">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-500 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-zinc-600">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/api/stripe/checkout?plan=${plan.id}`}
                  className={`block w-full py-3 text-center text-xs font-bold uppercase tracking-widest transition-colors ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  Select
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Protocol</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-4">
                Protocol<br />
                <span className="text-zinc-700">Liquidity</span>
              </h2>
              <p className="text-zinc-500 text-sm max-w-md">
                The $AGENTBOT treasury fuels the autonomous economy.
              </p>
            </div>

            <div className="flex-1 w-full max-w-md border border-zinc-900 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg tracking-tighter uppercase">Agentbot</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest">/WETH on Base</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tracking-tighter">$0.0000002</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Market Cap: $20K</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a href="https://basescan.org/token/0x986b41c76ab8b7350079613340ee692773b34ba3" target="_blank" className="border border-zinc-800 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                  View Scanner
                </a>
                <a href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc" target="_blank" className="bg-white text-black py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                  Buy $AGENTBOT
                </a>
              </div>

              <div className="pt-4 border-t border-zinc-900 text-[10px] text-zinc-700 truncate">
                0x986b41C76aB8B7350079613340ee692773B34bA3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is handled by layout */}
    </main>
  )
}
