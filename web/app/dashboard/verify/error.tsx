'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Route-scoped error boundary for /dashboard/verify. Prevents a throw from the
// external SelfClaw embed or any transient identity-API error from bubbling up
// to the dashboard boundary and replacing the whole page with the generic
// "Something went wrong" screen. Users see a clearer inline message and can
// retry without losing navigation.
export default function VerifyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[verify] boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-orange-500/30 bg-orange-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl">⚠️</div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-300">
            Verification couldn&apos;t load
          </h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The onchain verification widget failed to initialise. This is usually a
          transient network issue or a script blocker — your verification state
          is unchanged.
        </p>
        {error.message && (
          <p className="text-[10px] font-mono text-red-300/80 break-all">
            {error.message}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={reset}
            className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-center text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-bold px-4 py-2 border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
