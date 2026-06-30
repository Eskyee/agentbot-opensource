'use client';

import { useState, useEffect } from 'react';
import { useCustomSession } from '@/app/lib/useCustomSession';
import { useRouter } from 'next/navigation';

interface ChatPlatform {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'available' | 'coming_soon';
  capabilities: string[];
  envVars: string[];
  setupUrl?: string;
  connected?: boolean;
  connectedAt?: string;
}

export default function ChatPlatformsPage() {
  const { data: session, status } = useCustomSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<ChatPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<ChatPlatform | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ platform: string; result: any } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/chat-platforms')
        .then((r) => r.json())
        .then((data) => {
          setPlatforms(data.platforms || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const handleConnect = async (platform: ChatPlatform) => {
    setSelectedPlatform(platform);
  };

  const handleSaveCredentials = async (credentials: Record<string, string>) => {
    if (!selectedPlatform) return;

    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/chat-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          credentials,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPlatforms(
          platforms.map((p) =>
            p.id === selectedPlatform.id
              ? { ...p, connected: true, connectedAt: new Date().toISOString() }
              : p
          )
        );
        setSelectedPlatform(null);
        setMessage({ type: 'success', text: `${selectedPlatform.name} connected successfully!` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect' });
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setMessage({ type: 'error', text: 'Network error — please try again' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setMessage(null);
    try {
      const res = await fetch('/api/chat-platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });

      if (res.ok) {
        setPlatforms(platforms.map((p) => (p.id === platformId ? { ...p, connected: false } : p)));
        setMessage({ type: 'success', text: 'Platform disconnected' });
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    }
  };

  const testConnection = async (platformId: string) => {
    setTesting(platformId);
    setTestResult(null);
    setMessage(null);
    try {
      const res = await fetch('/api/chat-platforms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });
      const data = await res.json();
      setTestResult({ platform: platformId, result: data });
      if (data.ok) {
        setMessage({ type: 'success', text: `${platformId} connection verified` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Connection test failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Test request failed' });
    } finally {
      setTesting(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold">Chat Platforms</h1>
          <p className="text-xs text-orange-500/70">Connect your agents to messaging platforms</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 text-xs opacity-70 hover:opacity-100"
            >
              dismiss
            </button>
          </div>
        )}

        {testResult && testResult.result.ok && (
          <div className="mb-4 p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-xs">
            <p className="font-bold text-green-400 mb-1">{testResult.platform} — Verified</p>
            {testResult.result.user && (
              <p className="text-zinc-400">
                {testResult.result.user.name || testResult.result.user.login || testResult.result.user.email}
                {testResult.result.teams && ` · ${testResult.result.teams.map((t: any) => t.name).join(', ')}`}
                {testResult.result.user.team && ` · ${testResult.result.user.team}`}
              </p>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mb-8 p-4 border border-zinc-800 rounded-lg bg-zinc-950">
          <h3 className="text-sm font-bold mb-2">How it works</h3>
          <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
            <li>Connect a platform (Slack, Teams, Linear, GitHub)</li>
            <li>Your agent receives messages from that platform</li>
            <li>Agent responds with AI-powered answers</li>
            <li>Use slash commands for advanced actions</li>
          </ol>
        </div>

        {/* Platforms grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`border rounded-xl p-5 transition-colors ${
                platform.connected
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-bold">{platform.name}</span>
                </div>
                {platform.connected && (
                  <span className="text-[10px] text-green-400 px-2 py-0.5 bg-green-500/10 rounded">
                    Connected
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 mb-4">{platform.description}</p>

              <div className="mb-4">
                <p className="text-[10px] text-zinc-500 mb-1">Capabilities:</p>
                <div className="flex flex-wrap gap-1">
                  {platform.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400"
                    >
                      {cap}
                    </span>
                  ))}
                  {platform.capabilities.length > 3 && (
                    <span className="text-[10px] text-zinc-500">
                      +{platform.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {platform.connected ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => testConnection(platform.id)}
                    disabled={testing === platform.id}
                    className="flex-1 text-xs py-2 border border-zinc-700 text-zinc-400 hover:text-green-400 hover:border-green-500/40 rounded transition-colors disabled:opacity-50"
                  >
                    {testing === platform.id ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="flex-1 text-xs py-2 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/40 rounded transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(platform)}
                  className="w-full text-xs py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Connection modal */}
        {selectedPlatform && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Connect {selectedPlatform.name}</h2>

                {selectedPlatform.setupUrl && (
                  <div className="mb-4 p-3 bg-zinc-900 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-2">
                      First, create a {selectedPlatform.name} app:
                    </p>
                    <a
                      href={selectedPlatform.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-400"
                    >
                      {selectedPlatform.setupUrl} →
                    </a>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {selectedPlatform.envVars.map((envVar) => (
                    <div key={envVar}>
                      <label className="block text-xs text-zinc-500 mb-1">{envVar}</label>
                      <input
                        type="password"
                        id={`env-${envVar}`}
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                        placeholder={`Enter ${envVar}`}
                        autoFocus
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPlatform(null)}
                    className="flex-1 border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:border-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const credentials: Record<string, string> = {};
                      selectedPlatform.envVars.forEach((envVar) => {
                        const input = document.getElementById(`env-${envVar}`) as HTMLInputElement;
                        if (input) credentials[envVar] = input.value;
                      });

                      const hasEmpty = selectedPlatform.envVars.some(
                        (envVar) => !credentials[envVar]?.trim()
                      );
                      if (hasEmpty) {
                        setMessage({ type: 'error', text: 'Please fill in all fields' });
                        return;
                      }

                      handleSaveCredentials(credentials);
                    }}
                    disabled={connecting}
                    className="flex-1 bg-white text-black px-4 py-2 text-xs font-bold rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
