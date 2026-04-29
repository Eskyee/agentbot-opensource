'use client'

const partners = [
  { name: 'Salted Roots', description: 'Roots culture' },
  { name: 'Rave Culture', description: 'Music network' },
  { name: 'baseFM', description: 'Live radio' },
  { name: 'MoltX', description: 'Social layer' },
  { name: 'Bankr', description: 'Agent economy' },
  { name: 'OpenClaw', description: 'Agent runtime' },
]

export default function PartnerLogos() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
        <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-10 text-center">
          Partners And Community
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex flex-col items-center gap-2 group cursor-default"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                <span className="text-sm font-bold text-zinc-500 transition-colors group-hover:text-white">
                  {partner.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <span className="text-xs font-medium text-zinc-500 group-hover:text-white transition-colors">{partner.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-700">{partner.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
