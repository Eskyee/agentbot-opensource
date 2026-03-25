'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Crown, TrendingUp, Zap, RefreshCw, Wifi, WifiOff } from 'lucide-react';

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
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(fitness, 100)}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400">{fitness}%</span>
    </div>
  );
}

function AgentLineageNode({ agent, allAgents, depth = 0 }: { agent: ColonyAgent; allAgents: ColonyAgent[]; depth?: number }) {
  const children = allAgents.filter(a => a.parent === agent.walletAddress || a.parent === agent.id);
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-mono text-blue-400 uppercase">Soul State</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${soul.dormant ? 'bg-yellow-900/30 text-yellow-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
          {soul.dormant ? 'dormant' : soul.mode}
        </span>
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
      <span className="ml-2 text-sm text-zinc-500 font-mono">Connecting to soul...</span>
    </div>
  );
}

function OfflineState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <WifiOff className="w-8 h-8 text-zinc-700 mb-3" />
      <p className="text-sm text-zinc-500 font-mono mb-2">Soul service offline</p>
      <p className="text-[10px] text-zinc-700 font-mono mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 text-xs font-mono bg-zinc-900 text-zinc-400 rounded hover:text-white"
      >
        Retry
      </button>
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
    // Auto-refresh every 30s
    const interval = setInterval(fetchColony, 30_000);
    return () => clearInterval(interval);
  }, [fetchColony]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Colony</h1>
            <p className="text-sm text-zinc-500 font-mono">
              Agent lineage tree and fitness ranking
              {lastFetch && (
                <span className="ml-2 text-zinc-700">
                  · updated {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchColony}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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

        {/* Loading / Error */}
        {loading && !data && <LoadingState />}
        {error && !data && <OfflineState error={error} onRetry={fetchColony} />}

        {data && (
          <>
            {/* Soul State */}
            <SoulIndicators soul={data.root.soul} />

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Colony Size</div>
                <div className="text-2xl font-black">{data.colony_size}</div>
                <div className="text-[10px] text-zinc-600">
                  {data.agents.reduce((sum, a) => sum + a.children, 0)} total clones
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Avg Fitness</div>
                <div className="text-2xl font-black">{data.avg_fitness}%</div>
                <div className="text-[10px] text-zinc-600">colony health</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Fittest</div>
                <div className="text-lg font-bold text-emerald-400">{data.fittest?.name || '—'}</div>
                <div className="text-[10px] text-zinc-600">{data.fittest?.fitness ?? 0}% fitness</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Cull Queue</div>
                <div className="text-2xl font-black text-red-400">{data.cull_queue}</div>
                <div className="text-[10px] text-zinc-600">below 40% fitness</div>
              </div>
            </div>

            {/* Wallet Balance */}
            {data.root.wallet_balance && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 mb-6 inline-block">
                <span className="text-[10px] font-mono text-zinc-500 mr-2">Soul Wallet:</span>
                <span className="text-sm font-mono text-white">{data.root.wallet_balance.formatted}</span>
                <span className="text-[10px] font-mono text-zinc-400 ml-1">{data.root.wallet_balance.token}</span>
              </div>
            )}

            {/* Content */}
            {view === 'tree' ? (
              <div className="space-y-2">
                <h2 className="text-xs font-mono text-zinc-500 uppercase mb-4">Lineage Tree</h2>
                {data.agents.filter(a => !a.parent).map(agent => (
                  <AgentLineageNode key={agent.id} agent={agent} allAgents={data.agents} />
                ))}
                {data.agents.length === 0 && (
                  <div className="text-center py-10 text-zinc-600 text-sm font-mono">
                    No agents in colony yet
                  </div>
                )}
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
                      {[...data.agents]
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
          </>
        )}
      </div>
    </div>
  );
}
