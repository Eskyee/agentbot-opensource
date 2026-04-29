'use client'

const partners = [
  {
    name: 'Salted Roots',
    description: 'Rooted in the underground - helping grow baseFM through music, culture, and community.',
  },
  {
    name: 'One Love Collective',
    description: 'Unity through sound - bridging scenes and growing the baseFM network together.',
  },
  {
    name: 'Bristol Collective',
    description: 'The heart of the sound - uniting Bristol with the baseFM movement through events and pure sonic energy.',
  },
  {
    name: 'Oxford Collective',
    description: 'Deep research meets deep bass - joining forces to expand baseFM across the Oxford node.',
  },
]

export default function PartnerLogos() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-orange-400">
            Partners
          </p>
          <h2 className="text-2xl font-bold uppercase leading-[0.95] tracking-tighter text-white sm:text-4xl">
            Growing Together<br />
            <span className="text-zinc-700">With Our Partners.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-500">
            The collectives and crews helping grow baseFM, unite the scene, and push autonomous culture forward.
          </p>
        </div>
        <div className="grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="group bg-black p-5 transition-colors hover:bg-zinc-950 sm:p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition-colors group-hover:border-orange-500/40">
                <span className="text-sm font-bold text-zinc-500 transition-colors group-hover:text-white">
                  {partner.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">{partner.name}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{partner.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
