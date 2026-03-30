'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white font-mono">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold tracking-tighter uppercase mb-4">Something went wrong</h1>
            <p className="text-zinc-400 text-sm mb-6">
              An unexpected error occurred. This has been logged and we&apos;re looking into it.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="bg-zinc-800 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 text-left text-xs text-red-400 bg-zinc-950 border border-zinc-800 p-4 overflow-auto max-h-48">
                {error.message}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
