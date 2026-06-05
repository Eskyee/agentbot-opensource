import { useState, useCallback } from 'react';
import { useConnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { useCustomSession } from '@/app/lib/useCustomSession';
import { useRouter } from 'next/navigation';

interface SignInWithBaseProps {
  callbackUrl?: string;
  onError?: (error: string) => void;
}

export default function SignInWithBase({ callbackUrl = '/dashboard', onError }: SignInWithBaseProps) {
  const router = useRouter();
  const { connectAsync, connectors, isPending } = useConnect();
  const { status } = useCustomSession();
  const [error, setError] = useState<string | null>(null);

  const preferredConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK') ?? connectors[0];

  const handleSignIn = useCallback(async () => {
    if (!preferredConnector) {
      setError('No Base wallet connector available. Make sure Coinbase Wallet is installed.');
      return;
    }
    setError(null);
    try {
      const result = await connectAsync({ connector: preferredConnector, chainId: base.id });
      if (result?.accounts?.[0]) {
        // Wallet connected — reload to pick up session
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      onError?.(msg);
    }
  }, [preferredConnector, connectAsync, callbackUrl, onError]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm text-center p-3 bg-red-900/20 rounded-lg border border-red-800">
          {error}
          <button onClick={() => setError(null)} className="block mx-auto mt-2 text-xs text-orange-500 hover:text-orange-400">
            Try again
          </button>
        </div>
      )}
      <button
        onClick={handleSignIn}
        disabled={isPending || !preferredConnector}
        className="w-full bg-white hover:bg-zinc-100 text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.135-.954l11.57-4.458c.538-.196 1.006.128.832.941z" fill="#0052FF"/>
        </svg>
        {isPending ? 'Connecting...' : 'Connect Base Wallet'}
      </button>
      <p className="text-[10px] text-zinc-600 text-center">
        Requires Coinbase Wallet extension or mobile app
      </p>
    </div>
  );
}
