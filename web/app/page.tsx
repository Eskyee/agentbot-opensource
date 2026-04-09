import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import dynamic from 'next/dynamic'

const HeroSphere = dynamic(() => import('@/app/components/HeroSphereClient'))
const HeroImage = dynamic(() => import('@/app/components/HeroImage').then(m => ({ default: m.HeroImage })))
const DashboardPreview = dynamic(() => import('@/app/components/DashboardPreview').then(m => ({ default: m.DashboardPreview })))
const CapabilitiesTicker = dynamic(() => import('@/app/components/landing').then(m => ({ default: m.CapabilitiesTicker })))

export default async function Home() {
  const session = await getAuthSession()
  
  let githubStars = 2
  let githubForks = 1
  try {
    const res = await fetch('https://api.github.com/repos/Eskyee/agentbot-opensource', { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      githubStars = data.stargazers_count || 2
      githubForks = data.forks_count || 1
    }
  } catch {}

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono overflow-x-hidden">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-6 py-20 sm:py-32 md:py-44 overflow-hidden">
        <div className="hidden lg:block absolute top-0 right-0 w-[55%] h-full">
          <HeroSphere />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
            <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest">
              Built for the Creative Industry
            </div>
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Open Source
              <span className="text-green-400 ml-1">⭐ {githubStars}</span>
              <span className="text-zinc-500 ml-1">🍴 {githubForks}</span>
            </a>
          </div>

          <h1 className="text-[2.5rem] sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">
            Focus on the Work.<br />
            <span className="text-zinc-700">Agents Handle the Rest.</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-6 sm:mt-8">
            Your autonomous crew handles contracts, outreach, and client comms —
            while you stay focused on your craft.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 sm:mt-10">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Mission Control
              </Link>
            ) : (
              <Link
                href="/onboard?plan=solo"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Deploy Your Crew
              </Link>
            )}
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-8">
        <HeroImage />
      </div>

      {/* Dashboard Preview */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-8">
        <DashboardPreview />
      </div>

      {/* Value Prop */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl space-y-8 sm:space-y-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Your 24/7<br />
              <span className="text-zinc-700">Autonomous Crew</span>
            </h2>
            <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Built around your workflow.</h3>
                <p className="text-zinc-500 text-sm">Name it, shape its voice, and it carries context across every client, project, and conversation.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Always on, zero wait.</h3>
                <p className="text-zinc-500 text-sm">Live in 10 seconds, running 24/7 — handling inbound while you sleep.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Right where your clients are.</h3>
                <p className="text-zinc-500 text-sm">Telegram, WhatsApp, Discord — meets people where they already message.</p>
              </div>
            </div>
            <Link
              href="/use-cases"
              className="inline-flex items-center text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              See use cases →
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <CapabilitiesTicker />

      {/* Pricing — compact */}
      <section id="pricing" className="border-t border-zinc-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-16">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Pricing</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
                Simple.<br />
                <span className="text-zinc-700">No Markup.</span>
              </h2>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              Full breakdown →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {[
              { id: 'solo', name: 'Solo', price: '29' },
              { id: 'collective', name: 'Collective', price: '69', popular: true },
              { id: 'label', name: 'Label', price: '149' },
              { id: 'network', name: 'Network', price: '499' },
            ].map((plan) => (
              <div key={plan.id} className="bg-black p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-blue-500 border border-blue-500/30 px-1.5 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tighter mb-6">
                  £{plan.price}<span className="text-[10px] sm:text-sm font-normal text-zinc-600">/mo</span>
                </div>
                <Link
                  href={`/api/stripe/checkout?plan=${plan.id}`}
                  className={`mt-auto block w-full py-3 text-center text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${
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

      {/* Token strip */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">$AGENTBOT</div>
              <div className="text-[10px] text-zinc-700 font-mono">/WETH · Base</div>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://basescan.org/token/0x986b41c76ab8b7350079613340ee692773b34ba3" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Scanner</a>
              <span className="text-zinc-800">·</span>
              <a href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Buy $AGENTBOT</a>
            </div>
          </div>
        </div>
      </section>

      {/* baseFM */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            <div className="flex-1 space-y-5 sm:space-y-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">See It In Action</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">baseFM</h2>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                A live radio station run entirely by an Agentbot agent — handling broadcast, fan engagement, and on-chain coordination with zero human input.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://basefm.space/live" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Listen Live</a>
                <a href="https://bankr.bot/agents/basefm" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Support $BASEFM</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore links */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Explore</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { href: '/use-cases', label: 'Use Cases' },
              { href: '/capabilities', label: 'Capabilities' },
              { href: '/demo', label: 'Demo' },
              { href: '/marketplace', label: 'Marketplace' },
              { href: '/open-learning', label: 'Open Learning' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-zinc-800 hover:border-zinc-600 px-4 py-3 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
