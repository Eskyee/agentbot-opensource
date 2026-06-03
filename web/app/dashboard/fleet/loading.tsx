import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'

function FleetSkeletonIcon() {
  return (
    <svg className="h-5 w-5 text-zinc-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

export default function FleetLoading() {
  return (
    <DashboardShell className="flex flex-col h-screen overflow-hidden">
      <DashboardHeader
        title="Fleet"
        icon={<FleetSkeletonIcon />}
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              <div className="px-3 py-1.5 h-7 w-24 bg-zinc-700 animate-pulse" />
              <div className="px-3 py-1.5 h-7 w-20 bg-zinc-700 animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right space-y-1">
                <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
                <div className="h-4 w-12 bg-zinc-900 animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-zinc-900 animate-pulse" />
            </div>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Canvas skeleton */}
        <div className="flex-1 min-w-0 relative bg-[#050505] flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4">
              <div className="w-12 h-12 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 animate-pulse">
              Loading fleet constellation...
            </p>
          </div>
        </div>

        {/* Right: Traces skeleton */}
        <div className="hidden lg:flex w-[400px] border-l border-zinc-800 flex-col bg-[#0a0a0a]">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-zinc-800 animate-pulse" />
              <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-zinc-900 animate-pulse" />
                  <div className="h-3 w-12 bg-zinc-900 animate-pulse" />
                </div>
                <div className="h-3 w-full bg-zinc-900 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
