'use client'

import { useState } from 'react';

interface DeployModalProps {
  template: { name: string; role: string; description: string; skills: string[]; tier: string; brain: string };
  onClose: () => void;
  onDeployed: (agentId: string, agentName: string) => void;
}

export function DeployModal({ template, onClose, onDeployed }: DeployModalProps) {
  const [botName, setBotName] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');

  const handleDeploy = async () => {
    const name = botName.trim();
    if (!name) { setError('Give your bot a name before deploying.'); return; }
    if (name.length > 64) { setError('Name must be 64 characters or less.'); return; }

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
      if (!res.ok) { setError(data.error || 'Deploy failed. Check your subscription.'); setDeploying(false); return; }
      onDeployed(data.agent?.id, name);
    } catch {
      setError('Network error. Try again.');
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-700 w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">{template.tier} tier · {template.brain}</span>
            <h2 className="text-sm font-bold uppercase tracking-tight text-white mt-0.5">Deploy {template.name}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-lg leading-none transition-colors">×</button>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Bot Name <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. Atlas, Raven, Klave..." value={botName} onChange={(e) => { setBotName(e.target.value); setError(''); }} maxLength={64} autoFocus className="w-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white focus:outline-none" onKeyDown={(e) => { if (e.key === 'Enter') handleDeploy(); }} />
            <div className="flex items-center justify-between mt-1.5">
              {error ? <p className="text-red-400 text-xs">{error}</p> : <p className="text-zinc-600 text-xs">Display name — can rename later.</p>}
              <span className="text-zinc-700 text-xs font-mono">{botName.length}/64</span>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 space-y-1">
            {template.skills.map(skill => <div key={skill} className="text-[10px] uppercase tracking-widest text-zinc-500">· {skill}</div>)}
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 border border-zinc-700 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleDeploy} disabled={deploying || !botName.trim()} className="flex-1 bg-white text-black px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {deploying ? 'Deploying...' : 'Deploy Bot'}
          </button>
        </div>
      </div>
    </div>
  );
}
