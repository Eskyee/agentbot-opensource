'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wallet, TrendingUp, ArrowUpDown, Send, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface Balance {
  symbol: string;
  balance: string;
  value?: string;
  chain: string;
}

interface Job {
  jobId?: string;
  threadId?: string;
  status?: string;
  response?: string;
}

export default function TradingPage() {
  const [prompt, setPrompt] = useState('');
  const [threadId, setThreadId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances } = useQuery<Balance[]>({
    queryKey: ['bankr-balances'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/balances');
      const data = await res.json();
      if (data.balances) {
        return data.balances;
      }
      return [];
    },
    refetchInterval: 30000,
  });

  const { mutate: sendPrompt, isPending: isSending } = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await fetch('/api/bankr/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, ...(threadId && { threadId }) }),
      });
      return res.json();
    },
    onSuccess: (data: Job) => {
      if (data.jobId) {
        setJobId(data.jobId);
        if (data.threadId) {
          setThreadId(data.threadId);
        }
        pollJob(data.jobId);
      }
      if (data.response) {
        setResult(data.response);
      }
    },
  });

  const pollJob = async (id: string) => {
    const poll = async () => {
      const res = await fetch(`/api/bankr/prompt?jobId=${id}`);
      const data: Job = await res.json();
      
      if (data.status === 'completed') {
        setResult(data.response || 'Task completed');
        return;
      }
      if (data.status === 'failed') {
        setResult(`Error: ${data.response || 'Task failed'}`);
        return;
      }
      if (data.status === 'cancelled') {
        setResult('Task cancelled');
        return;
      }
      
      setTimeout(poll, 2000);
    };
    poll();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setResult('');
    sendPrompt(prompt);
  };

  const quickActions = [
    { label: 'Check ETH Balance', prompt: 'What is my ETH balance on Base?' },
    { label: 'Show Portfolio', prompt: 'Show my complete portfolio' },
    { label: 'Price Check', prompt: 'What is the current price of ETH?' },
  ];

  const totalValue = balances?.reduce((sum, b) => sum + Number(b.value || 0), 0) || 0;

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-400" />
          Trading Agent
        </h1>
        <p className="text-zinc-400">AI-powered crypto trading with Bankr</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Portfolio Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-400" />
                Portfolio
              </h2>
              <button
                onClick={() => refetchBalances()}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
                disabled={balancesLoading}
              >
                <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid gap-4">
              {balancesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : balances && balances.length > 0 ? (
                balances.map((balance, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold">{balance.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{balance.symbol}</div>
                        <div className="text-xs text-zinc-500 uppercase">{balance.chain}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{Number(balance.balance).toFixed(6)}</div>
                      {balance.value && (
                        <div className="text-sm text-green-400">${Number(balance.value).toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-left py-8 text-zinc-500">
                  No balances found. Make sure BANKR_API_KEY is configured.
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Portfolio Value</span>
                <span className="text-2xl font-bold text-green-400">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setPrompt(action.prompt);
                    sendPrompt(action.prompt);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition"
                  disabled={isSending}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Interface */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-pink-400" />
              Command
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask the trading agent...&#10;Examples:&#10;- Buy $50 of ETH on Base&#10;- Swap 0.1 ETH for USDC&#10;- What tokens are trending?&#10;- Send 10 USDC to 0x..."
                className="w-full h-40 bg-black border border-zinc-700 rounded-xl p-4 text-sm focus:border-blue-500 focus:outline-none resize-none"
                disabled={isSending}
              />
              
              <button
                type="submit"
                disabled={isSending || !prompt.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-4 w-4" />
                    Send Command
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Response</h2>
              <div className="p-4 bg-black/40 rounded-xl text-sm whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}

          {jobId && !result && (
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-zinc-400">Processing job: {jobId}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
