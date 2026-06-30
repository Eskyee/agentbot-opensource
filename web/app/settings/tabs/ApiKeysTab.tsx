'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ApiKeysTabProps {
  agents: { id: string; name: string; status: string }[];
}

export function ApiKeysTab({ agents }: ApiKeysTabProps) {
  const [apiKeys, setApiKeys] = useState<
    { id: string; name: string; key: string; created: string }[]
  >([]);
  const hasLiveAgent = agents.length > 0;

  // Bankr API key state
  const [bankrConfigured, setBankrConfigured] = useState(false);
  const [bankrKey, setBankrKey] = useState('');
  const [bankrSaving, setBankrSaving] = useState(false);
  const [bankrMsg, setBankrMsg] = useState('');

  useEffect(() => {
    fetch('/api/user/bankr-key')
      .then((r) => r.json())
      .then((d) => setBankrConfigured(!!d.configured))
      .catch(() => {});
  }, []);

  async function saveBankrKey() {
    if (!bankrKey.trim()) return;
    setBankrSaving(true);
    setBankrMsg('');
    try {
      const res = await fetch('/api/user/bankr-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: bankrKey.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setBankrConfigured(true);
        setBankrKey('');
        setBankrMsg('Saved');
      } else {
        setBankrMsg(d.error || 'Failed to save');
      }
    } catch {
      setBankrMsg('Network error');
    } finally {
      setBankrSaving(false);
    }
  }

  async function deleteBankrKey() {
    if (!confirm('Delete your Bankr API key?')) return;
    await fetch('/api/user/bankr-key', { method: 'DELETE' });
    setBankrConfigured(false);
    setBankrMsg('Removed');
  }

  const createApiKey = async () => {
    const name = prompt('Enter a name for this API key:');
    if (!name) return;

    const newKey = {
      id: Date.now().toString(),
      name,
      key: `ab_key_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
    };

    setApiKeys([...apiKeys, newKey]);
    toast.success(`API Key created: ${newKey.key}`);
  };

  const deleteApiKey = (id: string) => {
    if (!confirm('Delete this API key?')) return;
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Bankr API Key Section */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🏦</span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bankr API Key</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Connect your Bankr wallet for autonomous trading and portfolio management.
            </p>
          </div>
          {bankrConfigured && (
            <span className="ml-auto text-[9px] uppercase tracking-widest text-green-500 border border-green-500/30 px-2 py-0.5">
              Connected
            </span>
          )}
        </div>
        {bankrConfigured ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-mono">••••••••</span>
            <button
              onClick={deleteBankrKey}
              className="text-red-400 hover:text-red-300 text-[10px] uppercase tracking-widest font-bold"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={bankrKey}
              onChange={(e) => setBankrKey(e.target.value)}
              placeholder="Enter your Bankr API key"
              className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={saveBankrKey}
              disabled={bankrSaving || !bankrKey.trim()}
              className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {bankrSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
        {bankrMsg && <p className="text-[10px] text-zinc-500 mt-2">{bankrMsg}</p>}
        <a
          href="https://bankr.bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
        >
          Get a Bankr key →
        </a>
      </div>

      {/* Agent API Keys Section */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base sm:text-xl font-semibold">Agent API Keys</h2>
        {hasLiveAgent && (
          <button
            onClick={createApiKey}
            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            + Create Key
          </button>
        )}
      </div>

      {!hasLiveAgent ? (
        <div className="border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 text-left">
          <div className="text-4xl mb-4">🔑</div>
          <h3 className="text-base sm:text-lg font-medium mb-2">No Managed Runtime Found</h3>
          <p className="text-zinc-400 text-sm mb-6">
            API keys unlock advanced runtime integrations. Once your managed OpenClaw runtime is
            provisioned, you can create and rotate keys here.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                  Name
                </th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                  Key
                </th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                  Created
                </th>
                <th className="text-right p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 sm:p-8 text-left text-zinc-500 text-sm">
                    No API keys created yet.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="border-t border-zinc-900">
                    <td className="p-3 sm:p-4 text-sm font-medium">{key.name}</td>
                    <td className="p-3 sm:p-4 font-mono text-xs text-zinc-400 max-w-[140px] truncate">
                      {key.key}
                    </td>
                    <td className="p-3 sm:p-4 text-xs text-zinc-400">{key.created}</td>
                    <td className="p-3 sm:p-4 text-right">
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
