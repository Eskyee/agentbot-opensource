'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-red-500 text-[10px] uppercase tracking-widest mb-8">
          Something went wrong
        </div>

        <h1 className="text-[6rem] sm:text-[9rem] font-bold tracking-tighter leading-none text-zinc-800 select-none">
          500
        </h1>

        <p className="text-zinc-400 text-sm mt-4 mb-8">
          An unexpected error occurred. Try again or head back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-zinc-700 text-zinc-400 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
