'use client'

import Link from 'next/link'

export function UseCases() {
  const cases = [
    {
      icon: '🎵',
      title: 'Music & Audio',
      desc: 'Run a 24/7 radio station, handle fan engagement, manage releases, and coordinate with other artists autonomously.',
      slug: 'music-audio',
    },
    {
      icon: '🏢',
      title: 'Creative Agency',
      desc: 'Automate client outreach, contract generation, invoice tracking, and multi-channel comms for your entire team.',
      slug: 'creative-agency',
    },
    {
      icon: '🪙',
      title: 'Crypto Community',
      desc: 'Answer token questions, market updates, and community FAQs. Gate access with onchain token ownership.',
      slug: 'crypto-community',
    },
    {
      icon: '🛒',
      title: 'E-Commerce',
      desc: 'Handle customer inquiries, order tracking, product recommendations, and booking management around the clock.',
      slug: 'ecommerce',
    },
    {
      icon: '📡',
      title: 'Creator Studio',
      desc: 'Content distribution, audience engagement, sponsorship coordination, and brand voice management.',
      slug: 'creator-studio',
    },
    {
      icon: '🎯',
      title: 'Solo Founder',
      desc: 'Your personal ops team — email triage, calendar management, web research, and autonomous task execution.',
      slug: 'solo-founder',
    },
  ]

  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Use Cases</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            Built For<br />
            <span className="text-zinc-700">Every Industry</span>
          </h2>
        </div>

        {/* One agent, every industry — hub & spoke */}
        <div className="mb-10 border border-zinc-900 bg-zinc-950/40 p-4 sm:p-6 overflow-x-auto">
          <svg viewBox="0 0 880 320" className="w-full min-w-[560px]" role="img" aria-label="One Agentbot agent adapts to every industry: a central agent connects out to music and audio, creative agency, crypto community, e-commerce, creator studio, and solo-founder workflows." xmlns="http://www.w3.org/2000/svg">
            {/* spokes (drawn first, behind boxes) */}
            {[
              { x: 8, cy: 57, side: 'L' }, { x: 8, cy: 160, side: 'L' }, { x: 8, cy: 263, side: 'L' },
              { x: 722, cy: 57, side: 'R' }, { x: 722, cy: 160, side: 'R' }, { x: 722, cy: 263, side: 'R' },
            ].map((n, i) => (
              <line key={i} x1={n.side === 'L' ? 158 : 722} y1={n.cy} x2={n.side === 'L' ? 365 : 515} y2="156" stroke="#27272a" strokeWidth="1" />
            ))}
            {/* left verticals */}
            {[['🎵', 'Music & Audio', 30], ['🪙', 'Crypto Community', 133], ['📡', 'Creator Studio', 236]].map(([ic, t, y]) => (
              <g key={t as string}>
                <rect x="8" y={y as number} width="150" height="54" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <text x="22" y={(y as number) + 32} fontFamily="ui-monospace,monospace" fontSize="11" fill="#a1a1aa">{ic as string} {t as string}</text>
              </g>
            ))}
            {/* right verticals */}
            {[['🏢', 'Creative Agency', 30], ['🛒', 'E-Commerce', 133], ['🎯', 'Solo Founder', 236]].map(([ic, t, y]) => (
              <g key={t as string}>
                <rect x="722" y={y as number} width="150" height="54" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <text x="858" y={(y as number) + 32} textAnchor="end" fontFamily="ui-monospace,monospace" fontSize="11" fill="#a1a1aa">{t as string} {ic as string}</text>
              </g>
            ))}
            {/* center hub */}
            <rect x="365" y="120" width="150" height="72" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
            <text x="440" y="150" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="12" fill="#ffffff" letterSpacing="1.5" fontWeight="bold">YOUR AGENT</text>
            <text x="440" y="168" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" fill="#f97316">one runtime</text>
            <text x="440" y="182" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="8" fill="#52525b">adapts to any vertical</text>
          </svg>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
          {cases.map((c) => (
            <Link
              key={c.slug}
              href={`/use-cases/${c.slug}`}
              className="bg-black p-6 sm:p-8 group hover:bg-zinc-900/50 transition-colors"
            >
              <div className="text-2xl mb-4">{c.icon}</div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-white transition-colors">{c.title}</h3>
              <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">{c.desc}</p>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600 group-hover:text-orange-500 transition-colors">Learn more →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
