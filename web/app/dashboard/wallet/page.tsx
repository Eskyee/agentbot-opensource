'use client';

import { useState, useEffect } from 'react';
import { useCustomSession } from '@/app/lib/useCustomSession';
import { setSessionId, clearSessionId } from '@/lib/mpp/session-fetch';
import { Wallet, ExternalLink, Copy, Check } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

interface WalletData {
  address: string;
  chain: string;
  chainId: number;
  testnet: boolean;
  totalUsd: string;
  primaryToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
  } | null;
  allTokens: {
    address: string;
    name: string;
    symbol: string;
    balance: string;
  }[];
}

interface Session {
  id: string;
  userAddress: string;
  deposit: string;
  spent: string;
  remaining: string;
  vouchers: unknown[];
  status: 'active' | 'settling' | 'closed';
  createdAt: number;
}

export default function WalletPage() {
  const { data: session, status } = useCustomSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mppSession, setMppSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tempo_wallet_address');
    if (stored) {
      setWalletAddress(stored);
      setConnected(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) return;

    async function fetchWallet() {
      try {
        const res = await fetch(`/api/wallet?address=${walletAddress}`);
        if (!res.ok) throw new Error('Failed to fetch wallet');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setWallet(data);
      } catch (err) {
        console.error('Wallet fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;

    async function fetchSession() {
      try {
        const res = await fetch(`/api/wallet/sessions?address=${walletAddress}`);
        const data = await res.json();
        if (data.sessions?.length > 0) {
          const active = data.sessions.find((s: Session) => s.status === 'active');
          if (active) {
            setMppSession(active);
            setSessionId(active.id);
          }
        }
      } catch (err) {
        console.error('Session fetch error:', err);
      }
    }
    fetchSession();
  }, [walletAddress]);

  async function openSession() {
    if (!walletAddress) return;
    setSessionLoading(true);
    try {
      const res = await fetch('/api/wallet/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, deposit: '10.00' }),
      });
      const data = await res.json();
      if (data.session) {
        setMppSession(data.session);
        setSessionId(data.session.id);
      }
    } catch (err) {
      console.error('Open session error:', err);
    } finally {
      setSessionLoading(false);
    }
  }

  async function closeMppSession() {
    if (!mppSession) return;
    setSessionLoading(true);
    try {
      const res = await fetch(`/api/wallet/sessions?sessionId=${mppSession.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMppSession(null);
        clearSessionId();
      }
    } catch (err) {
      console.error('Close session error:', err);
    } finally {
      setSessionLoading(false);
    }
  }

  const [addressInput, setAddressInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!addressInput.startsWith('0x') || addressInput.length !== 42) return;

    setConnecting(true);
    try {
      const res = await fetch(`/api/wallet?address=${addressInput}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      localStorage.setItem('tempo_wallet_address', addressInput);
      setWalletAddress(addressInput);
      setConnected(true);
      setWallet(data);
    } catch (err) {
      console.error('Connect error:', err);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem('tempo_wallet_address');
    setWalletAddress(null);
    setConnected(false);
    setWallet(null);
    setAddressInput('');
  }

  return (
    <DashboardShell>
      <DashboardHeader title="Wallet" icon={<Wallet className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>
        <div className="max-w-2xl">
          {!connected ? (
            /* Connect */
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Connect</span>
              <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Tempo Wallet</h2>
              <p className="text-xs text-zinc-500 mb-6">
                Connect your Tempo wallet to manage agent payments. Your wallet, your funds.
              </p>
              <form onSubmit={handleConnect}>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black border border-zinc-800 px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono mb-4"
                />
                <button
                  type="submit"
                  disabled={connecting || addressInput.length !== 42}
                  className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <a
                  href="https://wallet.tempo.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
                >
                  Create wallet at wallet.tempo.xyz <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <div className="border border-zinc-800 bg-zinc-950 p-6 mb-px">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 bg-zinc-900 w-24"></div>
                    <div className="h-8 bg-zinc-900 w-48"></div>
                    <div className="h-2 bg-zinc-900 w-32"></div>
                  </div>
                ) : wallet ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600">Balance</span>
                      <div className="flex items-center gap-3">
                        <StatusPill
                          status={wallet.testnet ? 'idle' : 'active'}
                          label={wallet.testnet ? 'Testnet' : 'Mainnet'}
                          size="sm"
                        />
                        <button
                          onClick={handleDisconnect}
                          className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                    <div className="text-4xl font-bold tracking-tight mb-1">
                      ${parseFloat(wallet.totalUsd).toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mb-6">
                      {wallet.primaryToken?.symbol || 'USD'} {wallet.allTokens.length > 1 ? `(+${wallet.allTokens.length - 1} more)` : ''}
                    </div>
                    <div className="border-t border-zinc-800 pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Address</span>
                        <a
                          href={`https://explore${wallet.testnet ? '.testnet' : ''}.tempo.xyz/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-zinc-300 hover:text-zinc-100 flex items-center gap-1"
                        >
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Network</span>
                        <span className="text-xs font-mono text-zinc-300">{wallet.chain}</span>
                      </div>
                      {wallet.allTokens.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Tokens</span>
                          {wallet.allTokens.map((token) => (
                            <div key={token.address} className="flex items-center justify-between py-1">
                              <span className="text-xs text-zinc-500">{token.symbol}</span>
                              <span className="text-xs font-mono text-zinc-300">{parseFloat(token.balance).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Payment Session */}
              <div className="border border-zinc-800 bg-zinc-950 p-6 mb-px">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Payment Session</span>
                  {mppSession && (
                    <StatusPill status="active" label="Active" size="sm" />
                  )}
                </div>
                {mppSession ? (
                  <>
                    <div className="grid gap-px bg-zinc-800 grid-cols-3 mb-4">
                      <div className="bg-zinc-950 p-3">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Deposited</span>
                        <span className="text-lg font-bold tracking-tight">${mppSession.deposit}</span>
                      </div>
                      <div className="bg-zinc-950 p-3">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Spent</span>
                        <span className="text-lg font-bold tracking-tight text-red-400">${mppSession.spent}</span>
                      </div>
                      <div className="bg-zinc-950 p-3">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Remaining</span>
                        <span className="text-lg font-bold tracking-tight text-emerald-400">${mppSession.remaining}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-4">
                      <span className="text-zinc-500">Pending vouchers: {mppSession.vouchers.length}</span>
                      <button
                        onClick={closeMppSession}
                        disabled={sessionLoading}
                        className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {sessionLoading ? 'Closing...' : 'Close Session'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500 mb-4">
                      Open a payment session for off-chain agent billing. Sub-100ms per call, no gas fees.
                    </p>
                    <button
                      onClick={openSession}
                      disabled={sessionLoading}
                      className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                    >
                      {sessionLoading ? 'Opening...' : 'Open Session ($10.00)'}
                    </button>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="grid gap-px bg-zinc-800 grid-cols-2 mb-px">
                <div className="bg-zinc-950 border border-zinc-800 p-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Top Up via Stripe</span>
                  <div className="grid grid-cols-2 gap-px bg-zinc-800">
                    {[5, 10, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={async () => {
                          if (topUpLoading) return;
                          setTopUpLoading(amt);
                          try {
                            const res = await fetch(`/api/wallet/top-up?amount=${amt * 100}&address=${walletAddress}`);
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else if (res.status === 401) {
                              window.location.href = data.loginUrl || '/signup';
                            } else if (data.error) {
                              alert(`Top-up error: ${data.error}`);
                              setTopUpLoading(null);
                            }
                          } catch (err) {
                            console.error('Top-up error:', err);
                            setTopUpLoading(null);
                          }
                        }}
                        disabled={topUpLoading === amt}
                        className="bg-zinc-950 border border-zinc-700 p-2 text-xs font-mono hover:border-zinc-500 transition-colors disabled:opacity-50"
                      >
                        {topUpLoading === amt ? '...' : `$${amt}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Direct Transfer</span>
                  <p className="text-xs text-zinc-500 mb-3">
                    Send USDC directly to your Tempo wallet address.
                  </p>
                  <button
                    onClick={() => {
                      if (!wallet) return;
                      navigator.clipboard.writeText(wallet.address);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full border border-zinc-700 hover:border-zinc-500 p-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy Address</>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Recent Activity</span>
                <div className="border border-zinc-800 bg-zinc-950 p-6">
                  <p className="text-xs text-zinc-500 mb-3">
                    Transaction history is available on Tempo Explorer.
                  </p>
                  {wallet && (
                    <a
                      href={`https://explore${wallet.testnet ? '.testnet' : ''}.tempo.xyz/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                    >
                      View on Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {mppSession && mppSession.vouchers.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Session Activity</span>
                    <div className="border border-zinc-800 divide-y divide-zinc-800">
                      {mppSession.vouchers.map((v: any, i: number) => (
                        <div key={i} className="p-4 flex items-center justify-between bg-zinc-950">
                          <div>
                            <div className="text-xs text-zinc-300">Agent call ({v.plugin})</div>
                            <div className="text-[10px] text-zinc-600 mt-1">
                              {new Date(v.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-red-400">-${v.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
