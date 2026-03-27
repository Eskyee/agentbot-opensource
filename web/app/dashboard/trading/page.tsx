'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wallet, TrendingUp, ArrowUpDown, Send, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

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
    { label: 'Check ETH', prompt: 'What is my ETH balance on Base?' },
    { label: 'Portfolio', prompt: 'Show my complete portfolio' },
    { label: 'Price Check', prompt: 'What is the current price of ETH?' },
  ];

  const totalValue = balances?.reduce((sum, b) => sum + Number(b.value || 0), 0) || 0;

  return (
    <DashboardShell>
      <DashboardHeader title="Trading Agent" icon={<Sparkles className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>
        <div className="grid gap-px bg-zinc-800 lg:grid-cols-3">
          {/* Portfolio + Quick Actions — spans 2 cols */}
          <div className="lg:col-span-2 space-y-px bg-zinc-800">
            {/* Portfolio */}
            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <h2 className="text-sm font-bold tracking-tight uppercase">Portfolio</h2>
                </div>
                <button
                  onClick={() => refetchBalances()}
                  className="border border-zinc-700 hover:border-zinc-500 p-2 transition-colors"
                  disabled={balancesLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-px bg-zinc-800">
                {balancesLoading ? (
                  <div className="flex items-center justify-center py-8 bg-zinc-950">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : balances && balances.length > 0 ? (
                  balances.map((balance, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center">
                          <span className="text-[10px] font-bold">{balance.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold">{balance.symbol}</div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-600">{balance.chain}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">{Number(balance.balance).toFixed(6)}</div>
                        {balance.value && (
                          <div className="text-[10px] text-green-400">${Number(balance.value).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 p-8 text-center">
                    <p className="text-xs text-zinc-500">No balances found. Make sure BANKR_API_KEY is configured.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Total Value</span>
                <span className="text-2xl font-bold tracking-tight">${totalValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setPrompt(action.prompt);
                      sendPrompt(action.prompt);
                    }}
                    className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 transition-colors"
                    disabled={isSending}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Command Interface */}
          <div className="space-y-px bg-zinc-800">
            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Send className="h-4 w-4 text-pink-400" />
                <h2 className="text-sm font-bold tracking-tight uppercase">Command</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask the trading agent...&#10;- Buy $50 of ETH on Base&#10;- Swap 0.1 ETH for USDC&#10;- What tokens are trending?"
                  className="w-full h-40 bg-black border border-zinc-700 p-4 text-xs focus:border-zinc-500 focus:outline-none resize-none"
                  disabled={isSending}
                />

                <button
                  type="submit"
                  disabled={isSending || !prompt.trim()}
                  className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center justify-center gap-2"
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
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Response</h2>
                <div className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
            )}

            {jobId && !result && (
              <div className="bg-zinc-950 border border-zinc-800 p-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-xs text-zinc-500">Processing job: {jobId}</span>
              </div>
            )}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
