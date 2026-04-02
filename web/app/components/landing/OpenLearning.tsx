'use client'

import Link from 'next/link'

export function OpenLearning() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Open Learning</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            Learn. Build.<br />
            <span className="text-zinc-700">Ship Together.</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-4 max-w-md">
            Agentbot is open-source by design. We welcome young developers, researchers,
            and creators from Africa, the Caribbean, and everywhere to learn, contribute, and build with us.
          </p>
        </div>

        {/* Global Community Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 mb-10 sm:mb-16">
          <div className="bg-black p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-3">Africa</div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
              Young Builders Welcome
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              From Lagos to Nairobi, Accra to Cape Town — if you&apos;re curious about AI agents,
              onchain infra, or open-source, this project is for you. Read the code. Break it. Fix it.
              Ship something.
            </p>
          </div>

          <div className="bg-black p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-3">Caribbean</div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
              Nerds & Creatives
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Kingston, Port of Spain, Bridgetown — we build at the intersection of culture and code.
              If you&apos;re into music tech, fintech, or just want to learn how autonomous agents work,
              dive in.
            </p>
          </div>

          <div className="bg-black p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-widest text-blue-500 mb-3">Global</div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
              Research & Explore
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Students, researchers, curious minds — our codebase is your playground. Study how
              multi-agent orchestration works. Fork it. Write a paper. We don&apos;t care where you&apos;re
              from — we care what you build.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/Eskyee/agentbot-opensource"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-white text-black px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Browse Source Code
          </a>
          <a
            href="https://github.com/Eskyee/agentbot-opensource/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            How to Contribute
          </a>
          <Link
            href="/documentation"
            className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Read the Docs
          </Link>
        </div>
      </div>
    </section>
  )
}
