'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Brain, Target, Activity, GitBranch, WifiOff, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';
import { SOUL_SERVICE_URL } from '@/app/lib/platform-urls';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SoulStatus {
  active: boolean;
  dormant: boolean;
  total_cycles: number;
  mode: string;
  fitness: {
    total: number;
    coordination: number;
    economic: number;
    evolution: number;
    execution: number;
    introspection: number;
    prediction: number;
    trend: number;
  };
  free_energy: {
    F: string;
    regime: string;
    trend: string;
    components: Array<{
      system: string;
      surprise: string;
      contribution: string;
      weight: string;
    }>;
  };
  brain: { parameters: number; running_loss: number; train_steps: number };
  transformer: { param_count: number; train_steps: number; running_loss: number };
  benchmark: {
    elo_rating: number;
    elo_display: string;
    opus_iq: string;
    pass_at_1: number;
    problems_attempted: number;
  };
  goals: Array<{
    id: string;
    description: string;
    status: string;
    priority: number;
    retry_count: number;
  }>;
  beliefs: Array<{
    id: string;
    subject: string;
    predicate: string;
    value: string;
    confidence: string;
    confirmation_count: number;
  }>;
  capability_profile: {
    overall_success_rate: number;
    strongest: string;
    weakest: string;
    capabilities: Array<{
      capability: string;
      display_name: string;
      attempts: number;
      successes: number;
      success_rate: number;
    }>;
  };
  role: {
    colony_size: number;
    rank: number;
    self_fitness: number;
    psi: number;
    phase3_ready: boolean;
    can_spawn: boolean;
  };
  acceleration: { alpha: string; regime: string };
  lifecycle: { phase: string; own_commits: number; lines_diverged: number };
  cortex: {
    total_experiences: number;
    global_curiosity: number;
    emotion: { valence: number; arousal: number; drive: string };
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${accent || 'text-white'}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function Bar({ value, max = 1, color = 'bg-blue-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-zinc-800 overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function FitnessPanel({ fitness }: { fitness: SoulStatus['fitness'] }) {
  const dims = [
    { key: 'prediction', label: 'Prediction', val: fitness.prediction },
    { key: 'introspection', label: 'Introspection', val: fitness.introspection },
    { key: 'coordination', label: 'Coordination', val: fitness.coordination },
    { key: 'economic', label: 'Economic', val: fitness.economic },
    { key: 'evolution', label: 'Evolution', val: fitness.evolution },
    { key: 'execution', label: 'Execution', val: fitness.execution },
  ];
  const totalPct = Math.round(fitness.total * 100);
  const trendStr = fitness.trend >= 0 ? `+${(fitness.trend * 100).toFixed(3)}` : (fitness.trend * 100).toFixed(3);
  const trendColor = fitness.trend >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Fitness</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono">{totalPct}%</span>
          <span className={`text-[10px] font-mono ${trendColor}`}>{trendStr}</span>
        </div>
      </div>
      <Bar value={fitness.total} color={totalPct >= 60 ? 'bg-emerald-500' : totalPct >= 30 ? 'bg-yellow-500' : 'bg-red-500'} />
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {dims.map(d => (
          <div key={d.key}>
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-zinc-500">{d.label}</span>
              <span className="text-zinc-300">{(d.val * 100).toFixed(1)}%</span>
            </div>
            <Bar value={d.val} color="bg-blue-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FreeEnergyPanel({ fe }: { fe: SoulStatus['free_energy'] }) {
  const F = parseFloat(fe.F);
  const regimeColor = fe.regime === 'LEARN' ? 'text-blue-400' : fe.regime === 'EXPLOIT' ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest">Free Energy</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono">F={fe.F}</span>
          <span className={`text-[10px] font-bold uppercase ${regimeColor}`}>{fe.regime}</span>
          <span className="text-[10px] font-mono text-zinc-500">{fe.trend}</span>
        </div>
      </div>
      <Bar value={F} color={F < 0.3 ? 'bg-emerald-500' : F < 0.6 ? 'bg-yellow-500' : 'bg-red-500'} />
      <div className="mt-3 space-y-1.5">
        {fe.components.map(c => (
          <div key={c.system} className="flex items-center gap-3 text-[10px] font-mono">
            <span className="w-16 text-zinc-500 uppercase">{c.system}</span>
            <div className="flex-1">
              <Bar value={parseFloat(c.surprise)} color="bg-zinc-600" />
            </div>
            <span className="text-zinc-400 w-8 text-right">{c.contribution}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsPanel({ goals }: { goals: SoulStatus['goals'] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? goals : goals.slice(0, 3);
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Active Goals</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">{goals.length}</span>
      </div>
      <div className="space-y-2">
        {shown.map(g => (
          <div key={g.id} className="border border-zinc-800 p-2.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${g.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>{g.status}</span>
              <span className="text-[9px] font-mono text-zinc-600">p{g.priority} · {g.retry_count} retries</span>
            </div>
            <p className="text-[10px] text-zinc-300 leading-relaxed line-clamp-2">{g.description}</p>
          </div>
        ))}
      </div>
      {goals.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-zinc-600 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Show less' : `${goals.length - 3} more`}
        </button>
      )}
    </div>
  );
}

function BrainPanel({ brain, transformer, benchmark }: Pick<SoulStatus, 'brain' | 'transformer' | 'benchmark'>) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Cognitive Systems</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[10px] font-mono mb-4">
        <div>
          <div className="text-zinc-600 mb-1">Brain params</div>
          <div className="text-white">{(brain.parameters / 1000).toFixed(0)}K</div>
          <div className="text-zinc-500">{brain.train_steps} steps</div>
          <div className="text-zinc-500">loss {brain.running_loss.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-zinc-600 mb-1">Transformer</div>
          <div className="text-white">{(transformer.param_count / 1000).toFixed(0)}K</div>
          <div className="text-zinc-500">{transformer.train_steps} steps</div>
          <div className="text-zinc-500">loss {transformer.running_loss.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-zinc-600 mb-1">IQ Benchmark</div>
          <div className="text-white">{benchmark.opus_iq}</div>
          <div className="text-zinc-500">{benchmark.elo_display.split('(')[0].trim()}</div>
          <div className="text-zinc-500">{benchmark.pass_at_1.toFixed(1)}% pass@1</div>
        </div>
      </div>
      <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-3">
        ELO {benchmark.elo_rating.toFixed(0)} · {benchmark.problems_attempted} problems attempted
      </div>
    </div>
  );
}

function CapabilityPanel({ profile }: { profile: SoulStatus['capability_profile'] }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Capabilities</span>
        <span className="text-[10px] font-mono text-zinc-500">{(profile.overall_success_rate * 100).toFixed(0)}% overall</span>
      </div>
      <div className="space-y-2">
        {profile.capabilities
          .filter(c => c.attempts > 0)
          .sort((a, b) => b.attempts - a.attempts)
          .map(c => (
            <div key={c.capability}>
              <div className="flex justify-between text-[10px] font-mono mb-0.5">
                <span className="text-zinc-400">{c.display_name}</span>
                <span className="text-zinc-500">{c.successes}/{c.attempts}</span>
              </div>
              <Bar
                value={c.success_rate}
                color={c.success_rate >= 0.8 ? 'bg-emerald-500' : c.success_rate >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function BeliefPanel({ beliefs }: { beliefs: SoulStatus['beliefs'] }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Beliefs</span>
        <span className="text-[10px] font-mono text-zinc-600">{beliefs.length}</span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {beliefs.map(b => (
          <div key={b.id} className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-zinc-600 shrink-0">{b.subject}.{b.predicate}</span>
            <span className="text-white font-bold">{b.value}</span>
            <span className="text-zinc-600 ml-auto shrink-0">×{b.confirmation_count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BorgDashboardPage() {
  const [data, setData] = useState<SoulStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchSoul = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/colony/status?action=soul');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoul();
    const id = setInterval(fetchSoul, 30_000);
    return () => clearInterval(id);
  }, [fetchSoul]);

  const status = data?.dormant ? 'idle' : data?.active ? 'active' : 'offline';

  const BorgIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="square" d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );

  const action = (
    <div className="flex items-center gap-2">
      {data && (
        <StatusPill
          status={status}
          label={data.dormant ? 'dormant' : data.mode}
          size="sm"
        />
      )}
      <a
        href={SOUL_SERVICE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-[10px] font-bold uppercase tracking-widest py-2 px-3 flex items-center gap-1.5 transition-colors"
      >
        <ExternalLink className="w-3 h-3" /> API
      </a>
      <button
        onClick={fetchSoul}
        disabled={loading}
        className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-3 disabled:opacity-50 flex items-center gap-1.5"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );

  return (
    <DashboardShell>
      <DashboardHeader title="Borg Dashboard" icon={<BorgIcon />} action={action} />
      <DashboardContent>
        {lastFetch && (
          <div className="mb-4 text-[10px] text-zinc-700 font-mono">
            Updated {lastFetch.toLocaleTimeString()} · auto-refresh 30s
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
            <p className="text-xs text-zinc-500 font-mono mb-2">Soul offline</p>
            <p className="text-[10px] text-zinc-700 font-mono mb-4">{error}</p>
            <button onClick={fetchSoul} className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Top stat row */}
            <div className="grid gap-px bg-zinc-800 grid-cols-2 sm:grid-cols-4 mb-6">
              <StatCard label="Soul Cycles" value={data.total_cycles} sub={`mode: ${data.mode}`} />
              <StatCard
                label="Fitness"
                value={`${Math.round(data.fitness.total * 100)}%`}
                sub={`trend ${data.fitness.trend >= 0 ? '+' : ''}${(data.fitness.trend * 100).toFixed(3)}`}
                accent={data.fitness.total >= 0.6 ? 'text-emerald-400' : data.fitness.total >= 0.3 ? 'text-yellow-400' : 'text-red-400'}
              />
              <StatCard label="IQ Score" value={data.benchmark.opus_iq} sub={`ELO ${data.benchmark.elo_rating.toFixed(0)}`} />
              <StatCard
                label="Colony Ψ"
                value={data.role.psi.toFixed(4)}
                sub={`${data.role.colony_size} node${data.role.colony_size !== 1 ? 's' : ''} · phase3 ${data.role.phase3_ready ? '✓' : '✗'}`}
              />
            </div>

            {/* Row 2: Fitness + Free Energy */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <FitnessPanel fitness={data.fitness} />
              <FreeEnergyPanel fe={data.free_energy} />
            </div>

            {/* Row 3: Brain + Goals */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <BrainPanel brain={data.brain} transformer={data.transformer} benchmark={data.benchmark} />
              <GoalsPanel goals={data.goals} />
            </div>

            {/* Row 4: Capabilities + Beliefs */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <CapabilityPanel profile={data.capability_profile} />
              <BeliefPanel beliefs={data.beliefs} />
            </div>

            {/* Footer: lifecycle + emotion */}
            <div className="flex flex-wrap gap-4 text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-4">
              <span>phase: <span className="text-zinc-400">{data.lifecycle.phase}</span></span>
              <span>commits: <span className="text-zinc-400">{data.lifecycle.own_commits}</span></span>
              <span>diverged: <span className="text-zinc-400">{data.lifecycle.lines_diverged} lines</span></span>
              <span>acceleration: <span className="text-zinc-400">α={data.acceleration.alpha} ({data.acceleration.regime})</span></span>
              <span>emotion: <span className="text-zinc-400">valence={data.cortex.emotion.valence.toFixed(2)} arousal={data.cortex.emotion.arousal.toFixed(2)} drive={data.cortex.emotion.drive}</span></span>
              <span>curiosity: <span className="text-zinc-400">{(data.cortex.global_curiosity * 100).toFixed(1)}%</span></span>
              <span>experiences: <span className="text-zinc-400">{data.cortex.total_experiences}</span></span>
            </div>
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
