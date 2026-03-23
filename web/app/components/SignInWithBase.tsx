'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useRouter } from 'next/navigation';
import { SiweMessage } from 'siwe';
import { base } from 'viem/chains';
import { checksumAddress } from 'viem';

interface SignInWithBaseProps {
  callbackUrl?: string;
}

/**
 * Sign In with Base — uses wagmi's coinbaseWallet connector
 * Matches baseFM's proven pattern: wagmi + OnchainKit + smartWalletOnly
 */
export function SignInWithBase({ callbackUrl = '/dashboard' }: SignInWithBaseProps) {
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

      // 2. Create SIWE message (address must be EIP-55 checksummed)
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress(address as `0x${string}`),
        statement: 'Sign in with Base to Agentbot',
        uri: window.location.origin,
        version: '1',
        chainId: base.id,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 min
      });
      const message = siweMessage.prepareMessage();

      // 3. Sign with wallet (wagmi handles the connector)
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
      hasSignedRef.current = false;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, signMessageAsync, router, callbackUrl]);

  // Auto-trigger SIWE when wallet connects
  useEffect(() => {
    if (isConnected && address && !hasSignedRef.current) {
      handleSignIn();
    }
  }, [isConnected, address, handleSignIn]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      hasSignedRef.current = false;
    }
  }, [isConnected]);

  const isLoading = isConnecting || isSigningIn;

  if (isConnected && address) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        {isSigningIn && (
          <p className="text-xs text-zinc-500">Sign the message in your wallet...</p>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        <button
          onClick={() => { disconnect(); hasSignedRef.current = false; }}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0052FF] hover:bg-[#0045d9] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        )}
        {isLoading ? 'Connecting...' : 'Sign in with Base'}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
export default SignInWithBase;
