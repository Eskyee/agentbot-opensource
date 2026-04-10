'use client';

import { useState, useCallback } from 'react';

interface SignInWithTempoProps {
  callbackUrl?: string;
  onError?: (error: string) => void;
}

export default function SignInWithTempo({ callbackUrl = '/dashboard', onError }: SignInWithTempoProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      // Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      if (!nonce) throw new Error('Failed to get nonce');

      // Open Tempo wallet for signing
      const message = `Sign in to Agentbot\n\nNonce: ${nonce}\nChain: Tempo (4217)\nTimestamp: ${Date.now()}`;

      // Use window.ethereum if Tempo wallet is injected, otherwise open wallet.tempo.xyz
      const w = window as any;

      if (w.ethereum) {
        // Request accounts
        const accounts = await w.ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Switch to Tempo chain
        try {
          await w.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1079' }], // 4217 in hex
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await w.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1079',
                chainName: 'Tempo',
                nativeCurrency: { name: 'pathUSD', symbol: 'pathUSD', decimals: 18 },
                rpcUrls: ['https://rpc.tempo.xyz'],
                blockExplorerUrls: ['https://explorer.tempo.xyz'],
              }],
            });
          }
        }

        // Sign the message
        const signature = await w.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]],
        });

        // Verify with server
        const verifyRes = await fetch('/api/wallet-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: accounts[0],
            signature,
            message,
            chain: 'tempo',
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          window.location.href = callbackUrl;
        } else {
          throw new Error(verifyData.error || 'Tempo wallet verification failed');
        }
      } else {
        // No wallet injected, open Tempo wallet
        window.open('https://wallet.tempo.xyz', '_blank');
        setError('Please install Tempo wallet or open wallet.tempo.xyz to sign in.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tempo wallet sign-in failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsSigningIn(false);
    }
  }, [callbackUrl, onError]);

  return (
    <div>
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="w-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
      >
        {isSigningIn ? 'Connecting...' : '⏱ Sign in with Tempo'}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
