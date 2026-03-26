import React from 'react';
import DigitalWristband from '@/app/components/DigitalWristband';

/**
 * baseFM / RaveCulture — Wristband Page
 * The dedicated landing page for onchain membership.
 */
export default function WristbandPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest animate-pulse">
              Onchain Access Protocol
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
              The Digital <br/>
              <span className="text-zinc-700">Wristband</span>
            </h1>
            
            <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
              Unlock the future of underground radio. Your Digital Wristband is a permanent onchain 
              proof of affiliation with baseFM. It grants lifetime access to high-definition 
              live streams, token-gated community channels, and exclusive artist drops.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-zinc-900">
              <div className="space-y-2">
                <span className="text-zinc-600 text-[10px] uppercase block">Network</span>
                <span className="text-white text-sm font-bold uppercase">Base Mainnet</span>
              </div>
              <div className="space-y-2">
                <span className="text-zinc-600 text-[10px] uppercase block">Availability</span>
                <span className="text-white text-sm font-bold uppercase">Open for Minting</span>
              </div>
            </div>
          </div>

          {/* Implementation Module */}
          <div className="flex-1 w-full max-w-md">
            <DigitalWristband />
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 baseFM x RaveCulture
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <a href="#" className="hover:text-blue-500 transition-colors">Smart Contract</a>
            <a href="#" className="hover:text-blue-500 transition-colors">OnchainKit Spec</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Docs</a>
          </div>
        </div>
      </div>
    </main>
  );
}
