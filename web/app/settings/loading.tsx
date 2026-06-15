export default function SettingsLoading() {
  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-56 border-r border-zinc-900 flex-col bg-zinc-950/50 p-4 space-y-2">
        <div className="h-8 w-32 bg-zinc-900 animate-pulse mb-6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-full bg-zinc-900 animate-pulse" />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top bar skeleton */}
        <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3">
          <div className="h-5 w-24 bg-zinc-900 animate-pulse" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Title skeleton */}
            <div className="mb-6 sm:mb-8">
              <div className="h-3 w-16 bg-zinc-900 animate-pulse mb-2" />
              <div className="h-8 w-32 bg-zinc-900 animate-pulse" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-0 mb-6 sm:mb-8 border-b border-zinc-800 pb-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="h-3 w-14 bg-zinc-900 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Content skeleton */}
            <div className="space-y-6">
              <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
                <div className="h-10 w-full bg-zinc-900 animate-pulse" />
                <div className="h-3 w-20 bg-zinc-900 animate-pulse mt-4" />
                <div className="h-10 w-full bg-zinc-900 animate-pulse" />
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="h-3 w-32 bg-zinc-900 animate-pulse" />
                <div className="h-10 w-full bg-zinc-900 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-zinc-700 animate-pulse">
        Loading settings...
      </p>
    </div>
  )
}
