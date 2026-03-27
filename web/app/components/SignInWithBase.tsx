'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignInWithBaseProps {
  callbackUrl?: string;
  onError?: (error: string) => void;
}

export default function SignInWithBase({ callbackUrl = '/dashboard', onError }: SignInWithBaseProps) {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const hasSignedRef = useRef(false);

  // Load SDK on mount
  useEffect(() => {
    (async () => {
      try {
        const { createBaseAccountSDK } = await import('@base-org/account');
        const sdk = createBaseAccountSDK({ appName: 'Agentbot' });
        setProvider(sdk.getProvider());
      } catch (e) {
        console.error('Failed to load Base Account SDK:', e);
      }
    })();
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!provider || hasSignedRef.current) return;
    hasSignedRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      // 2. Switch to Base chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base Mainnet
      });

      // 3. Connect + SIWE in one step (official Base SDK)
      const { accounts } = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: '0x2105',
            },
          },
        }],
      });

      const { address } = accounts[0];
      const { message, signature } = accounts[0].capabilities.signInWithEthereum;

      // 4. Verify on server
      const verifyRes = await fetch('/api/wallet-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });

      const result = await verifyRes.json();
      if (result?.ok) {
        window.location.href = callbackUrl;
      } else {
        setError(result?.error || 'Sign-in failed');
        hasSignedRef.current = false;
      }
    } catch (err: any) {
      // Fallback for wallets that don't support wallet_connect
      if (err?.message?.includes('method_not_supported') || err?.code === -32601) {
        try {
          const { useAccount, useConnect, useSignMessage } = await import('wagmi');
          // Wallet doesn't support wallet_connect — user needs to use email/Google instead
          setError('Your wallet doesn\'t support Sign in with Base. Please use email or Google.');
        } catch {
          setError('Sign-in not supported. Please use email or Google.');
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Sign-in failed';
        setError(msg);
        onError?.(msg);
      }
      hasSignedRef.current = false;
    } finally {
      setIsSigningIn(false);
    }
  }, [provider, callbackUrl, onError]);

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
      <button
        onClick={handleSignIn}
        disabled={isSigningIn || !provider}
        className="w-full bg-white hover:bg-zinc-100 text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <div className="w-4 h-4 bg-blue-600 rounded-sm" />
        Sign in with Base
      </button>
    </div>
  );
}
