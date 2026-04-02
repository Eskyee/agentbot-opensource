interface PageHeroProps {
  label: string
  title: string
  highlight?: string
  description: string
  gradient?: 'blue' | 'purple' | 'green' | 'amber'
}

const gradients = {
  blue: 'bg-blue-500/5',
  purple: 'bg-purple-500/5',
  green: 'bg-green-500/5',
  amber: 'bg-amber-500/5',
}

export function PageHero({ label, title, highlight, description, gradient = 'blue' }: PageHeroProps) {
  return (
    <section className="relative border-b border-zinc-900 overflow-hidden">
      {/* Background glow */}
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[300px] ${gradients[gradient]} rounded-full blur-[120px]`} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-6">
          {label}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.9] max-w-3xl">
          {title}
          {highlight && (
            <>
              <br />
              <span className="text-zinc-700">{highlight}</span>
            </>
          )}
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed mt-6">
          {description}
        </p>
      </div>
    </section>
  )
}
