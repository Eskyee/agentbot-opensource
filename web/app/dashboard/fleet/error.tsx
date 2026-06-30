'use client'

import Link from 'next/link'

export default function FleetError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 block">Fleet Error</span>
        <h1 className="text-2xl font-bold tracking-tighter uppercase mb-4">Fleet offline</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Couldn&apos;t load the fleet data. The mission control API might be temporarily unavailable.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="bg-zinc-800 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="mt-8 text-left text-xs text-red-400 bg-zinc-950 border border-zinc-800 p-4 overflow-auto max-h-48">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  )
}
