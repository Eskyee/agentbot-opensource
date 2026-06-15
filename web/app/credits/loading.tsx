export default function CreditsLoading() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header skeleton */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="h-5 w-16 border border-zinc-800 bg-zinc-950 animate-pulse mb-6" />
        <div className="h-12 w-48 bg-zinc-900 animate-pulse mb-4" />
        <div className="h-4 w-96 max-w-full bg-zinc-900 animate-pulse" />
      </section>

      {/* Balance skeleton */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="h-3 w-28 bg-zinc-900 animate-pulse mb-3" />
          <div className="h-10 w-32 bg-zinc-900 animate-pulse" />
        </div>
      </section>

      {/* Top Up skeleton */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 h-12 bg-zinc-900 animate-pulse" />
            <div className="flex-1 h-12 bg-zinc-900 animate-pulse" />
          </div>
          <div className="h-3 w-64 bg-zinc-900 animate-pulse" />
          <div className="mt-6 flex items-center gap-3">
            <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-10 bg-zinc-900 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Crypto skeleton */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="h-32 border border-zinc-800 bg-zinc-950 animate-pulse" />
        </div>
      </section>

      {/* Activity skeleton */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="h-3 w-28 bg-zinc-900 animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-zinc-900 animate-pulse" />
                <div className="h-3 w-40 bg-zinc-900 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
                <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="py-8 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-700 animate-pulse">
        Loading credits...
      </p>
    </main>
  )
}
