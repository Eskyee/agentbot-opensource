'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { base } from 'viem/chains';

interface SignInWithBaseProps {
  callbackUrl?: string;
  onError?: (error: string) => void;
}

export default function SignInWithBase({ callbackUrl = '/dashboard', onError }: SignInWithBaseProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSignedRef = useRef(false);

  const handleSignIn = useCallback(async () => {
    if (!address || hasSignedRef.current) return;
    hasSignedRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      // 2. Create a simple SIWE-style message (no SiweMessage class — avoids parser issues)
      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + 1000 * 60 * 5).toISOString();
      const message = `agentbot.raveculture.xyz wants you to sign in with your Ethereum account:
${address}

Sign in with Base to Agentbot

URI: https://agentbot.raveculture.xyz
Version: 1
Chain ID: ${base.id}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

      // 3. Sign with wallet
      const signature = await signMessageAsync({ message });

      // 4. Verify on server
      const verifyRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address }),
      });

      const result = await verifyRes.json();

      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError(result?.error || 'Sign-in failed');
        hasSignedRef.current = false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setError(msg);
      onError?.(msg);
      hasSignedRef.current = false;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, signMessageAsync, router, callbackUrl, onError]);

  // Auto-trigger SIWE when wallet connects
  useEffect(() => {
    if (isConnected && address && !hasSignedRef.current && !isSigningIn) {
      handleSignIn();
    }
  }, [isConnected, address, isSigningIn, handleSignIn]);

  const connector = connectors[0]; // coinbaseWallet

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        {isSigningIn && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2" />
            <p className="text-zinc-400 text-sm">Check your wallet to sign in...</p>
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm text-center p-3 bg-red-900/20 rounded-lg border border-red-800">
            {error}
            <button onClick={() => { hasSignedRef.current = false; handleSignIn(); }} className="block mx-auto mt-2 text-xs text-blue-400 hover:text-blue-300">
              Try again
            </button>
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
          <span className="text-sm font-mono text-zinc-300">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <button onClick={() => { disconnect(); hasSignedRef.current = false; setError(null); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => connect({ connector })}
        disabled={isConnecting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Sign in with Base'}
      </button>
    </div>
  );
}
