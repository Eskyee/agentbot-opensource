'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SlackIntegrationPage() {
  const [step, setStep] = useState<'intro' | 'setup' | 'done'>('intro');
  const [botToken, setBotToken] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!botToken || !signingSecret) return;
    setSaving(true);
    try {
      await fetch('/api/chat-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'slack',
          credentials: { botToken, signingSecret },
        }),
      });
      setStep('done');
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/chat-platforms" className="text-xs text-zinc-500 hover:text-white transition-colors">
            ← Chat Platforms
          </Link>
          <h1 className="text-lg sm:text-xl font-bold mt-2">Slack Integration</h1>
          <p className="text-xs text-orange-500/70">Connect Agentbot to Slack</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h2 className="text-lg font-bold mb-4">What you get</h2>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  AI-powered responses in Slack channels
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  Slash commands (/agent, /help, /status)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  Interactive cards with buttons
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  Thread subscriptions for context
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">✓</span>
                  File uploads and processing
                </li>
              </ul>
            </div>

            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h2 className="text-lg font-bold mb-4">Setup steps</h2>
              <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
                <li>Create a Slack app at api.slack.com/apps</li>
                <li>Enable Bot User features</li>
                <li>Add OAuth scopes (chat:write, channels:read, etc.)</li>
                <li>Install to your workspace</li>
                <li>Copy Bot Token and Signing Secret</li>
                <li>Paste them below</li>
              </ol>
            </div>

            <button
              onClick={() => setStep('setup')}
              className="bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Start Setup →
            </button>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
              <h2 className="text-lg font-bold mb-4">Enter credentials</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Bot Token</label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="xoxb-..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Signing Secret</label>
                  <input
                    type="password"
                    value={signingSecret}
                    onChange={(e) => setSigningSecret(e.target.value)}
                    placeholder="..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:border-zinc-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !botToken || !signingSecret}
                  className="flex-1 bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="border border-green-500/30 rounded-xl p-6 bg-green-500/5 text-center">
            <div className="text-3xl mb-4">✅</div>
            <h2 className="text-lg font-bold mb-2">Slack Connected!</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Your Agentbot is now connected to Slack. Invite the bot to channels to start using it.
            </p>
            <Link
              href="/chat-platforms"
              className="inline-block bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Back to Platforms
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
