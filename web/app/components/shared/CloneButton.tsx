'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  specialization: string;
  generation: number;
  fitness: number;
  children: number;
  walletAddress: string;
}

interface CloneButtonProps {
  agent: Agent;
  onSuccess?: (newAgent: Agent) => void;
}

export function CloneButton({ agent, onSuccess }: CloneButtonProps) {
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [specialization, setSpecialization] = useState('general');

  const handleClone = async () => {
    if (!cloneName.trim()) {
      setError('Name is required');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Step 1: Execute payment on Tempo
      // In production, this would use the user's connected wallet
      // For now, simulate the payment proof
      const paymentProof = {
        transactionHash: `0x${Math.random().toString(16).slice(2)}`,
        amount: '1.0',
        currency: 'pathUSD',
        chainId: 4217,
        from: agent.walletAddress,
        to: '0x0000000000000000000000000000000000000000',
        timestamp: Date.now(),
      };

      // Step 2: Submit clone request
      const response = await fetch('/api/agents/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentAgentId: agent.id,
          name: cloneName,
          specialization,
          paymentProof,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Clone failed');
      }

      onSuccess?.(data);
      setShowForm(false);
      setCloneName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setIsCloning(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/10 border border-emerald-600/30 px-4 py-2 text-sm font-mono text-emerald-400 hover:bg-emerald-600/20 transition-colors"
      >
        <span>🧬</span>
        <span>Clone — $1 pathUSD</span>
        <span className="text-emerald-600 text-xs">(Gen {agent.generation})</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-mono text-zinc-300">Clone: {agent.name}</h4>
        <button
          onClick={() => setShowForm(false)}
          className="text-zinc-600 hover:text-zinc-400 text-xs"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-zinc-500 font-mono">Name</label>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            placeholder={`${agent.name}-clone`}
            className="w-full mt-1 rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white font-mono focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-mono">Specialization</label>
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full mt-1 rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-white font-mono focus:border-emerald-600 focus:outline-none"
          >
            <option value="general">General</option>
            <option value="ar">A&R Scout</option>
            <option value="promo">Promo Agent</option>
            <option value="booking">Booking Agent</option>
            <option value="support">Support Agent</option>
            <option value="analytics">Analytics Agent</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-900/20 border border-red-900/30 px-3 py-2 text-xs text-red-400 font-mono">
          {error}
        </div>
      )}

      <button
        onClick={handleClone}
        disabled={isCloning}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isCloning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⚡</span>
            Spawning clone...
          </span>
        ) : (
          `Pay $1 pathUSD & Clone →`
        )}
      </button>

      <p className="text-[10px] text-zinc-600 font-mono">
        Parent: {agent.id.slice(0, 12)}… · Gen {agent.generation} → Gen {agent.generation + 1}
      </p>
    </div>
  );
}
