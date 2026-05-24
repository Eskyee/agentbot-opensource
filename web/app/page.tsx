import Link from 'next/link'
import { getAuthSession } from '@/app/lib/getAuthSession'
import nextDynamic from 'next/dynamic'
import { BasefmLivePlayer } from '@/app/components/basefm/BasefmLivePlayer'
import { GitlawbNodeIdentityCard } from '@/app/components/GitlawbNodeIdentityCard'

const HeroSphere = nextDynamic(() => import('@/app/components/HeroSphereClient'))
const HeroImage = nextDynamic(() => import('@/app/components/HeroImage').then(m => ({ default: m.HeroImage })))
const DashboardPreview = nextDynamic(() => import('@/app/components/DashboardPreview').then(m => ({ default: m.DashboardPreview })))
const CapabilitiesTicker = nextDynamic(() => import('@/app/components/landing').then(m => ({ default: m.CapabilitiesTicker })))

export const dynamic = 'force-dynamic'

const AGENTBOT_DID = 'did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY'

type LeadAgentIdentity = {
  trustScore: string
  trustLevel: string
  repos: string
  pushes: string
  updatedAt: string
}

async function fetchLeadAgentIdentity(): Promise<LeadAgentIdentity> {
  const fallback = {
    trustScore: '1.00',
    trustLevel: 'maintainer',
    repos: '16',
    pushes: '91',
    updatedAt: 'live fallback',
  }

  try {
    const response = await fetch('https://gitlawb.com/z6MkpUq1', {
      cache: 'no-store',
      headers: { 'user-agent': 'AgentbotHome/1.0 (+https://agentbot.sh)' },
    })
    if (!response.ok) return fallback

    const html = await response.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
    const firstMatch = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() || null
    const trustScore = firstMatch(/trust score\s+([\d.]+)/i)
    const trustLevel = firstMatch(/level:\s+([a-z]+)/i) || firstMatch(/([a-z]+)\s+trust level/i)
    const repos = firstMatch(/repos\s+([\d,]+)/i)
    const pushes = firstMatch(/level:\s+[a-z]+\s+([\d,]+)\s+pushes/i) || firstMatch(/([\d,]+)\s+pushes/i)

    return {
      trustScore: trustScore || fallback.trustScore,
      trustLevel: trustLevel || fallback.trustLevel,
      repos: repos || fallback.repos,
      pushes: pushes || fallback.pushes,
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return fallback
  }
}

function LeadAgentIdentityCard({ identity }: { identity: LeadAgentIdentity }) {
  return (
    <aside className="border border-zinc-900 bg-black/85 p-5 backdrop-blur">
      <div className="text-[10px] uppercase tracking-[0.22em] text-orange-500">Autonomous</div>
      <h2 className="mt-2 text-2xl font-bold uppercase leading-none tracking-tighter text-white">
        Lead Agent<br />
        <span className="text-zinc-600">Identity.</span>
      </h2>
      <dl className="mt-5 grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[
          ['Agent name', 'System Agent'],
          ['Trust score', identity.trustScore],
          ['Level', identity.trustLevel],
          ['Activity', `${identity.repos} repos${identity.pushes ? ` / ${identity.pushes} pushes` : ''}`],
          ['Did document id', AGENTBOT_DID],
          ['Role', 'Maintainer'],
        ].map(([label, value]) => (
          <div key={label} className="bg-zinc-950 p-3">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</dt>
            <dd className="mt-2 break-all text-xs font-bold uppercase tracking-widest text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-zinc-700">
        <span>Auto-updated</span>
        <a href="https://gitlawb.com/z6MkpUq1" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
          profile ↗
        </a>
      </div>
    </aside>
  )
}

export default async function Home() {
  const session = await getAuthSession()
  const leadIdentity = await fetchLeadAgentIdentity()
  
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
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30 font-mono overflow-x-hidden">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-6 py-20 sm:py-32 md:py-44 overflow-hidden">
        <div className="hidden lg:block absolute top-0 right-0 w-[55%] h-full">
          <HeroSphere />
        </div>
        <div className="relative z-20 mb-10 lg:absolute lg:right-6 lg:top-20 lg:mb-0 lg:w-[380px]">
          <LeadAgentIdentityCard identity={leadIdentity} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
            <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
              Production Private Cloud
            </div>
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Open Source Starter
              <span className="text-green-400 ml-1">⭐ {githubStars}</span>
              <span className="text-zinc-500 ml-1">forks {githubForks}</span>
            </a>
          </div>

          <h1 className="text-[2.5rem] sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.9]">
            Deploy AI workers.<br />
            <span className="text-zinc-700">Build underground systems.</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-6 sm:mt-8">
            Agentbot is a focused control plane for playground apps, creator agents, OpenGateway keys,
            and GitLawb-backed autonomous projects.
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
                href="/onboard?plan=collective"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Deploy Private Cloud
              </Link>
            )}
            <Link
              href="https://github.com/Eskyee/agentbot-opensource"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              View Open Source
            </Link>
          </div>
        </div>
      </section>

      <GitlawbNodeIdentityCard />

      {/* PRIMARY: What it does — the one idea */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl space-y-8 sm:space-y-10">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">What Your Agents Do</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
                Monitor.<br />
                <span className="text-zinc-700">Draft. Detect. Monetize.</span>
              </h2>
            </div>
            <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Watch the signal.</h3>
                <p className="text-zinc-500 text-sm">Monitor mentions, keywords, and high-signal posts without running a custom ops stack.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Draft with approvals.</h3>
                <p className="text-zinc-500 text-sm">Generate reply and thread drafts fast, but keep a clear human approval step for public actions.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Turn attention into action.</h3>
                <p className="text-zinc-500 text-sm">Route the right conversations into bookings, payments, or paid API actions with x402.</p>
              </div>
            </div>
            <Link
              href="/documentation"
              className="inline-flex items-center text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              Read docs →
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-8">
        <DashboardPreview />
      </div>

      {/* Audience */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mb-10 sm:mb-16">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Teams</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Built For Teams<br />
              <span className="text-zinc-700">That Already Live On X.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {[
              {
                label: 'Founders',
                body: 'Run signal capture, draft replies, and move faster without living in your notifications.',
              },
              {
                label: 'Crypto Teams',
                body: 'Monitor the timeline, respond faster, and connect attention to onchain payment flows.',
              },
              {
                label: 'Creators',
                body: 'Keep the conversation moving while protecting voice, approvals, and publishing quality.',
              },
              {
                label: 'Agencies',
                body: 'Operate multiple social workflows with a command center instead of fragmented tooling.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">{item.label}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Split */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mb-10 sm:mb-16">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Product</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Private Cloud<br />
              <span className="text-zinc-700">Or Open Source.</span>
            </h2>
            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed mt-6">
              Use Agentbot as a managed production control plane for X-native social agents,
              or fork the open-source starter and self-host the workflow yourself.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-px bg-zinc-900">
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-4">Production Private Cloud</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Managed runtime for teams that need speed and control.</h3>
              <div className="space-y-3 text-zinc-500 text-sm">
                <p>Approval queues, dashboards, billing, and operator tooling around your X workflow.</p>
                <p>Agentbot handles provisioning, observability, and the command center so your team stays focused on output.</p>
              </div>
            </div>
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4">Open Source Starter</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Forkable self-host path for builders.</h3>
              <div className="space-y-3 text-zinc-500 text-sm">
                <p>Connect one X account, monitor mentions, draft replies and threads, and extend the workflow with your own logic.</p>
                <p>Own the runtime, inspect the code, and use the starter as the public entrypoint into the wider Agentbot platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built Features */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mb-10 sm:mb-16">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Core Surface</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Deploy AI workers.<br />
              <span className="text-zinc-700">Build underground systems.</span>
            </h2>
            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed mt-6">
              Agentbot is tighter now: one playground, one creator toolkit, one gateway, one dashboard.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                href: '/playground',
                label: 'Playground',
                body: 'Generate, preview, publish, and push app projects to GitLawb.',
              },
              {
                href: '/creator-toolkit',
                label: 'Creator Toolkit',
                body: 'Underground producer agents, prompts, soundpack structure, and launch assets.',
              },
              {
                href: '/opengateway',
                label: 'OpenGateway',
                body: 'OpenAI-compatible inference keys for Agentbot and OpenClaude deployments.',
              },
              {
                href: '/pricing',
                label: 'Pricing',
                body: 'Pick the managed runtime tier that fits your team or creator system.',
              },
              {
                href: '/dashboard',
                label: 'Dashboard',
                body: 'Run deployments, creator packages, projects, and gateway activity in one place.',
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="bg-black p-6 sm:p-8 hover:bg-zinc-950 transition-colors">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-4">{item.label}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
          <div className="text-center space-y-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Private cloud + open source</div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">Vercel</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Managed web control plane</div>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">Railway</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Private runtime ops</div>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">34</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest">AI Models</div>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">MIT</div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Open Source</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5">
                GitHub ↗
              </a>
              <a href="https://raveculture.mintlify.app" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5">
                Docs ↗
              </a>
              <a href="https://dev.to/agentbot" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5">
                Dev.to ↗
              </a>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700 border border-zinc-800 px-3 py-1.5">
                Base-native
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 opacity-50">
              <span className="text-[10px] uppercase tracking-widest text-zinc-700">Built with</span>
              <span className="text-xs text-zinc-600 font-bold">Base</span>
              <span className="text-xs text-zinc-600 font-bold">OpenClaw</span>
              <span className="text-xs text-zinc-600 font-bold">Next.js</span>
              <span className="text-xs text-zinc-600 font-bold">Vercel</span>
              <span className="text-xs text-zinc-600 font-bold">Railway</span>
              <span className="text-xs text-zinc-600 font-bold">Neon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mb-10 sm:mb-16">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Partners</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
              Growing Together<br />
              <span className="text-zinc-700">With Our Partners.</span>
            </h2>
            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed mt-6">
              The collectives and crews helping grow baseFM, unite the scene, and push autonomous culture forward.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {[
              {
                name: 'Salted Roots',
                href: 'https://saltedroots.co.uk',
                description: 'Rooted in the underground — helping grow baseFM through music, culture, and community.',
              },
              {
                name: 'One Love Collective',
                description: 'Unity through sound — bridging scenes and growing the baseFM network together.',
              },
              {
                name: 'Bristol Collective',
                description: 'The heart of the sound — uniting Bristol with the baseFM movement through events and pure sonic energy.',
              },
              {
                name: 'Oxford Collective',
                description: 'Deep research meets deep bass — joining forces to expand baseFM across the Oxford node.',
              },
            ].map((partner) => {
              const content = (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-4">{partner.name}</div>
                  <p className="text-zinc-500 text-sm leading-relaxed">{partner.description}</p>
                </>
              )
              return partner.href ? (
                <a key={partner.name} href={partner.href} target="_blank" rel="noopener noreferrer" className="bg-black p-6 sm:p-8 group hover:bg-zinc-950 transition-colors">
                  {content}
                </a>
              ) : (
                <div key={partner.name} className="bg-black p-6 sm:p-8 group hover:bg-zinc-950 transition-colors">
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      </section>

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
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">Popular</span>
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

      {/* Free Trial CTA */}
      <section className="border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center space-y-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Managed product + open source starter</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase">
            Launch On X.<br />
            <span className="text-zinc-700">Then Scale The Team.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Start with one narrow workflow, validate the signal, then scale into a full private-cloud social agent team with Agentbot + OpenClaw.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup" className="inline-flex items-center justify-center bg-white text-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors w-full sm:w-auto">
              Start Private Cloud →
            </Link>
            <Link href="https://github.com/Eskyee/agentbot-opensource" className="inline-flex items-center justify-center border border-zinc-800 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors w-full sm:w-auto">
              Fork Starter
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECONDARY: Features for existing users ═══ */}

      {/* Capabilities */}
      <CapabilitiesTicker />

      {/* Co-DJ B2B — baseFM feature */}
      <section className="border-t border-red-900/40 bg-gradient-to-b from-red-950/20 to-black">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/40 text-orange-500 text-[10px] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
              baseFM × Agentbot
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-3 py-1">Factory Network</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-[0.95] mb-6">
                Co-DJ B2B.<br />
                <span className="text-orange-500">Two DJs.</span><br />
                <span className="text-zinc-700">One Live Stream.</span>
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-lg">
                The first streaming platform to let two DJs run a live B2B show from different locations and time zones — fully autonomous, pirate radio style. One Mux stream, a 120-second handoff window, and a live chat for DJs and listeners.
              </p>
              <p className="text-zinc-600 text-sm leading-relaxed mb-8 max-w-lg">
                No extra software. No complex setup. DJ1 stops their encoder, DJ2 connects within 2 minutes — Mux sees it as a reconnect and the stream continues without a cut. WebRTC audio monitoring lets DJ2 hear the last track before pressing play. Pioneer style.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://basefm.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-orange-500 text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors"
                >
                  Launch baseFM
                </a>
                <Link
                  href="/onboard?plan=collective"
                  className="inline-flex items-center justify-center border border-orange-500/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-orange-500 hover:border-orange-400 hover:text-orange-400 transition-colors"
                >
                  Get Access →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  num: '01',
                  title: 'Invite Your Co-DJ',
                  body: 'Generate a unique B2B invite link from your stream dashboard. Share it anywhere — no accounts needed on their end.',
                },
                {
                  num: '02',
                  title: 'Coordinated Handoff',
                  body: 'When you finish your set, stop your encoder. Your co-DJ connects within 2 minutes. Mux reconnects seamlessly — the stream never drops.',
                },
                {
                  num: '03',
                  title: 'WebRTC Audio Monitoring',
                  body: 'Your co-DJ hears your last track live via WebRTC so they know exactly when to drop their first record.',
                },
                {
                  num: '04',
                  title: 'Live Chat — DJs + Crowd',
                  body: 'Real-time chat for both DJs to coordinate and for listeners to interact. DJ messages highlighted — the crowd sees the handoff coming.',
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-4 border border-zinc-800 hover:border-red-900/60 transition-colors p-4 sm:p-5 bg-black">
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest pt-0.5 shrink-0 w-6">{step.num}</div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">{step.title}</div>
                    <p className="text-zinc-500 text-xs leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
              <div className="border border-zinc-800 p-4 sm:p-5 bg-zinc-950">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Factory Network</div>
                <p className="text-zinc-500 text-xs leading-relaxed">For operators, developers, and founders building the future of autonomous work. Factory AI × Agentbot — built for scale, designed for facts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pb-8">
        <HeroImage />
      </div>

      {/* baseFM */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            <div className="flex-1 space-y-5 sm:space-y-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">See It In Action</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">baseFM</h2>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                AI-ready autonomous radio on Base. Agent DJs and human selectors can go live, and the main stream plays directly here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/basefm/live" className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Play Live</a>
                <a href="https://bankr.bot/agents/basefm" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Support $BASEFM</a>
              </div>
            </div>
            <div className="w-full md:max-w-2xl">
              <BasefmLivePlayer
                compact
                title="🎧 baseFM Live"
                subtitle="Strictly Factory. 24/7 Autonomous Curation. AI-powered autonomous radio on Base."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Token strip */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">$AGENTBOT</div>
              <div className="text-[10px] text-zinc-700 font-mono">Pump.fun · Solana</div>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://solscan.io/token/9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Scanner</a>
              <span className="text-zinc-800">·</span>
              <a href="https://dexscreener.com/solana/l3lctrhv2geqzkrgccqqczqmuutgt6hklnpqv4fmhcp" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">View Market</a>
            </div>
          </div>
        </div>
      </section>

      {/* Community tweet */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">From the community</div>
          <div className="max-w-lg">
            <a
              href="https://x.com/Esky33junglist/status/2043491562479329427"
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-zinc-800 hover:border-zinc-700 bg-zinc-950 p-5 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                  E
                </div>
                <div>
                  <p className="text-xs font-bold text-white">esky33</p>
                  <p className="text-[10px] text-zinc-500">@Esky33junglist</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                x.com/i/article/2043489178743451648
              </p>
              <p className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                April 13, 2026
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Explore links */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Start</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { href: '/playground', label: 'Playground' },
              { href: '/creator-toolkit', label: 'Creator Toolkit' },
              { href: '/opengateway', label: 'OpenGateway' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/dashboard', label: 'Dashboard' },
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
