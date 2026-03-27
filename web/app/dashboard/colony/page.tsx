'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Crown, TrendingUp, Zap, RefreshCw, WifiOff } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import { SectionHeader } from '@/app/components/shared/SectionHeader';
import StatusPill from '@/app/components/shared/StatusPill';

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
  url?: string;
  endpoints?: Array<{ slug: string; description: string; price: string }>;
  uptime?: number;
  version?: string;
}

interface ColonyData {
  colony_size: number;
  avg_fitness: number;
  fittest: ColonyAgent;
  cull_queue: number;
  agents: ColonyAgent[];
  root: {
    address: string;
    designation: string | null;
    fitness: { total: number; prediction: number; execution: number } | null;
    wallet_balance: { formatted: string; token: string } | null;
    clone_available: boolean;
    clone_price: string;
    soul: {
      active: boolean;
      dormant: boolean;
      total_cycles: number;
      mode: string;
      active_plan: any;
      free_energy: any;
      brain: any;
      transformer: any;
    };
    colony: any;
  };
}

function FitnessBar({ fitness }: { fitness: number }) {
  const color = fitness >= 80 ? 'bg-emerald-500' : fitness >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(fitness, 100)}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400">{fitness}%</span>
    </div>
  );
}

function AgentLineageNode({ agent, allAgents, depth = 0 }: { agent: ColonyAgent; allAgents: ColonyAgent[]; depth?: number }) {
  const children = allAgents.filter(a => a.parent === agent.walletAddress || a.parent === agent.id);

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-zinc-800 pl-4' : ''}`}>
      <div className="border border-zinc-800 bg-zinc-950 p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${agent.status === 'active' ? 'bg-emerald-500' : agent.status === 'stale' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-sm font-bold text-white">{agent.name}</span>
            <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5">
              Gen {agent.generation}
            </span>
            {agent.version && (
              <span className="text-[10px] font-mono text-zinc-600">v{agent.version}</span>
            )}
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
          {agent.uptime ? (
            <span className="text-[10px] text-zinc-600">
              {Math.round(agent.uptime / 3600)}h uptime
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[9px] font-mono text-zinc-700 truncate">
            {agent.walletAddress}
          </span>
          {agent.endpoints && agent.endpoints.length > 0 && (
            <span className="text-[9px] font-mono text-zinc-600">
              {agent.endpoints.length} endpoint{agent.endpoints.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      {children.map(child => (
        <AgentLineageNode key={child.id} agent={child} allAgents={allAgents} depth={depth + 1} />
      ))}
    </div>
  );
}

function SoulIndicators({ soul }: { soul: ColonyData['root']['soul'] }) {
  if (!soul.active) return null;
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-mono text-blue-400 uppercase">Soul State</span>
        <StatusPill
          status={soul.dormant ? 'idle' : 'active'}
          label={soul.dormant ? 'dormant' : soul.mode}
          size="sm"
        />
      </div>
      <div className="grid grid-cols-5 gap-4 text-[10px] font-mono">
        <div>
          <div className="text-zinc-600 mb-0.5">Cycles</div>
          <div className="text-white">{soul.total_cycles}</div>
        </div>
        {soul.free_energy && (
          <div>
            <div className="text-zinc-600 mb-0.5">Free Energy</div>
            <div className="text-white">F={soul.free_energy.F}</div>
            <div className="text-zinc-500">{soul.free_energy.regime}</div>
          </div>
        )}
        {soul.brain && (
          <div>
            <div className="text-zinc-600 mb-0.5">Brain</div>
            <div className="text-white">{(soul.brain.parameters / 1000).toFixed(0)}K params</div>
            <div className="text-zinc-500">{soul.brain.train_steps} steps</div>
          </div>
        )}
        {soul.transformer && (
          <div>
            <div className="text-zinc-600 mb-0.5">Transformer</div>
            <div className="text-white">{(soul.transformer.param_count / 1000).toFixed(0)}K params</div>
            <div className="text-zinc-500">{soul.transformer.train_steps} steps</div>
          </div>
        )}
        {soul.active_plan && (
          <div>
            <div className="text-zinc-600 mb-0.5">Plan</div>
            <div className="text-white">{soul.active_plan.current_step}/{soul.active_plan.total_steps}</div>
            <div className="text-zinc-500 truncate">{soul.active_plan.current_step_type}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ColonyPage() {
  const [view, setView] = useState<'tree' | 'rank'>('tree');
  const [data, setData] = useState<ColonyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchColony = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/colony/status?action=tree');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColony();
    const interval = setInterval(fetchColony, 30_000);
    return () => clearInterval(interval);
  }, [fetchColony]);

  const action = (
    <div className="flex gap-2">
      <button
        onClick={fetchColony}
        disabled={loading}
        className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 disabled:opacity-50 flex items-center gap-2"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
      <button
        onClick={() => setView('tree')}
        className={`text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 ${
          view === 'tree' ? 'bg-white text-black' : 'border border-zinc-700 hover:border-zinc-500 text-white'
        }`}
      >
        <GitBranch className="w-3 h-3" />Lineage
      </button>
      <button
        onClick={() => setView('rank')}
        className={`text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2 ${
          view === 'rank' ? 'bg-white text-black' : 'border border-zinc-700 hover:border-zinc-500 text-white'
        }`}
      >
        <TrendingUp className="w-3 h-3" />Fitness
      </button>
    </div>
  );

  return (
    <DashboardShell>
      <DashboardHeader title="Colony" icon={<GitBranch className="h-5 w-5 text-emerald-400" />} action={action} />
      <DashboardContent>
        {lastFetch && (
          <div className="mb-4 text-[10px] text-zinc-700 font-mono">
            Updated {lastFetch.toLocaleTimeString()}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">Connecting to soul...</span>
          </div>
        )}
        {error && !data && (
          <div className="flex flex-col items-center justify-center py-20">
            <WifiOff className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-xs text-zinc-500 font-mono mb-2">Soul service offline</p>
            <p className="text-[10px] text-zinc-700 font-mono mb-4">{error}</p>
            <button onClick={fetchColony} className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            <SoulIndicators soul={data.root.soul} />

            {/* Stats */}
            <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Colony Size</div>
                <div className="text-2xl font-bold tracking-tight">{data.colony_size}</div>
                <div className="text-[10px] text-zinc-600">{data.agents.reduce((sum, a) => sum + a.children, 0)} total clones</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Avg Fitness</div>
                <div className="text-2xl font-bold tracking-tight">{data.avg_fitness}%</div>
                <div className="text-[10px] text-zinc-600">colony health</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Fittest</div>
                <div className="text-lg font-bold text-emerald-400">{data.fittest?.name || '—'}</div>
                <div className="text-[10px] text-zinc-600">{data.fittest?.fitness ?? 0}% fitness</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Cull Queue</div>
                <div className="text-2xl font-bold text-red-400">{data.cull_queue}</div>
                <div className="text-[10px] text-zinc-600">below 40% fitness</div>
              </div>
            </div>

            {/* Wallet */}
            {data.root.wallet_balance && (
              <div className="inline-block border border-zinc-800 bg-zinc-950 p-3 mb-6">
                <span className="text-[10px] font-mono text-zinc-600 mr-2 uppercase tracking-widest">Soul Wallet</span>
                <span className="text-sm font-mono text-white">{data.root.wallet_balance.formatted}</span>
                <span className="text-[10px] font-mono text-zinc-400 ml-1">{data.root.wallet_balance.token}</span>
              </div>
            )}

            {/* Content */}
            {view === 'tree' ? (
              <div className="space-y-2">
                <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Lineage Tree</h2>
                {data.agents.filter(a => !a.parent).map(agent => (
                  <AgentLineageNode key={agent.id} agent={agent} allAgents={data.agents} />
                ))}
                {data.agents.length === 0 && (
                  <div className="py-10 text-xs text-zinc-600 font-mono">No agents in colony yet</div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Fitness Ranking</h2>
                <div className="border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-600 border-b border-zinc-800">
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
                        {[...data.agents]
                          .sort((a, b) => b.fitness - a.fitness)
                          .map((agent, i) => (
                            <tr key={agent.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                              <td className="p-3 font-mono text-zinc-400">
                                {i === 0 ? <Crown className="w-4 h-4 text-yellow-500" /> : `#${i + 1}`}
                              </td>
                              <td className="p-3 font-bold">{agent.name}</td>
                              <td className="p-3 font-mono text-zinc-400">{agent.generation}</td>
                              <td className="p-3 text-zinc-400 uppercase text-[10px]">{agent.specialization}</td>
                              <td className="p-3"><FitnessBar fitness={agent.fitness} /></td>
                              <td className="p-3 font-mono text-zinc-400">{agent.children}</td>
                              <td className="p-3">
                                <StatusPill status={agent.status} size="sm" />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
