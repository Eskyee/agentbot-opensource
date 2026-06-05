'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createPublicClient, http, formatEther, parseEther, formatUnits } from 'viem';
import { base } from 'viem/chains';

const TOKENS = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#627EEA' },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, color: '#2775CA' },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: '#627EEA' },
  { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1a0EfE8ee', decimals: 18, color: '#A06CFF' },
  { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, color: '#2EB6EA' },
];

const publicClient = createPublicClient({ chain: base, transport: http() });

export default function TokenSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [fromToken, setFromToken] = useState(TOKENS[0]); // ETH
  const [toToken, setToToken] = useState(TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTokenList, setShowTokenList] = useState<'from' | 'to' | null>(null);

  const getQuote = useCallback(async () => {
    if (!fromAmount || !address || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quote',
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount,
          walletAddress: address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuote(data);
      } else {
        setError(data.error || 'Quote failed');
        setQuote(null);
      }
    } catch (e: any) {
      setError(e.message);
      setQuote(null);
    }
    setLoading(false);
  }, [fromAmount, fromToken, toToken, address]);

  useEffect(() => {
    const timer = setTimeout(getQuote, 500); // Debounce
    return () => clearTimeout(timer);
  }, [getQuote]);

  const handleSwap = async () => {
    if (!quote || !address) return;
    setSwapping(true);
    setError(null);
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap',
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount,
          walletAddress: address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setFromAmount('');
        setQuote(null);
      } else {
        setError(data.error || 'Swap failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setSwapping(false);
  };

  const swapTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
    setFromAmount('');
    setQuote(null);
  };

  const selectToken = (token: typeof TOKENS[0]) => {
    if (showTokenList === 'from') {
      if (token.address === toToken.address) return;
      setFromToken(token);
    } else {
      if (token.address === fromToken.address) return;
      setToToken(token);
    }
    setShowTokenList(null);
    setFromAmount('');
    setQuote(null);
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white text-center">
        <p className="text-zinc-500 text-sm">Connect wallet to swap tokens</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Token selector modal */}
      {showTokenList && (
        <div className="absolute inset-0 z-20 bg-zinc-900 rounded-xl border border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-zinc-500 uppercase">Select Token</span>
            <button onClick={() => setShowTokenList(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
          </div>
          <div className="space-y-1">
            {TOKENS.map(t => (
              <button
                key={t.address}
                onClick={() => selectToken(t)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: t.color }}>
                  {t.symbol.slice(0, 2)}
                </div>
                <span className="text-sm text-white">{t.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* From token */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 mb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">You Pay</span>
          <button
            onClick={() => setShowTokenList('from')}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: fromToken.color }}>
              {fromToken.symbol.slice(0, 2)}
            </div>
            <span className="text-sm text-white font-mono">{fromToken.symbol}</span>
            <span className="text-zinc-500 text-xs">▾</span>
          </button>
        </div>
        <input
          type="number"
          value={fromAmount}
          onChange={e => setFromAmount(e.target.value)}
          placeholder="0.0"
          className="w-full bg-transparent text-2xl font-mono text-white outline-none placeholder-zinc-700"
        />
      </div>

      {/* Swap direction button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button
          onClick={swapTokens}
          className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>

      {/* To token */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 mt-1 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">You Receive</span>
          <button
            onClick={() => setShowTokenList('to')}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: toToken.color }}>
              {toToken.symbol.slice(0, 2)}
            </div>
            <span className="text-sm text-white font-mono">{toToken.symbol}</span>
            <span className="text-zinc-500 text-xs">▾</span>
          </button>
        </div>
        <div className="text-2xl font-mono text-zinc-600">
          {loading ? (
            <span className="text-orange-500 animate-pulse">...</span>
          ) : quote?.to?.amount ? (
            <span className="text-white">{parseFloat(quote.to.amount).toFixed(quote.to.decimals === 6 ? 2 : 6)}</span>
          ) : (
            '0.0'
          )}
        </div>
      </div>

      {/* Quote info */}
      {quote && quote.liquidityAvailable && (
        <div className="px-4 pb-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Rate</span>
            <span className="text-zinc-400 font-mono">
              1 {fromToken.symbol} ≈ {(parseFloat(quote.to.amount) / parseFloat(fromAmount)).toFixed(quote.to.decimals === 6 ? 2 : 4)} {toToken.symbol}
            </span>
          </div>
          {quote.priceImpact && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Price Impact</span>
              <span className={`font-mono ${parseFloat(quote.priceImpact) < 1 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(quote.priceImpact).toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Slippage</span>
            <span className="text-zinc-400 font-mono">1%</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mx-4 mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-xs font-mono mb-1">Swap executed!</p>
          <a
            href={`https://basescan.org/tx/${result.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 text-xs font-mono hover:underline"
          >
            View on BaseScan →
          </a>
        </div>
      )}

      {/* Swap button */}
      <button
        onClick={handleSwap}
        disabled={!quote || !quote.liquidityAvailable || swapping || loading}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-mono text-sm font-bold transition-colors"
      >
        {swapping ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Swapping...
          </span>
        ) : loading ? (
          'Fetching quote...'
        ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
          'Enter amount'
        ) : quote && !quote.liquidityAvailable ? (
          'Insufficient liquidity'
        ) : (
          `Swap ${fromToken.symbol} → ${toToken.symbol}`
        )}
      </button>
    </div>
  );
}
