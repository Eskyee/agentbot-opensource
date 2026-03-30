'use client';

import { useState, useEffect, useMemo, useCallback, startTransition, memo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wallet, ArrowUpDown, Send, RefreshCw, Loader2, Sparkles, Key, Eye, EyeOff, Trash2, CheckCircle } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';

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

// ─── Memoized Balance Row ───
const BalanceRow = memo(function BalanceRow({ balance }: { balance: Balance }) {
  return (
    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4">
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
  );
});

// ─── Memoized Quick Action Button ───
const QuickActionButton = memo(function QuickActionButton({
  label,
  actionPrompt,
  isSending,
  onSend,
}: {
  label: string;
  actionPrompt: string;
  isSending: boolean;
  onSend: (prompt: string) => void;
}) {
  const handleClick = useCallback(() => onSend(actionPrompt), [onSend, actionPrompt]);
  return (
    <button
      onClick={handleClick}
      className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 transition-colors"
      disabled={isSending}
    >
      {label}
    </button>
  );
});

// ─── API Key Management (memoized) ───
const KeyManagement = memo(function KeyManagement({
  keyConfigured,
  showKeyInput,
  showKey,
  apiKeyInput,
  keySaving,
  keyError,
  onShowKeyInput,
  onToggleShowKey,
  onKeyInputChange,
  onSaveKey,
  onCancelKeyInput,
  onDeleteKey,
}: {
  keyConfigured: boolean | null;
  showKeyInput: boolean;
  showKey: boolean;
  apiKeyInput: string;
  keySaving: boolean;
  keyError: string | null;
  onShowKeyInput: () => void;
  onToggleShowKey: () => void;
  onKeyInputChange: (v: string) => void;
  onSaveKey: () => void;
  onCancelKeyInput: () => void;
  onDeleteKey: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') onSaveKey();
    },
    [onSaveKey]
  );

  return (
    <>
      {/* API Key Banner */}
      {keyConfigured === false && !showKeyInput && (
        <div className="border border-yellow-800 bg-zinc-950 p-6 mb-px flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1">Bankr API Key Required</p>
            <p className="text-[11px] text-zinc-500">Connect your Bankr account to enable trading and portfolio tracking.</p>
          </div>
          <button
            onClick={onShowKeyInput}
            className="shrink-0 border border-zinc-600 hover:border-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
          >
            <Key className="h-3.5 w-3.5" /> Add Key
          </button>
        </div>
      )}

      {/* API Key Input Form */}
      {showKeyInput && (
        <div className="border border-zinc-700 bg-zinc-950 p-6 mb-px">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Bankr API Key</span>
          </div>
          <p className="text-[11px] text-zinc-500 mb-4">
            Get your API key from <span className="text-zinc-300 font-mono">bankr.bot</span>. It&apos;s stored encrypted and only used for your account.
          </p>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => onKeyInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="bkr_..."
                className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs font-mono pr-10"
              />
              <button
                type="button"
                onClick={onToggleShowKey}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              onClick={onSaveKey}
              disabled={keySaving || !apiKeyInput.trim()}
              className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
            >
              {keySaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              onClick={onCancelKeyInput}
              className="border border-zinc-700 hover:border-zinc-500 px-3 py-2 text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
          {keyError && <p className="text-[11px] text-red-400">{keyError}</p>}
        </div>
      )}

      {/* Key configured — show manage option */}
      {keyConfigured && !showKeyInput && (
        <div className="border border-zinc-800 bg-zinc-950 px-6 py-3 mb-px flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            Bankr API key connected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowKeyInput}
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <Key className="h-3 w-3" /> Change
            </button>
            <button
              onClick={onDeleteKey}
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 ml-3"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default function TradingPage() {
  const [prompt, setPrompt] = useState('');
  const [threadId, setThreadId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [result, setResult] = useState<string>('');

  // API key management
  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Track polling timer for cleanup
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRefValue = pollTimerRef;

  // Check if key is configured on mount
  useEffect(() => {
    fetch('/api/user/bankr-key')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) startTransition(() => setKeyConfigured(data.configured))
      })
      .catch(() => startTransition(() => setKeyConfigured(false)))
  }, [])

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRefValue.current) clearTimeout(pollTimerRefValue.current)
    }
  }, [pollTimerRefValue])

  const saveKey = useCallback(async () => {
    if (!apiKeyInput.trim()) return
    setKeySaving(true)
    setKeyError(null)
    try {
      const res = await fetch('/api/user/bankr-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setKeyError(data.error || 'Failed to save key')
      } else {
        startTransition(() => {
          setKeyConfigured(true)
          setShowKeyInput(false)
          setApiKeyInput('')
        })
        refetchBalances()
      }
    } catch {
      setKeyError('Network error')
    } finally {
      setKeySaving(false)
    }
  }, [apiKeyInput])

  const deleteKey = useCallback(async () => {
    try {
      await fetch('/api/user/bankr-key', { method: 'DELETE' })
      startTransition(() => {
        setKeyConfigured(false)
        setShowKeyInput(false)
      })
    } catch {
      // ignore
    }
  }, [])

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances, error: balancesError } = useQuery<Balance[]>({
    queryKey: ['bankr-balances'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/balances');
      const data = await res.json();
      if (data.needsKey) {
        startTransition(() => {
          setKeyConfigured(false)
          setShowKeyInput(true)
        })
        return []
      }
      if (data.balances) return data.balances;
      return [];
    },
    enabled: keyConfigured !== false,
    refetchInterval: 30000,
  });

  const pollJob = useCallback((id: string) => {
    if (pollTimerRefValue.current) clearTimeout(pollTimerRefValue.current)
    const poll = async () => {
      const res = await fetch(`/api/bankr/prompt?jobId=${id}`);
      const data: Job = await res.json();
      if (data.status === 'completed') { startTransition(() => setResult(data.response || 'Task completed')); return; }
      if (data.status === 'failed') { startTransition(() => setResult(`Error: ${data.response || 'Task failed'}`)); return; }
      if (data.status === 'cancelled') { startTransition(() => setResult('Task cancelled')); return; }
      pollTimerRefValue.current = setTimeout(poll, 2000);
    };
    poll();
  }, [pollTimerRefValue])

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
        startTransition(() => {
          setJobId(data.jobId!)
          if (data.threadId) setThreadId(data.threadId)
        })
        pollJob(data.jobId);
      }
      if (data.response) startTransition(() => setResult(data.response!));
    },
  });

  const handleSendPrompt = useCallback((p: string) => {
    setPrompt(p);
    startTransition(() => setResult(''));
    sendPrompt(p);
  }, [sendPrompt]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    startTransition(() => setResult(''));
    sendPrompt(prompt);
  }, [prompt, sendPrompt]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  const handleShowKeyInput = useCallback(() => startTransition(() => setShowKeyInput(true)), []);
  const handleToggleShowKey = useCallback(() => setShowKey(v => !v), []);
  const handleKeyInputChange = useCallback((v: string) => setApiKeyInput(v), []);
  const handleCancelKeyInput = useCallback(() => {
    startTransition(() => {
      setShowKeyInput(false);
      setApiKeyInput('');
      setKeyError(null);
    });
  }, []);

  const quickActions = useMemo(() => [
    { label: 'Check ETH', prompt: 'What is my ETH balance on Base?' },
    { label: 'Portfolio', prompt: 'Show my complete portfolio' },
    { label: 'Price Check', prompt: 'What is the current price of ETH?' },
  ], []);

  const totalValue = useMemo(
    () => balances?.reduce((sum, b) => sum + Number(b.value || 0), 0) || 0,
    [balances]
  );

  return (
    <DashboardShell>
      <DashboardHeader title="Trading Agent" icon={<Sparkles className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>
        <KeyManagement
          keyConfigured={keyConfigured}
          showKeyInput={showKeyInput}
          showKey={showKey}
          apiKeyInput={apiKeyInput}
          keySaving={keySaving}
          keyError={keyError}
          onShowKeyInput={handleShowKeyInput}
          onToggleShowKey={handleToggleShowKey}
          onKeyInputChange={handleKeyInputChange}
          onSaveKey={saveKey}
          onCancelKeyInput={handleCancelKeyInput}
          onDeleteKey={deleteKey}
        />

        {/* Main content — only show when key is present */}
        {keyConfigured !== false && (
          <div className="grid gap-px bg-zinc-800 lg:grid-cols-3">
            {/* Portfolio + Quick Actions */}
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
                  ) : balancesError ? (
                    <div className="bg-zinc-950 border border-zinc-800 p-6 text-center">
                      <p className="text-xs text-red-400">Failed to load balances</p>
                    </div>
                  ) : balances && balances.length > 0 ? (
                    balances.map((balance, i) => (
                      <BalanceRow key={`${balance.symbol}-${balance.chain}-${i}`} balance={balance} />
                    ))
                  ) : (
                    <div className="bg-zinc-950 border border-zinc-800 p-8 text-center">
                      <p className="text-xs text-zinc-500">No balances found.</p>
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
                    <QuickActionButton
                      key={action.label}
                      label={action.label}
                      actionPrompt={action.prompt}
                      isSending={isSending}
                      onSend={handleSendPrompt}
                    />
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
                    onChange={handlePromptChange}
                    placeholder={"Ask the trading agent...\n- Buy $50 of ETH on Base\n- Swap 0.1 ETH for USDC\n- What tokens are trending?"}
                    className="w-full h-40 bg-black border border-zinc-700 p-4 text-xs focus:border-zinc-500 focus:outline-none resize-none"
                    disabled={isSending}
                  />

                  <button
                    type="submit"
                    disabled={isSending || !prompt.trim()}
                    className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ArrowUpDown className="h-4 w-4" /> Send Command</>
                    )}
                  </button>
                </form>
              </div>

              {result && (
                <div className="bg-zinc-950 border border-zinc-800 p-6">
                  <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Response</h2>
                  <div className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{result}</div>
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
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
