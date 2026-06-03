import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { Wallet } from 'lucide-react'

export default function WalletLoading() {
  return (
    <DashboardShell>
      <DashboardHeader title="Wallet" icon={<Wallet className="h-5 w-5 text-zinc-700 animate-pulse" />} />
      <DashboardContent>
        <div className="max-w-5xl space-y-6">
          {/* Tabs skeleton */}
          <div className="flex gap-0 border-b border-zinc-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Balance card skeleton */}
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
            <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
              <div className="h-3 w-24 bg-zinc-900 animate-pulse" />
              <div className="h-9 w-40 bg-zinc-900 animate-pulse" />
              <div className="h-3 w-48 bg-zinc-900 animate-pulse" />
              <div className="mt-6 grid gap-px bg-zinc-800 sm:grid-cols-2">
                <div className="bg-zinc-950 p-4 space-y-2">
                  <div className="h-3 w-24 bg-zinc-900 animate-pulse" />
                  <div className="h-4 w-32 bg-zinc-900 animate-pulse" />
                </div>
                <div className="bg-zinc-950 p-4 space-y-2">
                  <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
                  <div className="h-4 w-28 bg-zinc-900 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-40 bg-zinc-900 animate-pulse" />
                <div className="h-3 w-full bg-zinc-900 animate-pulse" />
                <div className="h-10 w-full bg-zinc-900 animate-pulse" />
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <div className="h-3 w-12 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-48 bg-zinc-900 animate-pulse" />
                <div className="h-3 w-full bg-zinc-900 animate-pulse" />
                <div className="h-10 w-full bg-zinc-900 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Activity skeleton */}
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-zinc-900 animate-pulse" />
                <div className="h-5 w-44 bg-zinc-900 animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-zinc-900 animate-pulse" />
            </div>
            <div className="divide-y divide-zinc-800 border border-zinc-800">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-950 p-4">
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-zinc-900 animate-pulse" />
                    <div className="h-3 w-52 bg-zinc-900 animate-pulse" />
                  </div>
                  <div className="h-3 w-28 bg-zinc-900 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
