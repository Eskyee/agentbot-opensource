'use client';

import { useState } from 'react';
import { GitBranch, Crown, Skull, Dna, TrendingUp, Users, Zap } from 'lucide-react';

interface ColonyAgent {
  id: string;
  name: string;
  generation: number;
  fitness: number;
  specialization: string;
  children: number;
  parent: string | null;
  walletAddress: string;
  status: 'active' | 'stale' | 'culling';
  createdAt: string;
}

// Mock data for the colony
const MOCK_COLONY: ColonyAgent[] = [
  { id: 'agent_001', name: 'Atlas Prime', generation: 1, fitness: 92, specialization: 'general', children: 3, parent: null, walletAddress: '0xabc...123', status: 'active', createdAt: '2026-03-15' },
  { id: 'agent_002', name: 'A&R Scout', generation: 2, fitness: 78, specialization: 'ar', children: 1, parent: 'agent_001', walletAddress: '0xdef...456', status: 'active', createdAt: '2026-03-18' },
  { id: 'agent_003', name: 'Promo Bot', generation: 2, fitness: 85, specialization: 'promo', children: 0, parent: 'agent_001', walletAddress: '0xghi...789', status: 'active', createdAt: '2026-03-19' },
  { id: 'agent_004', name: 'Booking Agent', generation: 2, fitness: 45, specialization: 'booking', children: 0, parent: 'agent_001', walletAddress: '0xjkl...012', status: 'stale', createdAt: '2026-03-20' },
  { id: 'agent_005', name: 'Deep Scout', generation: 3, fitness: 61, specialization: 'ar', children: 0, parent: 'agent_002', walletAddress: '0xmno...345', status: 'active', createdAt: '2026-03-21' },
];

function FitnessBar({ fitness }: { fitness: number }) {
  const color = fitness >= 80 ? 'bg-emerald-500' : fitness >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${fitness}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400">{fitness}%</span>
    </div>
  );
}

function AgentLineageNode({ agent, allAgents, depth = 0 }: { agent: ColonyAgent; allAgents: ColonyAgent[]; depth?: number }) {
  const children = allAgents.filter(a => a.parent === agent.id);
  const statusColor = agent.status === 'active' ? 'border-emerald-500/30' : agent.status === 'stale' ? 'border-yellow-500/30' : 'border-red-500/30';
  const statusDot = agent.status === 'active' ? 'bg-emerald-500' : agent.status === 'stale' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-zinc-800 pl-4' : ''}`}>
      <div className={`rounded-lg border ${statusColor} bg-zinc-950 p-3 mb-2`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span className="text-sm font-bold text-white">{agent.name}</span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
              Gen {agent.generation}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600">
            {agent.specialization.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <FitnessBar fitness={agent.fitness} />
          <span className="text-[10px] text-zinc-500">
            {agent.children} {agent.children === 1 ? 'clone' : 'clones'}
          </span>
        </div>
        <div className="mt-1 text-[9px] font-mono text-zinc-700 truncate">
          {agent.walletAddress}
        </div>
      </div>
      {children.map(child => (
        <AgentLineageNode key={child.id} agent={child} allAgents={allAgents} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ColonyPage() {
  const [view, setView] = useState<'tree' | 'rank'>('tree');

  const colony = MOCK_COLONY;
  const rootAgents = colony.filter(a => a.parent === null);
  const totalClones = colony.reduce((sum, a) => sum + a.children, 0);
  const avgFitness = Math.round(colony.reduce((sum, a) => sum + a.fitness, 0) / colony.length);
  const fittest = colony.reduce((best, a) => a.fitness > best.fitness ? a : best, colony[0]);
  const cullCandidates = colony.filter(a => a.fitness < 40);

  return (
    <div className="mt-[4rem] min-h-[calc(100vh-4rem)] bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Colony</h1>
            <p className="text-sm text-zinc-500 font-mono">Agent lineage tree and fitness ranking</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('tree')}
              className={`px-3 py-1.5 text-xs font-mono rounded ${view === 'tree' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              <GitBranch className="w-3 h-3 inline mr-1" />Lineage
            </button>
            <button
              onClick={() => setView('rank')}
              className={`px-3 py-1.5 text-xs font-mono rounded ${view === 'rank' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />Fitness
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Colony Size</div>
            <div className="text-2xl font-black">{colony.length}</div>
            <div className="text-[10px] text-zinc-600">{totalClones} total clones</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Avg Fitness</div>
            <div className="text-2xl font-black">{avgFitness}%</div>
            <div className="text-[10px] text-zinc-600">colony health</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Fittest</div>
            <div className="text-lg font-bold text-emerald-400">{fittest.name}</div>
            <div className="text-[10px] text-zinc-600">{fittest.fitness}% fitness</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Cull Queue</div>
            <div className="text-2xl font-black text-red-400">{cullCandidates.length}</div>
            <div className="text-[10px] text-zinc-600">below 40% fitness</div>
          </div>
        </div>

        {/* Content */}
        {view === 'tree' ? (
          <div className="space-y-2">
            <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">Lineage Tree</h2>
            {rootAgents.map(agent => (
              <AgentLineageNode key={agent.id} agent={agent} allAgents={colony} />
            ))}
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">Fitness Ranking</h2>
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-[10px] font-mono text-zinc-500 uppercase">
                    <th className="text-left p-3">Rank</th>
                    <th className="text-left p-3">Agent</th>
                    <th className="text-left p-3">Gen</th>
                    <th className="text-left p-3">Specialization</th>
                    <th className="text-left p-3">Fitness</th>
                    <th className="text-left p-3">Clones</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...colony]
                    .sort((a, b) => b.fitness - a.fitness)
                    .map((agent, i) => (
                      <tr key={agent.id} className="border-t border-zinc-800/50 hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-zinc-400">
                          {i === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> : `#${i + 1}`}
                        </td>
                        <td className="p-3 font-bold">{agent.name}</td>
                        <td className="p-3 font-mono text-zinc-400">{agent.generation}</td>
                        <td className="p-3 text-zinc-400 uppercase text-xs">{agent.specialization}</td>
                        <td className="p-3"><FitnessBar fitness={agent.fitness} /></td>
                        <td className="p-3 font-mono text-zinc-400">{agent.children}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            agent.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' :
                            agent.status === 'stale' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
