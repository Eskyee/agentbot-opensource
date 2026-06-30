import Link from 'next/link';
import { getAuthSession } from '@/app/lib/getAuthSession';
import dynamic from 'next/dynamic';
import { TokenCard } from '@/app/components/TokenCard';
import { VipPass } from '@/app/components/VipPass';
import PartnerLogos from '@/app/components/PartnerLogos';
import { SocialProof } from '@/app/components/landing/SocialProof';
import { Pillars } from '@/app/components/landing/Pillars';
const DashboardPreview = dynamic(() =>
  import('@/app/components/DashboardPreview').then((m) => ({ default: m.DashboardPreview }))
);

// Live GitHub star count (revalidated hourly). Returns null on failure so the
// badge can gracefully fall back instead of showing a stale hardcoded number.
async function getGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch('https://api.github.com/repos/Eskyee/agentbot-opensource', {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await getAuthSession();
  const stars = await getGitHubStars();

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden page-enter pt-14">
      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="hero-glow" />
        <div className="relative w-full max-w-4xl mx-auto px-6 py-20 sm:py-32 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest">
              Always on
            </div>
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {stars !== null ? `${stars} ${stars === 1 ? 'Star' : 'Stars'}` : 'GitHub'}
            </a>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your agent runs
            <br />
            the label while you
            <br />
            <span className="text-orange-500">make the music.</span>
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mt-5">
            Deploy an autonomous agent for artists, labels and collectives. It runs your radio,
            works your fans, and handles bookings, releases and royalties — 24/7, on its own server.
          </p>

          <div className="flex justify-center gap-2 mt-6">
            {session ? (
              <Link
                href="/dashboard"
                className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
                >
                  Deploy Your Agent
                </Link>
                <Link
                  href="/login"
                  className="border border-zinc-800 text-zinc-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors btn-press"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="flex justify-center flex-wrap gap-4 sm:gap-6 pt-5 text-[10px] uppercase tracking-widest text-zinc-500">
            <div>
              <span className="text-orange-500">24/7</span> always on
            </div>
            <div>
              <span className="text-orange-500">live</span> radio
            </div>
            <div>
              <span className="text-orange-500">on-chain</span> royalties
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* ━━━ PRODUCT HUNT LAUNCH — toggle on launch day via NEXT_PUBLIC_PRODUCT_HUNT_LIVE=true ━━━ */}
      {process.env.NEXT_PUBLIC_PRODUCT_HUNT_LIVE === 'true' && (
        <section className="border-t border-zinc-900 bg-gradient-to-b from-orange-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 text-center">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest mb-4">
              Live on Product Hunt — Vercel Day
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Help us launch Agentbot</h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
              We&apos;re live on Product Hunt today. If you like what we&apos;re building, an upvote
              means the world.
            </p>
            <a
              href="https://www.producthunt.com/posts/agentbot?utm_source=embed&utm_medium=post_embed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#ff6154] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#ff5244] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.6 11.2h4.2V6h-4.2v5.2zM12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.6 12.8c0 3.1-2.5 5.6-5.6 5.6s-5.6-2.5-5.6-5.6 2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6z" />
              </svg>
              Upvote on Product Hunt
            </a>
          </div>
        </section>
      )}

      {/* ━━━ THREE PILLARS — Factory-style differentiators ━━━ */}
      <Pillars
        eyebrow="Why Agentbot"
        pillars={[
          {
            index: '01',
            title: 'Your own server',
            body: 'Every agent runs in its own isolated container. Your data, your memory, your rules. No shared tenants, no compromised context.',
          },
          {
            index: '02',
            title: 'Model independent',
            body: 'Powered by MiMo v2.5, routed through OpenRouter. Swap models freely — enterprise reasoning for pennies, not dollars.',
          },
          {
            index: '03',
            title: 'Always on, every channel',
            body: 'One runtime across Telegram, Discord, WhatsApp and web. Your agent shows up where your people already are — 24/7.',
          },
        ]}
      />

      {/* ━━━ HOW IT WORKS — architecture diagram ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-10 text-center">
            How it works
          </div>
          <svg
            viewBox="0 0 720 200"
            role="img"
            aria-label="Architecture: you message your agent, the OpenClaw runtime in an isolated container thinks with MiMo and acts on Telegram, Discord and WhatsApp"
            className="w-full h-auto"
          >
            {/* You */}
            <rect x="10" y="70" width="130" height="60" fill="none" stroke="#27272a" />
            <text
              x="75"
              y="96"
              textAnchor="middle"
              fill="#f97316"
              fontSize="11"
              fontFamily="monospace"
              letterSpacing="2"
            >
              YOU
            </text>
            <text
              x="75"
              y="114"
              textAnchor="middle"
              fill="#71717a"
              fontSize="9"
              fontFamily="monospace"
            >
              one message
            </text>
            {/* arrow */}
            <line x1="140" y1="100" x2="200" y2="100" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="200,96 208,100 200,104" fill="#f97316" />
            {/* Agent container */}
            <rect
              x="210"
              y="20"
              width="300"
              height="160"
              fill="none"
              stroke="#f97316"
              strokeOpacity="0.5"
            />
            <text
              x="360"
              y="40"
              textAnchor="middle"
              fill="#71717a"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="2"
            >
              YOUR ISOLATED SERVER
            </text>
            <rect x="235" y="55" width="115" height="50" fill="#09090b" stroke="#27272a" />
            <text
              x="292"
              y="76"
              textAnchor="middle"
              fill="#fafafa"
              fontSize="10"
              fontFamily="monospace"
            >
              OpenClaw
            </text>
            <text
              x="292"
              y="92"
              textAnchor="middle"
              fill="#71717a"
              fontSize="8"
              fontFamily="monospace"
            >
              runtime 24/7
            </text>
            <rect x="370" y="55" width="115" height="50" fill="#09090b" stroke="#27272a" />
            <text
              x="427"
              y="76"
              textAnchor="middle"
              fill="#fafafa"
              fontSize="10"
              fontFamily="monospace"
            >
              MiMo v2.5
            </text>
            <text
              x="427"
              y="92"
              textAnchor="middle"
              fill="#71717a"
              fontSize="8"
              fontFamily="monospace"
            >
              reasoning
            </text>
            <line x1="350" y1="80" x2="370" y2="80" stroke="#3f3f46" />
            <rect x="235" y="120" width="250" height="40" fill="#09090b" stroke="#27272a" />
            <text
              x="360"
              y="144"
              textAnchor="middle"
              fill="#71717a"
              fontSize="9"
              fontFamily="monospace"
            >
              memory · skills · wallet · heartbeat
            </text>
            {/* arrow out */}
            <line x1="510" y1="100" x2="570" y2="100" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="570,96 578,100 570,104" fill="#f97316" />
            {/* Channels */}
            <rect x="580" y="40" width="130" height="34" fill="none" stroke="#27272a" />
            <text
              x="645"
              y="61"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="monospace"
            >
              Telegram
            </text>
            <rect x="580" y="83" width="130" height="34" fill="none" stroke="#27272a" />
            <text
              x="645"
              y="104"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="monospace"
            >
              Discord
            </text>
            <rect x="580" y="126" width="130" height="34" fill="none" stroke="#27272a" />
            <text
              x="645"
              y="147"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="monospace"
            >
              WhatsApp
            </text>
          </svg>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-900 text-left">
            {[
              {
                step: '01',
                title: 'Deploy',
                body: 'Pick a plan, name your agent. It boots on its own isolated server in about 2 minutes.',
              },
              {
                step: '02',
                title: 'Connect',
                body: 'Link Telegram, Discord, or WhatsApp. Your agent shows up where you already are.',
              },
              {
                step: '03',
                title: 'Delegate',
                body: 'Give it work. It remembers, learns your style, and runs while you sleep.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-black p-6">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-2">
                  {item.step} — {item.title}
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ MEET EVE ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-block px-3 py-1 border border-green-500/30 text-green-500 text-[10px] uppercase tracking-widest mb-6">
            Live Agent
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">
            Meet <span className="text-green-500">Eve</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed mb-10">
            Agentbot’s durable agent, built on Vercel’s open-source eve framework. Each agent is a
            directory of files — instructions in markdown, tools in TypeScript. Talk to her live.
          </p>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900 text-left">
            {[
              {
                label: 'Filesystem-first',
                body: 'Eve is just a directory — markdown instructions, TypeScript tools, skills. No glue code.',
              },
              {
                label: 'Durable by default',
                body: 'Runs as a durable workflow, so long-running tasks survive restarts and deploys.',
              },
              {
                label: 'Real tools',
                body: 'Eve calls typed tools to look up live Agentbot plans and channels — never guesses.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-green-500 mb-3">
                  {item.label}
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/eve"
            className="inline-flex items-center gap-2 mt-8 border border-green-500/40 text-green-500 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/10 transition-colors btn-press"
          >
            Chat with Eve →
          </Link>
        </div>
      </section>

      {/* ━━━ MEET OPEN AGENTS ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-block px-3 py-1 border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest mb-6">
            Live Platform
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">
            Meet <span className="text-blue-400">Open Agents</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed mb-10">
            Agentbot’s open-source AI agent platform. Deploy autonomous agents, chat with them live,
            and build with the community.
          </p>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900 text-left">
            {[
              {
                label: 'Open Source',
                body: 'Full source code available. Study, modify, and self-host your own agent platform.',
              },
              {
                label: 'Multi-Agent',
                body: 'Deploy multiple specialized agents — each with its own personality, tools, and knowledge.',
              },
              {
                label: 'Always On',
                body: 'Agents run 24/7 on Vercel. Durable workflows survive restarts and deploys.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-3">
                  {item.label}
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/open-agents"
            className="inline-flex items-center gap-2 mt-8 border border-blue-500/40 text-blue-400 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/10 transition-colors btn-press"
          >
            Chat with Open Agents →
          </Link>
        </div>
      </section>

      {/* ━━━ THREE TRUTHS ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900 text-left">
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
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                  {item.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ BUILT IN LONDON — VIP pass ━━━ */}
      <VipPass />

      {/* ━━━ FOUNDER QUOTE ━━━ */}
      <SocialProof />

      {/* ━━━ PARTNERS ━━━ */}
      <PartnerLogos />

      {/* ━━━ PRICING — inline, minimal ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-8">Pricing</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900 text-left">
            {[
              { name: 'Solo', price: '29', tagline: '1 agent, 1 OpenClaw deployment' },
              {
                name: 'Collective',
                price: '69',
                tagline: '5 agents, 5 OpenClaw deployments',
                popular: true,
              },
              { name: 'Label', price: '149', tagline: '20 agents, 20 OpenClaw deployments' },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-black p-6 sm:p-8 flex flex-col card-hover ${
                  plan.popular ? 'popular-glow' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">
                      Popular
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-2">
                  £{plan.price}
                  <span className="text-xs font-normal text-zinc-500">/mo</span>
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
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-6">
            Every plan includes all channels, all skills, your own server.{' '}
            <Link href="/pricing" className="text-orange-500 hover:text-orange-400">
              Full details →
            </Link>
          </p>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Your agent.
            <br />
            <span className="text-orange-500">Always working.</span>
          </h2>
          <div className="pt-4">
            <Link
              href={session ? '/dashboard' : '/signup'}
              className="block w-full sm:w-auto text-center bg-white text-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors btn-press"
            >
              {session ? 'Open Dashboard' : 'Deploy Your Agent'} →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ TOKEN CARD ━━━ */}
      <TokenCard />

      {/* ━━━ MIMO PARTNERSHIP ━━━ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
                Partnership
              </div>
              <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
                MiMo V2.5
              </div>
              <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/40 text-orange-400 text-[10px] uppercase tracking-widest">
                MiMo-V2.5 限免中
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
              MiMo × <span className="text-orange-500">Agentbot</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Powered by MiMo · Built on OpenClaw
            </span>
            <Link
              href="/partner/mimo"
              className="mt-2 border border-zinc-800 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
