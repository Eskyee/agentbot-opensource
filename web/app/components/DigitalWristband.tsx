'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export default function DigitalWristband() {
  const { address, isConnected } = useAccount();
  const [hasWristband, setHasWristband] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkWristband = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wristband/verify?address=${address}`);
      const data = await res.json();
      setHasWristband(data.hasWristband);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (address) {
      checkWristband();
    }
  }, [address, checkWristband]);

  if (!isConnected) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Connect Wallet
          </span>
        </div>
        <p className="text-zinc-400 text-sm">
          Connect your wallet to check wristband status or mint.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
            Checking...
          </span>
        </div>
      </div>
    );
  }

  if (hasWristband) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border-2 border-blue-500/50 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
              WRISTBAND ACTIVE
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            #{address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Access Level</span>
            <span className="text-green-400 font-mono">PREMIUM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Network</span>
            <span className="text-white font-mono">BASE</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <a 
            href="https://opensea.io/collection/wristband"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-zinc-500 hover:text-blue-400 transition-colors"
          >
            View on OpenSea →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-zinc-600" />
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          No Wristband
        </span>
      </div>
      
      <p className="text-zinc-400 text-sm mb-4">
        Get your digital wristband to unlock access to baseFM streams and community.
      </p>

      <button 
        onClick={() => window.open('https://opensea.io/collection/wristband', '_blank')}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-sm transition-colors"
      >
        Mint Wristband — 0.001 ETH
      </button>

      <p className="text-xs text-zinc-600 text-center mt-3">
        Powered by Base • ERC-721
      </p>
    </div>
  );
}
