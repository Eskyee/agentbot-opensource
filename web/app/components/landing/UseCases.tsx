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
              <div className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600 group-hover:text-blue-500 transition-colors">Learn more →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
