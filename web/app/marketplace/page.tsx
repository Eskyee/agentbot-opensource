'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomSession } from '@/app/lib/useCustomSession';

const templates = [
  {
    name: 'the-strategist',
    role: 'Mission Planning Agent',
    description: 'Advanced reasoning for complex crew operations. Powered by DeepSeek R1. Plans tours, logistics, and resource allocation.',
    skills: ['Mission Planning', 'Logistics', 'Resource Analysis', 'A2A Coordination'],
    popular: true,
    tier: 'Label',
    brain: 'DeepSeek R1'
  },
  {
    name: 'crew-manager',
    role: 'Operations & Finance Agent',
    description: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    skills: ['Royalty Splits', 'Talent Booking', 'Treasury Guard', 'USDC Payments'],
    popular: true,
    tier: 'Underground',
    brain: 'Llama 3.3'
  },
  {
    name: 'sound-system',
    role: 'Automation & Feedback Agent',
    description: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    skills: ['Mux Monitor', 'RAVE Gating', 'Fast Feedback', 'Live Traces'],
    popular: true,
    tier: 'Free',
    brain: 'Mistral 7B'
  },
  {
    name: 'the-developer',
    role: 'Logic & Scripting Agent',
    description: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    skills: ['Code Gen', 'Scripting', 'Contract Audit', 'Skill Builder'],
    popular: false,
    tier: 'Collective',
    brain: 'Qwen 2.5'
  }
];

interface DeployModalProps {
  template: typeof templates[number];
  onClose: () => void;
  onDeployed: (agentId: string, agentName: string) => void;
}

function DeployModal({ template, onClose, onDeployed }: DeployModalProps) {
  const [botName, setBotName] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');

  const handleDeploy = async () => {
    const name = botName.trim();
    if (!name) {
      setError('Give your bot a name before deploying.');
      return;
    }
    if (name.length > 64) {
      setError('Name must be 64 characters or less.');
      return;
    }

    setDeploying(true);
    setError('');

    try {
      const res = await fetch('/api/agents/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          model: 'claude-opus-4-6',
          config: { template: template.name, brain: template.brain, tier: template.tier.toLowerCase() },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Deploy failed. Check your subscription.');
        setDeploying(false);
        return;
      }

      onDeployed(data.agent?.id, name);
    } catch {
      setError('Network error. Try again.');
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">{template.tier} tier · {template.brain}</span>
            <h2 className="text-sm font-bold uppercase tracking-tight text-white mt-0.5">Deploy {template.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
              Bot Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Atlas, Raven, Klave..."
              value={botName}
              onChange={(e) => { setBotName(e.target.value); setError(''); }}
              maxLength={64}
              autoFocus
              className="w-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white focus:outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') handleDeploy(); }}
            />
            <div className="flex items-center justify-between mt-1.5">
              {error
                ? <p className="text-red-400 text-xs">{error}</p>
                : <p className="text-zinc-600 text-xs">This is your bot&apos;s display name — you can rename it later.</p>
              }
              <span className="text-zinc-700 text-xs font-mono">{botName.length}/64</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 space-y-1">
            {template.skills.map(skill => (
              <div key={skill} className="text-[10px] uppercase tracking-widest text-zinc-500">· {skill}</div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-700 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying || !botName.trim()}
            className="flex-1 bg-white text-black px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {deploying ? 'Deploying...' : 'Deploy Bot'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { data: session } = useCustomSession();
  const router = useRouter();
  const [deployingTemplate, setDeployingTemplate] = useState<typeof templates[number] | null>(null);
  const [successName, setSuccessName] = useState('');

  const handleDeployClick = (template: typeof templates[number]) => {
    if (!session) {
      router.push('/signup');
      return;
    }
    setDeployingTemplate(template);
  };

  const handleDeployed = (_agentId: string, agentName: string) => {
    setDeployingTemplate(null);
    setSuccessName(agentName);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 sm:mb-16 space-y-4 sm:space-y-6">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Verified Fleet</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
            Agent <span className="text-zinc-700">Marketplace</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
          </p>
        </div>

        {/* Success banner */}
        {successName && (
          <div className="mb-8 border border-green-500/30 bg-green-500/10 px-5 py-3 flex items-center gap-3">
            <span className="text-green-400 text-xs font-mono">✓</span>
            <span className="text-green-400 text-xs uppercase tracking-widest font-bold">
              {successName} deployed — redirecting to dashboard...
            </span>
          </div>
        )}

        {/* Agent Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {templates.map((template) => (
            <article key={template.name} className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <div className="flex justify-between items-start mb-4 gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">{template.tier} Tier</span>
                  <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight truncate">{template.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{template.role}</p>
                </div>
                <div className="border border-zinc-800 px-3 py-1 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{template.brain}</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 mb-4">
                <p className="text-sm text-zinc-400 leading-relaxed">{template.description}</p>
              </div>

              <div className="grid gap-2 grid-cols-2 mb-5">
                {template.skills.map((skill) => (
                  <div key={skill} className="text-[10px] uppercase tracking-widest border border-zinc-800 px-3 py-1.5 text-zinc-500">
                    {skill}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleDeployClick(template)}
                className="block w-full text-left bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors text-center"
              >
                Deploy {template.name}
              </button>
            </article>
          ))}
        </div>

        {/* Platform Note */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Platform Integrity</span>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">The Purge</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We have archived all legacy and unoptimized agents. The current fleet is strictly tuned for <strong className="text-zinc-300">OpenClaw Multi-tenancy</strong> and <strong className="text-zinc-300">Base Onchain Economy</strong>. If it doesn&apos;t make you profit, it isn&apos;t here.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 sm:mt-32 pt-12 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            Agentbot Marketplace
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
            <Link href="/token" className="hover:text-white transition-colors">Token</Link>
            <Link href="/partner" className="hover:text-white transition-colors">Partner</Link>
          </div>
        </div>
      </div>

      {/* Deploy modal */}
      {deployingTemplate && (
        <DeployModal
          template={deployingTemplate}
          onClose={() => setDeployingTemplate(null)}
          onDeployed={handleDeployed}
        />
      )}
    </main>
  );
}
