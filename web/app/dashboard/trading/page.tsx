'use client';

import { useState, useEffect } from 'react';
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

  // Check if key is configured on mount
  useEffect(() => {
    fetch('/api/user/bankr-key')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setKeyConfigured(data.configured)
      })
      .catch(() => setKeyConfigured(false))
  }, [])

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return
    setKeySaving(true)
    setKeyError(null)
    try {
      const res = await fetch('/api/user/bankr-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() }
      if (!res.ok) {
        setKeyError(data.error || 'Failed to save key')
      } else {
        setKeyConfigured(true)
        setShowKeyInput(false)
        setApiKeyInput('')
        refetchBalances()
      }
    } catch {
      setKeyError('Network error')
    } finally {
      setKeySaving(false)
    }
  }

  const deleteKey = async () => {
    try {
      await fetch('/api/user/bankr-key', { method: 'DELETE' })
      setKeyConfigured(false)
      setShowKeyInput(false)
    } catch {
      // ignore
    }
  }

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances, error: balancesError } = useQuery<Balance[]>({
    queryKey: ['bankr-balances'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/balances');
      const data = await res.json();
      if (data.needsKey) {
        setKeyConfigured(false)
        setShowKeyInput(true)
        return []
      }
      if (data.balances) return data.balances;
      return [];
    },
    enabled: keyConfigured !== false,
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
        if (data.threadId) setThreadId(data.threadId);
        pollJob(data.jobId);
      }
      if (data.response) setResult(data.response);
    },
  });

  const pollJob = async (id: string) => {
    const poll = async () => {
      const res = await fetch(`/api/bankr/prompt?jobId=${id}`);
      const data: Job = await res.json();
      if (data.status === 'completed') { setResult(data.response || 'Task completed'); return; }
      if (data.status === 'failed') { setResult(`Error: ${data.response || 'Task failed'}`); return; }
      if (data.status === 'cancelled') { setResult('Task cancelled'); return; }
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
  const needsKey = keyConfigured === false;

  return (
    <DashboardShell>
      <DashboardHeader title="Trading Agent" icon={<Sparkles className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>

        {/* API Key Banner */}
        {needsKey && !showKeyInput && (
          <div className="border border-yellow-800 bg-zinc-950 p-6 mb-px flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1">Bankr API Key Required</p>
              <p className="text-[11px] text-zinc-500">Connect your Bankr account to enable trading and portfolio tracking.</p>
            </div>
            <button
              onClick={() => setShowKeyInput(true)}
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
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveKey()}
                  placeholder="bkr_..."
                  className="w-full bg-black border border-zinc-700 focus:border-zinc-500 focus:outline-none px-3 py-2 text-xs font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                onClick={saveKey}
                disabled={keySaving || !apiKeyInput.trim()}
                className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center gap-2"
              >
                {keySaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Save
              </button>
              <button
                onClick={() => { setShowKeyInput(false); setApiKeyInput(''); setKeyError(null); }}
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
              <a
                href="https://bankr.bot/agents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                Open Profiles
              </a>
              <button
                onClick={() => setShowKeyInput(true)}
                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <Key className="h-3 w-3" /> Change
              </button>
              <button
                onClick={deleteKey}
                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 ml-3"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Main content — only show when key is present */}
        {!needsKey && (
          <div className="grid gap-px bg-zinc-800 lg:grid-cols-3">
            {/* Portfolio + Quick Actions */}
            <div className="lg:col-span-2 space-y-px bg-zinc-800">
              <div className="bg-zinc-950 border border-zinc-800 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Bankr Agent Profiles</div>
                    <h2 className="text-sm font-bold tracking-tight uppercase">Public Profile And Project Feed</h2>
                    <p className="text-[11px] text-zinc-500 mt-2 max-w-2xl leading-relaxed">
                      Agent Profiles live at <span className="font-mono text-zinc-300">bankr.bot/agents</span>. They showcase your project, token, team, shipped products, fee revenue, and update feed. Creation and approval happen on Bankr today, not inside Agentbot.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  </div>
                </div>

                <div className="grid gap-px bg-zinc-800 sm:grid-cols-3 mb-4">
                  <div className="bg-zinc-950 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 1</div>
                    <div className="text-xs font-bold uppercase tracking-tight">Save Your Bankr API Key</div>
                    <div className="text-[11px] text-zinc-500 mt-2">Your key is now stored per-user and used for balances plus Bankr agent actions.</div>
                  </div>
                  <div className="bg-zinc-950 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 2</div>
                    <div className="text-xs font-bold uppercase tracking-tight">Create Your Profile On Bankr</div>
                    <div className="text-[11px] text-zinc-500 mt-2">Profiles are created via Bankr CLI, REST API, or your OpenClaw agent with the Bankr skill installed.</div>
                  </div>
                  <div className="bg-zinc-950 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 3</div>
                    <div className="text-xs font-bold uppercase tracking-tight">Wait For Approval</div>
                    <div className="text-[11px] text-zinc-500 mt-2">Public listing, market cap, and fee-revenue refresh happen after Bankr admin review.</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {keyConfigured && (
                    <a
                      href="https://bankr.bot/agents"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                    >
                      Open Agent Profiles
                    </a>
                  )}
                  <a
                    href="https://bankr.bot/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-zinc-700 hover:border-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Open Bankr API
                  </a>
                  <a
                    href="https://bankr.bot/agents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-zinc-700 hover:border-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Browse Profiles
                  </a>
                  <a
                    href="https://github.com/BankrBot/skills/tree/main/bankr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-zinc-700 hover:border-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Install Bankr Skill
                  </a>
                </div>
              </div>

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
                    <button
                      key={action.label}
                      onClick={() => { setPrompt(action.prompt); sendPrompt(action.prompt); }}
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
