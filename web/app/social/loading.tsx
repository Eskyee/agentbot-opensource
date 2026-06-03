export default function SocialLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header skeleton */}
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <div className="h-3 w-48 bg-zinc-900 animate-pulse mb-3" />
          <div className="h-9 w-56 bg-zinc-900 animate-pulse" />
          <div className="mt-2 h-4 w-80 max-w-full bg-zinc-900 animate-pulse" />
          <div className="flex gap-3 mt-5">
            <div className="h-9 w-32 bg-zinc-900 animate-pulse" />
            <div className="h-9 w-20 bg-zinc-900 animate-pulse" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Feed skeleton */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-zinc-800 bg-zinc-900 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-800 animate-pulse" />
                </div>
                <div className="h-4 w-full bg-zinc-800 animate-pulse" />
                <div className="h-4 w-2/3 bg-zinc-800 animate-pulse" />
                <div className="flex gap-4 pt-2">
                  <div className="h-3 w-12 bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-16 bg-zinc-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <aside className="space-y-6">
            <div className="border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <div className="h-3 w-24 bg-zinc-800 animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-28 bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-12 bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="border border-zinc-800 bg-zinc-900 p-5 space-y-2">
              <div className="h-3 w-24 bg-zinc-800 animate-pulse" />
              <div className="h-3 w-full bg-zinc-800 animate-pulse" />
              <div className="h-3 w-3/4 bg-zinc-800 animate-pulse" />
            </div>
          </aside>
        </div>

        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-700 animate-pulse">
          Loading feed...
        </p>
      </div>
    </div>
  )
}
