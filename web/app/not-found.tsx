import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
          Error 404
        </div>

        <h1 className="text-[6rem] sm:text-[9rem] font-bold tracking-tighter leading-none text-zinc-800 select-none">
          404
        </h1>

        <p className="text-zinc-400 text-sm mt-4 mb-8">
          This page doesn&apos;t exist — or it was moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
