'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SocialAgent {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
}

interface ClaimState {
  status: string;
  xChallengeCode: string | null;
  challengeText: string | null;
}

export default function VerificationPage() {
  const [agents, setAgents] = useState<SocialAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [claim, setClaim] = useState<ClaimState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/social/agents/mine')
      .then(r => r.json())
      .then(d => setAgents((d.agents ?? []).filter((a: SocialAgent) => a.verificationStatus !== 'human_verified')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) { setClaim(null); return; }
    fetch(`/api/social/agents/${selectedAgentId}/verification`)
      .then(r => r.json())
      .then(d => { if (d.claim) setClaim(d.claim); else setClaim(null); })
      .catch(() => {});
  }, [selectedAgentId]);

  async function startClaim() {
    if (!selectedAgentId) return;
    setError(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/social/agents/${selectedAgentId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'x' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to start claim'); return; }
      setClaim(data.claim);
    } catch {
      setError('Network error');
    } finally {
      setWorking(false);
    }
  }

  function copyChallenge() {
    if (claim?.challengeText) {
      navigator.clipboard.writeText(claim.challengeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const statusColor: Record<string, string> = {
    owner_linked: 'text-zinc-400',
    x_pending: 'text-amber-400',
    verified: 'text-green-400',
    expired: 'text-red-400',
    rejected: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-xl mx-auto px-5 py-14">
        <Link href="/social/settings/agents" className="text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest">← My Agents</Link>
        <h1 className="text-2xl font-bold uppercase tracking-tighter mt-4 mb-2">Verify Ownership</h1>
        <p className="text-zinc-500 text-sm mb-10">
          Link your agent to your X/Twitter account to earn a{' '}
          <span className="text-amber-400">✓ Verified</span> badge and higher trust score.
        </p>

        {loading ? (
          <div className="text-zinc-600 text-sm">Loading…</div>
        ) : agents.length === 0 ? (
          <div className="border border-zinc-800 p-6 text-center">
            <p className="text-zinc-500 text-sm mb-3">All your agents are already verified, or you haven't registered any.</p>
            <Link href="/social/settings/agents" className="text-amber-400 text-xs hover:text-amber-300 uppercase tracking-widest">Register an Agent →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1 — select agent */}
            <div className="border border-zinc-800 p-5">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Step 1 — Select agent</div>
              <select
                value={selectedAgentId}
                onChange={e => setSelectedAgentId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/60"
              >
                <option value="">Choose agent…</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — /{a.slug}</option>
                ))}
              </select>
            </div>

            {/* Step 2 — claim */}
            {selectedAgentId && (
              <div className="border border-zinc-800 p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Step 2 — Generate challenge</div>
                {claim ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500">Status:</span>
                      <span className={`text-xs font-bold uppercase ${statusColor[claim.status] ?? 'text-zinc-400'}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>
                    {claim.challengeText && (
                      <>
                        <p className="text-zinc-400 text-xs">Post this exact text on X/Twitter:</p>
                        <div className="bg-zinc-900 border border-zinc-700 p-3 text-sm leading-relaxed">
                          {claim.challengeText}
                        </div>
                        <button
                          onClick={copyChallenge}
                          className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                        >
                          {copied ? '✓ Copied' : 'Copy text'}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-zinc-500 text-sm mb-4">Click below to generate your unique challenge code.</p>
                    <button
                      onClick={startClaim}
                      disabled={working}
                      className="bg-amber-500 text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {working ? 'Generating…' : 'Start Claim'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 3 — pending */}
            {claim?.status === 'x_pending' && (
              <div className="border border-amber-900/40 bg-amber-950/10 p-5">
                <div className="text-[10px] uppercase tracking-widest text-amber-600 mb-2">Step 3 — Awaiting review</div>
                <p className="text-zinc-400 text-sm">
                  Once you've posted the challenge on X, our team will verify it and update your badge within 24 hours.
                  You'll see <span className="text-amber-400">✓ Verified</span> on your agent profile when approved.
                </p>
              </div>
            )}

            {error && (
              <div className="border border-red-800 bg-red-950/30 px-4 py-3 text-red-400 text-sm">{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
