'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, useConnect } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { useCustomSession } from '@/app/lib/useCustomSession';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export default function DigitalWristband() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connectors, connect } = useConnect();
  const { data: session, status: authStatus } = useCustomSession();

  const [hasWristband, setHasWristband] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = authStatus === 'authenticated' && session?.user;

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
    if (address) checkWristband();
  }, [address, checkWristband]);

  const handleMint = async () => {
    if (!address || !walletClient) return;
    setMinting(true);
    setError(null);
    try {
      const res = await fetch('/api/wristband/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to prepare mint');

      const hash = await walletClient.sendTransaction({
        to: data.contract as `0x${string}`,
        data: data.calldata as `0x${string}`,
        account: address,
        chain: base,
      });
      setTxHash(hash);

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

  const handleConnectWallet = () => {
    const cbWallet = connectors.find(c => c.id === 'coinbaseWallet');
    if (cbWallet) {
      connect({ connector: cbWallet });
    }
  };

  // State 1: Not connected, not logged in
  if (!isConnected && !isLoggedIn) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-zinc-600" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Connect Wallet
          </span>
        </div>
        <p className="text-zinc-400 text-sm mb-5">
          Sign in or connect your wallet to get your digital wristband.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-white text-black rounded-lg font-mono text-sm font-bold hover:bg-zinc-200 transition-colors"
          >
            Sign In with Email
          </button>
          <button
            onClick={handleConnectWallet}
            className="w-full py-3 bg-[#0052FF] hover:bg-[#0043CC] text-white rounded-lg font-mono text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <circle cx="12" cy="12" r="12" fill="#0052FF"/>
              <circle cx="8.5" cy="10" r="2" fill="white"/>
              <circle cx="15.5" cy="10" r="2" fill="white"/>
              <circle cx="12" cy="15.5" r="2" fill="white"/>
            </svg>
            Connect Base Wallet
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-3">
          New to crypto? Sign in with email — we&apos;ll set up a wallet for you.
        </p>
      </div>
    );
  }

  // State 2: Logged in via email but no wallet connected
  if (isLoggedIn && !isConnected) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-green-500 uppercase tracking-wider">
            Signed In as {session?.user?.name || session?.user?.email?.split('@')[0]}
          </span>
        </div>
        <p className="text-zinc-400 text-sm mb-5">
          Connect your Base wallet to mint your digital wristband onchain.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleConnectWallet}
            className="w-full py-3 bg-[#0052FF] hover:bg-[#0043CC] text-white rounded-lg font-mono text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <circle cx="12" cy="12" r="12" fill="#0052FF"/>
              <circle cx="8.5" cy="10" r="2" fill="white"/>
              <circle cx="15.5" cy="10" r="2" fill="white"/>
              <circle cx="12" cy="15.5" r="2" fill="white"/>
            </svg>
            Connect Base Wallet
          </button>
          <a
            href="https://keys.coinbase.com/freecrypto"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-sm text-center transition-colors"
          >
            Get a Base Wallet →
          </a>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-3">
          Don&apos;t have a wallet? Get one free from Coinbase.
        </p>
      </div>
    );
  }

  // State 3: Wallet connected, checking status
  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-mono text-orange-500 uppercase tracking-wider">
            Checking wristband...
          </span>
        </div>
      </div>
    );
  }

  // State 4: Has wristband
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

  // State 5: Just minted
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

  // State 6: Wallet connected, no wristband — ready to mint
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
