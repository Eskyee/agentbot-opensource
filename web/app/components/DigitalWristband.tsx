'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export default function DigitalWristband() {
  const { address, isConnected } = useAccount();
  const [hasWristband, setHasWristband] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

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

  const handleMint = async () => {
    if (!address || !walletClient) return;
    setMinting(true);
    setError(null);
    try {
      // Get mint calldata from API
      const res = await fetch('/api/wristband/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to prepare mint');

      // Send transaction via wallet client (user approves in wallet)
      const hash = await walletClient.sendTransaction({
        to: data.contract as `0x${string}`,
        data: data.calldata as `0x${string}`,
        account: address,
        chain: base,
      });

      setTxHash(hash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        setMinted(true);
        setHasWristband(true);
      } else {
        setError('Transaction failed onchain');
      }
    } catch (e: any) {
      console.error('Mint error:', e);
      setError(e.message || 'Mint failed');
    } finally {
      setMinting(false);
    }
  };

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
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-mono text-orange-500 uppercase tracking-wider">
            Checking...
          </span>
        </div>
      </div>
    );
  }

  if (hasWristband && !minted) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border-2 border-orange-500/50 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-mono text-orange-500 uppercase tracking-wider">
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
            href={`https://basescan.org/token/0x66519FCAee1Ed65bc9e0aCc25cCD900668D3eD49?a=${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-zinc-500 hover:text-orange-500 transition-colors"
          >
            View on BaseScan →
          </a>
        </div>
      </div>
    );
  }

  if (minted && txHash) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border-2 border-green-500/50 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-green-500 uppercase tracking-wider">
            WRISTBAND MINTED
          </span>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Your digital wristband is now onchain. Welcome to baseFM.
        </p>
        <a 
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-zinc-500 hover:text-green-500 transition-colors"
        >
          View Transaction →
        </a>
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

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      <button 
        onClick={handleMint}
        disabled={minting}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-mono text-sm transition-colors"
      >
        {minting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Minting...
          </span>
        ) : (
          'Mint Wristband — Free'
        )}
      </button>

      <p className="text-xs text-zinc-600 text-center mt-3">
        Gas sponsored by CDP Paymaster • ERC-721 • Base
      </p>
    </div>
  );
}
