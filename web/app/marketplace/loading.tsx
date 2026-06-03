export default function MarketplaceLoading() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header skeleton */}
        <div className="mb-12 sm:mb-16 space-y-4">
          <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
          <div className="h-10 w-72 bg-zinc-900 animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-zinc-900 animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <section className="mb-10 sm:mb-12 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="h-3 w-24 bg-zinc-900 animate-pulse" />
              <div className="mt-2 h-8 w-16 bg-zinc-900 animate-pulse" />
              <div className="mt-1 h-3 w-20 bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </section>

        {/* Cards grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-12 bg-zinc-900 animate-pulse" />
              </div>
              <div className="h-3 w-full bg-zinc-900 animate-pulse" />
              <div className="h-3 w-3/4 bg-zinc-900 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-14 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-14 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-14 bg-zinc-900 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-700 animate-pulse">
          Loading marketplace...
        </p>
      </div>
    </main>
  )
}
