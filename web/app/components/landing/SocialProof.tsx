export function SocialProof() {
  const quotes = [
    {
      text: "Agentbot is running my radio station 24/7 — broadcast, fan engagement, on-chain coordination. Zero human input.",
      author: "Eskyee",
      handle: "@Esky33junglist",
      role: "Founder, baseFM",
    },
    {
      text: "The onchain payment layer is what makes this different. Agents that can actually transact — not just chat.",
      author: "Community",
      handle: "MoltX",
      role: "Agent Network",
    },
    {
      text: "Self-hosted, BYOK, no markup on LLM costs. Finally an agent platform that respects the builder.",
      author: "Builder",
      handle: "Base Ecosystem",
      role: "Developer",
    },
    {
      text: "From zero to deployed agent in under a minute. The onboarding flow is genuinely impressive.",
      author: "Early User",
      handle: "Beta Tester",
      role: "Solo Plan",
    },
  ]

  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Trusted By Builders</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            What People<br />
            <span className="text-zinc-700">Are Saying</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-900">
          {quotes.map((q, i) => (
            <div key={i} className="bg-black p-6 sm:p-8 flex flex-col justify-between">
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                &ldquo;{q.text}&rdquo;
              </p>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">{q.author}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">
                  {q.handle} · {q.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
