'use client'

import Link from 'next/link'

export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 block">Wallet Error</span>
        <h1 className="text-2xl font-bold tracking-tighter uppercase mb-4">Wallet unavailable</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Couldn&apos;t load your wallet data. The Base RPC or wallet API might be temporarily down.
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
