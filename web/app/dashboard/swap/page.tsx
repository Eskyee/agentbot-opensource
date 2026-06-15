'use client';
import dynamic from 'next/dynamic';

const TokenSwap = dynamic(() => import('@/app/components/TokenSwap'), { ssr: false });

export default function SwapPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest mb-4">
            Token Swap
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Swap Tokens</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Exchange tokens on Base with best-rate routing via CDP Trade API
          </p>
        </div>
        <TokenSwap />
      </div>
    </main>
  );
}
