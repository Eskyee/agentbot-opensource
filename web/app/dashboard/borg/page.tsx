'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import {
  RefreshCw,
  Zap,
  Brain,
  Target,
  Activity,
  WifiOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wallet,
  Copy,
  Check,
  GitBranch,
  Radio,
  Cpu,
  Flame,
  Layers,
  MessageSquare,
  Send,
  Sparkles,
  BarChart2,
  AlertTriangle,
  BookOpen,
  Bug,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';
import { SOUL_SERVICE_URL } from '@/app/lib/platform-urls';
import type { SoulStatus as CoreSoulStatus, Diagnostics as CoreDiagnostics } from '@/lib/soul';

// ─── Types ────────────────────────────────────────────────────────────────────
// Canonical SoulStatus comes from lib/soul.ts (single source of truth, all
// nested objects are nullable). The Borg dashboard receives a few extras the
// soul service returns but the lib type doesn't yet expose — declared here
// as optional so any drift is a compile-time issue, not a runtime crash.

type SoulStatus = CoreSoulStatus & {
  soulUrl?: string;
  benchmark?: {
    elo_rating: number;
    elo_display: string;
    opus_iq: string;
    pass_at_1: number;
    problems_attempted: number;
  } | null;
  capability_profile?: {
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
  } | null;
  acceleration?: { alpha: string; regime: string } | null;
  // role/lifecycle extras the page renders that aren't in the canonical type
  role:
    | (CoreSoulStatus['role'] & {
        self_fitness?: number;
        psi?: number;
        phase3_ready?: boolean;
      })
    | null;
};

type Diagnostics = Partial<CoreDiagnostics> & {
  recommendations?: string[];
};

type Goal = NonNullable<CoreSoulStatus['goals']>[number];
type Belief = NonNullable<CoreSoulStatus['beliefs']>[number];
type Thought = NonNullable<CoreSoulStatus['recent_thoughts']>[number];
type Capability = NonNullable<
  NonNullable<SoulStatus['capability_profile']>['capabilities']
>[number];
type FEComponent = NonNullable<NonNullable<CoreSoulStatus['free_energy']>['components']>[number] & {
  contribution?: string;
};

const EMPTY_FITNESS = {
  total: 0,
  coordination: 0,
  economic: 0,
  evolution: 0,
  execution: 0,
  introspection: 0,
  prediction: 0,
  trend: 0,
  measured_at: 0,
} as const;

// ─── Utilities ─────────────────────────────────────────────────────────────────

function useDelta(val: number | undefined): 'up' | 'down' | 'flat' {
  const prev = useRef<number | undefined>(undefined);
  const [dir, setDir] = useState<'up' | 'down' | 'flat'>('flat');
  useEffect(() => {
    if (val === undefined) return;
    if (prev.current !== undefined && val !== prev.current) {
      setDir(val > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setDir('flat'), 2000);
      prev.current = val;
      return () => clearTimeout(t);
    }
    prev.current = val;
  }, [val]);
  return dir;
}

function DeltaArrow({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up') return <TrendingUp className="w-3 h-3 text-emerald-400 inline ml-1" />;
  if (dir === 'down') return <TrendingDown className="w-3 h-3 text-red-400 inline ml-1" />;
  return <Minus className="w-3 h-3 text-zinc-500 inline ml-1" />;
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function Bar({
  value,
  max = 1,
  color = 'bg-orange-500',
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-zinc-800 overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectionLabel({
  icon,
  label,
  color = 'text-zinc-400',
  count,
}: {
  icon: ReactNode;
  label: string;
  color?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className={`text-[10px] font-mono uppercase tracking-widest ${color}`}>{label}</span>
      </div>
      {count !== undefined && <span className="text-[10px] font-mono text-zinc-500">{count}</span>}
    </div>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border border-zinc-800 bg-zinc-950 p-4 ${className}`}>{children}</div>;
}

// ─── Stat Cards ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  delta?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold font-mono tracking-tight ${
          accent || 'text-white'
        } flex items-center gap-1`}
      >
        {value}
        {delta && <DeltaArrow dir={delta} />}
      </div>
      {sub && <div className="text-[10px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

function FitnessPanel({ fitness }: { fitness: SoulStatus['fitness'] }) {
  if (!fitness) return null;
  const dims = [
    { key: 'prediction', label: 'Prediction', val: fitness.prediction },
    { key: 'introspection', label: 'Introspection', val: fitness.introspection },
    { key: 'coordination', label: 'Coordination', val: fitness.coordination },
    { key: 'economic', label: 'Economic', val: fitness.economic },
    { key: 'evolution', label: 'Evolution', val: fitness.evolution },
    { key: 'execution', label: 'Execution', val: fitness.execution },
  ];
  const totalPct = Math.round(fitness.total * 100);
  const trendStr =
    fitness.trend >= 0 ? `+${(fitness.trend * 100).toFixed(3)}` : (fitness.trend * 100).toFixed(3);
  const trendColor = fitness.trend >= 0 ? 'text-emerald-400' : 'text-red-400';
  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            Fitness
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono">{totalPct}%</span>
          <span className={`text-[10px] font-mono ${trendColor}`}>{trendStr}</span>
        </div>
      </div>
      <Bar
        value={fitness.total}
        color={
          totalPct >= 60 ? 'bg-emerald-500' : totalPct >= 30 ? 'bg-yellow-500' : 'bg-orange-500'
        }
      />
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {dims.map((d) => (
          <div key={d.key}>
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-zinc-500">{d.label}</span>
              <span className="text-zinc-300">{(d.val * 100).toFixed(1)}%</span>
            </div>
            <Bar value={d.val} color="bg-orange-500" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Free Energy ──────────────────────────────────────────────────────────────

function FreeEnergyPanel({ fe }: { fe: SoulStatus['free_energy'] }) {
  if (!fe) return null;
  const F = parseFloat(fe.F);
  const regimeColor =
    fe.regime === 'LEARN'
      ? 'text-orange-400'
      : fe.regime === 'EXPLOIT'
        ? 'text-emerald-400'
        : 'text-amber-400';
  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest">
            Free Energy
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono">F={fe.F}</span>
          <span className={`text-[10px] font-bold uppercase ${regimeColor}`}>{fe.regime}</span>
          <span className="text-[10px] font-mono text-zinc-500">{fe.trend}</span>
        </div>
      </div>
      <Bar
        value={F}
        color={F < 0.3 ? 'bg-emerald-500' : F < 0.6 ? 'bg-yellow-500' : 'bg-orange-500'}
      />
      <div className="mt-3 space-y-1.5">
        {((fe.components ?? []) as FEComponent[]).map((c) => (
          <div key={c.instructions} className="flex items-center gap-3 text-[10px] font-mono">
            <span className="w-16 text-zinc-500 uppercase">{c.instructions}</span>
            <div className="flex-1">
              <Bar value={parseFloat(c.surprise)} color="bg-zinc-600" />
            </div>
            <span className="text-zinc-400 w-8 text-right">{c.contribution ?? c.weight}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Active Plan ──────────────────────────────────────────────────────────────

function ActivePlanPanel({
  plan,
  goals,
}: {
  plan: SoulStatus['active_plan'];
  goals: SoulStatus['goals'];
}) {
  if (!plan) {
    return (
      <Panel>
        <SectionLabel
          icon={<Layers className="w-3 h-3" />}
          label="Active Plan"
          color="text-zinc-500"
        />
        <p className="text-[10px] font-mono text-zinc-500 text-center py-4">No active plan</p>
      </Panel>
    );
  }
  const goal = goals.find((g) => g.id === plan.goal_id);
  const pct = plan.total_steps > 0 ? Math.round((plan.current_step / plan.total_steps) * 100) : 0;
  const statusColor =
    plan.status === 'executing'
      ? 'text-emerald-400'
      : plan.status === 'failed'
        ? 'text-red-400'
        : 'text-amber-400';
  return (
    <Panel>
      <SectionLabel
        icon={<Layers className="w-3 h-3" />}
        label="Active Plan"
        color="text-emerald-400"
      />
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className={`font-bold uppercase ${statusColor}`}>{plan.status}</span>
          <span className="text-zinc-500">
            step {plan.current_step}/{plan.total_steps} · {pct}%
          </span>
        </div>
        <Bar
          value={plan.current_step}
          max={Math.max(plan.total_steps, 1)}
          color={plan.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}
        />
      </div>
      {goal && (
        <p className="text-[10px] text-zinc-300 leading-relaxed mb-2 line-clamp-2">
          {goal.description}
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-zinc-500">
        {plan.current_step_type && (
          <span>
            type: <span className="text-zinc-400">{plan.current_step_type}</span>
          </span>
        )}
        <span>
          replans:{' '}
          <span className={plan.replan_count > 2 ? 'text-amber-400' : 'text-zinc-400'}>
            {plan.replan_count}
          </span>
        </span>
        {plan.context &&
          Object.entries(plan.context)
            .slice(0, 2)
            .map(([k, v]) => (
              <span key={k}>
                {k}:{' '}
                <span className="text-zinc-400 truncate max-w-[8rem] inline-block align-bottom">
                  {v}
                </span>
              </span>
            ))}
      </div>
    </Panel>
  );
}

// ─── Cycle Health ─────────────────────────────────────────────────────────────

function CycleHealthPanel({ health }: { health: SoulStatus['cycle_health'] }) {
  if (!health) return null;
  const successRate =
    health.completed_plans_count + health.failed_plans_count > 0
      ? Math.round(
          (health.completed_plans_count /
            (health.completed_plans_count + health.failed_plans_count)) *
            100
        )
      : 0;
  const stagnant = health.cycles_since_last_commit > 10;
  return (
    <Panel>
      <SectionLabel
        icon={<BarChart2 className="w-3 h-3" />}
        label="Cycle Health"
        color="text-blue-400"
      />
      <div className="grid grid-cols-3 gap-3 text-[10px] font-mono mb-3">
        <div>
          <div className="text-zinc-500 mb-0.5">Plans done</div>
          <div className="text-emerald-400 font-bold text-base">{health.completed_plans_count}</div>
        </div>
        <div>
          <div className="text-zinc-500 mb-0.5">Failed</div>
          <div className="text-red-400 font-bold text-base">{health.failed_plans_count}</div>
        </div>
        <div>
          <div className="text-zinc-500 mb-0.5">Success</div>
          <div
            className={`font-bold text-base ${
              successRate >= 60
                ? 'text-emerald-400'
                : successRate >= 30
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {successRate}%
          </div>
        </div>
      </div>
      <div className="space-y-1 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Cycles since commit</span>
          <span className={stagnant ? 'text-amber-400' : 'text-zinc-400'}>
            {health.cycles_since_last_commit} {stagnant ? '⚠' : ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Goals active</span>
          <span className="text-zinc-400">{health.goals_active}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Entered code</span>
          <span className={health.last_cycle_entered_code ? 'text-emerald-400' : 'text-zinc-500'}>
            {health.last_cycle_entered_code ? 'yes' : 'no'} · {health.total_code_entries} total
          </span>
        </div>
      </div>
    </Panel>
  );
}

// ─── Thought Stream ───────────────────────────────────────────────────────────

const THOUGHT_COLORS: Record<string, string> = {
  plan: 'text-orange-400 border-orange-800',
  execute: 'text-emerald-400 border-emerald-800',
  reflect: 'text-blue-400 border-blue-800',
  learn: 'text-amber-400 border-amber-800',
  goal: 'text-orange-400 border-orange-800',
  error: 'text-red-400 border-red-800',
};

function ThoughtStreamPanel({ thoughts }: { thoughts: SoulStatus['recent_thoughts'] }) {
  const list = (thoughts ?? []).slice(0, 8);
  if (list.length === 0) return null;
  return (
    <Panel>
      <SectionLabel
        icon={<Radio className="w-3 h-3" />}
        label="Thought Stream"
        color="text-orange-400"
        count={list.length}
      />
      <div className="space-y-2">
        {list.map((t, i) => {
          const colors = THOUGHT_COLORS[t.type] ?? 'text-zinc-400 border-zinc-700';
          const [textColor, borderColor] = colors.split(' ');
          const ts = new Date(t.created_at * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return (
            <div key={i} className={`border-l-2 ${borderColor} pl-2`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${textColor}`}>
                  {t.type}
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{ts}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{t.content}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ─── Brain ────────────────────────────────────────────────────────────────────

function BrainPanel({
  brain,
  transformer,
  benchmark,
}: Pick<SoulStatus, 'brain' | 'transformer' | 'benchmark'>) {
  if (!brain || !transformer || !benchmark) return null;
  return (
    <Panel>
      <SectionLabel
        icon={<Brain className="w-3 h-3" />}
        label="Cognitive Systems"
        color="text-orange-400"
      />
      <div className="grid grid-cols-3 gap-3 text-[10px] font-mono mb-4">
        <div>
          <div className="text-zinc-500 mb-1">Brain params</div>
          <div className="text-white">{(brain.parameters / 1000).toFixed(0)}K</div>
          <div className="text-zinc-500">{brain.train_steps} steps</div>
          <div className="text-zinc-500">loss {brain.running_loss.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-zinc-500 mb-1">Transformer</div>
          <div className="text-white">{(transformer.param_count / 1000).toFixed(0)}K</div>
          <div className="text-zinc-500">{transformer.train_steps} steps</div>
          <div className="text-zinc-500">loss {transformer.running_loss.toFixed(3)}</div>
          {transformer.plans_generated !== undefined && (
            <div className="text-zinc-500">{transformer.plans_generated} plans</div>
          )}
        </div>
        <div>
          <div className="text-zinc-500 mb-1">IQ Benchmark</div>
          <div className="text-white">{benchmark.opus_iq}</div>
          <div className="text-zinc-500">{benchmark.elo_display.split('(')[0].trim()}</div>
          <div className="text-zinc-500">{benchmark.pass_at_1.toFixed(1)}% pass@1</div>
        </div>
      </div>
      <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-900 pt-3">
        ELO {benchmark.elo_rating.toFixed(0)} · {benchmark.problems_attempted} problems attempted
      </div>
    </Panel>
  );
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function GoalsPanel({ goals }: { goals: SoulStatus['goals'] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? goals : goals.slice(0, 3);
  return (
    <Panel>
      <SectionLabel
        icon={<Target className="w-3 h-3" />}
        label="Active Goals"
        color="text-orange-400"
        count={goals.length}
      />
      <div className="space-y-2">
        {shown.map((g) => (
          <div key={g.id} className="border border-zinc-800 p-2.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${
                  g.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                {g.status}
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                p{g.priority} · {g.retry_count} retries
              </span>
            </div>
            <p className="text-[10px] text-zinc-300 leading-relaxed line-clamp-2">
              {g.description}
            </p>
          </div>
        ))}
      </div>
      {goals.length > 3 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Show less' : `${goals.length - 3} more`}
        </button>
      )}
    </Panel>
  );
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

function CapabilityPanel({ profile }: { profile: SoulStatus['capability_profile'] }) {
  const sortedCaps = useMemo(
    () =>
      (profile?.capabilities ?? [])
        .filter((c) => c.attempts > 0)
        .sort((a, b) => b.attempts - a.attempts),
    [profile?.capabilities]
  );
  if (!profile) return null;
  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
          Capabilities
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          {(profile.overall_success_rate * 100).toFixed(0)}% overall
        </span>
      </div>
      <div className="space-y-2">
        {sortedCaps.map((c) => (
          <div key={c.capability}>
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-zinc-400">{c.display_name}</span>
              <span className="text-zinc-500">
                {c.successes}/{c.attempts}
              </span>
            </div>
            <Bar
              value={c.success_rate}
              color={
                c.success_rate >= 0.8
                  ? 'bg-emerald-500'
                  : c.success_rate >= 0.4
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
              }
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Beliefs ──────────────────────────────────────────────────────────────────

function BeliefPanel({ beliefs }: { beliefs: SoulStatus['beliefs'] }) {
  return (
    <Panel>
      <SectionLabel
        icon={<BookOpen className="w-3 h-3" />}
        label="Beliefs"
        color="text-zinc-400"
        count={beliefs.length}
      />
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {beliefs.map((b) => (
          <div key={b.id} className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-zinc-500 shrink-0">
              {b.subject}.{b.predicate}
            </span>
            <span className="text-white font-bold">{b.value}</span>
            <span className="text-zinc-500 ml-auto shrink-0">×{b.confirmation_count}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Genesis ──────────────────────────────────────────────────────────────────

function GenesisPanel({ genesis }: { genesis: SoulStatus['genesis'] }) {
  if (!genesis) return null;
  return (
    <Panel>
      <SectionLabel
        icon={<Sparkles className="w-3 h-3" />}
        label="Genesis Templates"
        color="text-amber-400"
        count={genesis.templates}
      />
      <div className="text-[10px] font-mono text-zinc-500 mb-3">
        gen {genesis.generation} · {genesis.total_created} total created
      </div>
      <div className="space-y-2">
        {(genesis.top_templates ?? []).slice(0, 4).map((t) => (
          <div key={t.id} className="border border-zinc-800 p-2">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span className="text-amber-400">{t.fitness} fit</span>
              <span className="text-zinc-500">
                {t.success_rate} success · {t.steps} steps
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1">{t.goal_summary}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Hivemind ─────────────────────────────────────────────────────────────────

function HivemindPanel({
  hivemind,
  synthesis,
}: {
  hivemind: SoulStatus['hivemind'];
  synthesis: SoulStatus['synthesis'];
}) {
  if (!hivemind && !synthesis) return null;
  return (
    <Panel>
      <SectionLabel
        icon={<Cpu className="w-3 h-3" />}
        label="Hivemind & Synthesis"
        color="text-cyan-400"
      />
      {hivemind && (
        <div className="grid grid-cols-3 gap-3 text-[10px] font-mono mb-3">
          <div>
            <div className="text-zinc-500 mb-0.5">Trails</div>
            <div className="text-cyan-400 font-bold">{hivemind.total_trails}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-0.5">Deposits</div>
            <div className="text-white">{hivemind.total_deposits}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-0.5">Swarm Intel</div>
            <div className="text-white">{(hivemind.swarm_intel ?? 0).toFixed(3)}</div>
          </div>
        </div>
      )}
      {synthesis && (
        <div className="text-[10px] font-mono space-y-1 border-t border-zinc-900 pt-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Synthesis state</span>
            <span className="text-cyan-400 uppercase">{synthesis.state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Predictions</span>
            <span className="text-zinc-400">{synthesis.total_predictions}</span>
          </div>
          <div className="flex gap-3 flex-wrap pt-1">
            {Object.entries(synthesis.weights).map(([k, v]) => (
              <span key={k} className="text-zinc-500">
                {k}: <span className="text-zinc-400">{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

function DiagnosticsPanel({ diag }: { diag: Diagnostics | null }) {
  if (!diag) return null;
  const overview = diag.overview ?? {
    success_rate: '—',
    completed: 0,
    failed: 0,
    total_outcomes: 0,
  };
  const stagnation = diag.stagnation ?? {
    risk_level: 'unknown',
    cycles_since_commit: 0,
    cycles_until_reset: 0,
  };
  const recommendations = diag.recommendations ?? [];
  const riskColor =
    stagnation.risk_level === 'high'
      ? 'text-red-400'
      : stagnation.risk_level === 'medium'
        ? 'text-amber-400'
        : 'text-emerald-400';
  return (
    <Panel>
      <SectionLabel icon={<Bug className="w-3 h-3" />} label="Diagnostics" color="text-red-400" />
      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono mb-3">
        <div>
          <div className="text-zinc-500 mb-0.5">Outcome success</div>
          <div className="text-white font-bold">{overview.success_rate}</div>
          <div className="text-zinc-500">
            {overview.completed}/{overview.total_outcomes}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 mb-0.5">Stagnation risk</div>
          <div className={`font-bold uppercase ${riskColor}`}>{stagnation.risk_level}</div>
          <div className="text-zinc-500">{stagnation.cycles_until_reset} cycles left</div>
        </div>
      </div>
      {diag.capability_bottleneck && (
        <div className="border border-amber-900/40 bg-amber-950/20 p-2 mb-3 text-[10px] font-mono">
          <div className="flex items-center gap-1 text-amber-400 mb-0.5">
            <AlertTriangle className="w-3 h-3" /> bottleneck
          </div>
          <span className="text-zinc-300">{diag.capability_bottleneck.capability}</span>
          <span className="text-zinc-500 ml-2">
            {diag.capability_bottleneck.success_rate} · {diag.capability_bottleneck.attempts}{' '}
            attempts
          </span>
        </div>
      )}
      {recommendations.length > 0 && (
        <ul className="space-y-1">
          {recommendations.map((r, i) => (
            <li key={i} className="text-[10px] text-zinc-400 flex gap-2 leading-relaxed">
              <span className="text-zinc-500 shrink-0">→</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

function WalletPanel({
  address,
  designation,
  balance,
}: {
  address: string;
  designation: string | null;
  balance: { formatted: string; token: string } | null;
}) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* blocked */
    }
  };
  return (
    <Panel className="mb-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            Borg Wallet
          </span>
          {designation && (
            <span className="text-[10px] font-mono text-zinc-500 truncate">· {designation}</span>
          )}
          <span className="text-[10px] font-mono text-zinc-500">· Tempo network</span>
        </div>
        {balance && (
          <span className="text-[10px] font-mono text-zinc-300">
            {balance.formatted} <span className="text-zinc-500">{balance.token}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-[11px] font-mono text-zinc-300 bg-black/40 border border-zinc-800 px-2 py-1.5 break-all select-all"
          title={address}
        >
          <span className="hidden sm:inline">{address}</span>
          <span className="sm:hidden">{short}</span>
        </code>
        <button
          onClick={handleCopy}
          className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 flex items-center gap-1.5 shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-[10px] font-mono text-zinc-500">
        Send USDC.e, pathUSD, or USDT0 on Tempo. Do NOT send on Base or Ethereum.
      </p>
    </Panel>
  );
}

// ─── Command Panel ────────────────────────────────────────────────────────────

const MODELS = [
  { value: null, label: 'Auto (soul default)' },
  { value: 'anthropic/claude-opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
];

function CommandPanel({ soulUrl }: { soulUrl: string }) {
  const [nudge, setNudge] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [spawning, setSpawning] = useState(false);
  const [confirmSpawn, setConfirmSpawn] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [challenge, setChallenge] = useState<{
    cloneUrl: string;
    walletConfigured: boolean;
    challenge: {
      x402Version?: number;
      accepts?: Array<{
        scheme: string;
        network: string;
        price: string;
        asset: string;
        amount: string;
        payTo: string;
        description: string;
      }>;
    } | null;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const post = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/colony/status?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const sendNudge = async () => {
    if (!nudge.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      const r = await post('nudge', { message: nudge, priority: 7 });
      setFeedback(
        r.status === 'ok' || r.id ? `✓ Nudge sent (id ${r.id ?? '?'})` : `✗ ${r.error ?? 'Failed'}`
      );
      setNudge('');
    } catch (e: any) {
      setFeedback(`✗ ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const setModelOverride = async (value: string | null) => {
    setModel(value);
    try {
      await post('model', { model: value });
      setFeedback(`✓ Model set to ${value ?? 'auto'}`);
    } catch (e: any) {
      setFeedback(`✗ ${e.message}`);
    }
  };

  const runBenchmark = async () => {
    setBenchmarking(true);
    setFeedback(null);
    try {
      const r = await post('benchmark', {});
      setFeedback(`✓ Benchmark triggered · ELO ${r.current_elo ?? '?'}`);
    } catch (e: any) {
      setFeedback(`✗ ${e.message}`);
    } finally {
      setBenchmarking(false);
    }
  };

  const inspectChallenge = async () => {
    setInspecting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/colony/spawn-clone?inspect=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const r = await res.json();
      if (res.ok || res.status === 402) {
        setChallenge({
          cloneUrl: r.cloneUrl,
          walletConfigured: r.walletConfigured ?? false,
          challenge: r.challenge,
        });
        setFeedback(null);
      } else {
        setFeedback(`✗ ${r.detail ?? r.error ?? `HTTP ${res.status}`}`);
      }
    } catch (e: any) {
      setFeedback(`✗ ${e.message}`);
    } finally {
      setInspecting(false);
    }
  };

  const spawnClone = async () => {
    if (!confirmSpawn) {
      setConfirmSpawn(true);
      setFeedback('Click again to confirm — costs $1 pathUSD');
      return;
    }
    setSpawning(true);
    setConfirmSpawn(false);
    setFeedback(null);
    try {
      const res = await fetch('/api/colony/spawn-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const r = await res.json();
      if (res.ok) {
        setFeedback(
          `✓ Worker spawned${r.clone?.url ? ` at ${r.clone.url}` : ''} · receipt ${
            r.receipt ?? '—'
          }`
        );
      } else if (res.status === 402 && r.mode === 'manual') {
        const c = r.challenge?.accepts?.[0];
        setFeedback(
          `⚠ Server wallet not configured. Pay ${c?.price ?? '$1.00'} pathUSD to ${
            c?.payTo?.slice(0, 10) ?? '?'
          }… on Tempo (chain ${c?.network ?? 'eip155:42431'})`
        );
      } else {
        setFeedback(`✗ ${r.detail ?? r.error ?? `HTTP ${res.status}`}`);
      }
    } catch (e: any) {
      setFeedback(`✗ ${e.message}`);
    } finally {
      setSpawning(false);
    }
  };

  return (
    <Panel className="mt-4">
      <SectionLabel
        icon={<MessageSquare className="w-3 h-3" />}
        label="Command Surface"
        color="text-orange-400"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nudge */}
        <div className="md:col-span-2">
          <div className="text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-widest">
            Nudge / Priority Message
          </div>
          <div className="flex gap-2">
            <input
              value={nudge}
              onChange={(e) => setNudge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendNudge();
                }
              }}
              placeholder="Send a priority nudge to the Borg…"
              className="flex-1 bg-black/40 border border-zinc-700 text-[11px] font-mono text-white placeholder-zinc-600 px-3 py-2 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={sendNudge}
              disabled={sending || !nudge.trim()}
              className="border border-zinc-700 hover:border-orange-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3 h-3" />
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
        {/* Model + Benchmark */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-widest">
              Model Override
            </div>
            <select
              value={model ?? ''}
              onChange={(e) => setModelOverride(e.target.value || null)}
              className="w-full bg-black/40 border border-zinc-700 text-[11px] font-mono text-white px-2 py-2 focus:outline-none focus:border-orange-500 appearance-none"
            >
              {MODELS.map((m) => (
                <option key={String(m.value)} value={m.value ?? ''}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={runBenchmark}
              disabled={benchmarking}
              className="border border-zinc-700 hover:border-amber-500 text-zinc-300 text-[10px] font-bold uppercase tracking-widest py-2 px-2 flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              {benchmarking ? '…' : 'Bench'}
            </button>
            <button
              onClick={inspectChallenge}
              disabled={inspecting}
              className="border border-zinc-700 hover:border-cyan-500 text-zinc-300 text-[10px] font-bold uppercase tracking-widest py-2 px-2 flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
              title="Preview the 402 challenge — read-only, no payment"
            >
              <Bug className="w-3 h-3 text-cyan-400" />
              {inspecting ? '…' : 'Inspect'}
            </button>
            <button
              onClick={spawnClone}
              disabled={spawning}
              className={`border text-[10px] font-bold uppercase tracking-widest py-2 px-2 flex items-center justify-center gap-1 disabled:opacity-40 transition-colors ${
                confirmSpawn
                  ? 'border-red-500 text-red-300'
                  : 'border-zinc-700 hover:border-emerald-500 text-zinc-300'
              }`}
              title="Pay $1 pathUSD to spawn a new worker via the queen's /clone endpoint"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {spawning ? '…' : confirmSpawn ? '$1?' : 'Spawn'}
            </button>
          </div>
        </div>
      </div>
      {challenge && challenge.challenge?.accepts?.[0] && (
        <div className="mt-3 border border-cyan-900/40 bg-cyan-950/10 p-3 text-[10px] font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Bug className="w-3 h-3" /> 402 Challenge Preview
            </div>
            <button
              onClick={() => setChallenge(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[9px] uppercase tracking-widest"
            >
              close
            </button>
          </div>
          <div className="text-zinc-500 mb-2">{challenge.cloneUrl}</div>
          {(() => {
            const a = challenge.challenge!.accepts![0];
            const amount = (Number(a.amount) / 1_000_000).toFixed(2);
            return (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">scheme</span>
                  <span className="text-zinc-300">{a.scheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">network</span>
                  <span className="text-zinc-300">{a.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">price</span>
                  <span className="text-zinc-300">
                    {a.price} ({amount} pathUSD)
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 shrink-0">asset</span>
                  <span className="text-zinc-400 break-all">{a.asset}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 shrink-0">payTo</span>
                  <span className="text-zinc-400 break-all">{a.payTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">description</span>
                  <span className="text-zinc-300">{a.description}</span>
                </div>
              </div>
            );
          })()}
          <div
            className={`mt-2 pt-2 border-t border-zinc-900 ${
              challenge.walletConfigured ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            {challenge.walletConfigured
              ? '✓ Server wallet configured — Spawn will auto-pay'
              : '⚠ Server wallet not configured — Spawn will return manual instructions'}
          </div>
        </div>
      )}
      {feedback && (
        <div
          className={`mt-3 text-[10px] font-mono ${
            feedback.startsWith('✓')
              ? 'text-emerald-400'
              : feedback.startsWith('⚠')
                ? 'text-amber-400'
                : 'text-red-400'
          }`}
        >
          {feedback}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
        <ExternalLink className="w-3 h-3" />
        <a
          href={soulUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-400 transition-colors truncate"
        >
          {soulUrl}
        </a>
      </div>
    </Panel>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BorgDashboardPage() {
  const [data, setData] = useState<SoulStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [soulUrl, setSoulUrl] = useState(SOUL_SERVICE_URL);
  const [wallet, setWallet] = useState<{
    address: string;
    designation: string | null;
    balance: { formatted: string; token: string } | null;
  } | null>(null);

  // Delta tracking
  const fitnessDelta = useDelta(data?.fitness?.total ?? undefined);
  const cyclesDelta = useDelta(data?.total_cycles);

  // SSE with polling fallback
  useEffect(() => {
    let es: EventSource;
    let pollId: ReturnType<typeof setInterval>;
    let retryTimer: ReturnType<typeof setTimeout>;
    let sseActive = false;

    const fallbackPoll = () => {
      setConnected(false);
      pollId = setInterval(async () => {
        try {
          const res = await fetch('/api/colony/status?action=soul');
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          setData(json);
          setLastFetch(new Date());
          setLoading(false);
          setError(null);
        } catch (e: any) {
          setError(e.message);
          setLoading(false);
        }
      }, 30_000);
    };

    const connect = () => {
      es = new EventSource('/api/colony/stream');

      es.addEventListener('meta', (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.soulUrl) setSoulUrl(d.soulUrl);
        } catch {}
      });

      es.addEventListener('soul', (e) => {
        sseActive = true;
        setConnected(true);
        try {
          const status = JSON.parse(e.data);
          setData(status);
          setLastFetch(new Date());
          setLoading(false);
          setError(null);
        } catch {}
      });

      es.addEventListener('diagnostics', (e) => {
        try {
          setDiagnostics(JSON.parse(e.data));
        } catch {}
      });

      es.addEventListener('error', (e: any) => {
        try {
          const d = JSON.parse(e.data);
          setError(d.message);
        } catch {}
      });

      es.onerror = () => {
        es.close();
        setConnected(false);
        if (!sseActive) {
          // SSE never connected — start polling fallback
          fallbackPoll();
        } else {
          // SSE closed (55s window) — reconnect
          retryTimer = setTimeout(connect, 1000);
        }
        sseActive = false;
      };
    };

    // Initial soul fetch so page isn't blank while SSE handshakes
    fetch('/api/colony/status?action=soul')
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    connect();
    return () => {
      es?.close();
      clearInterval(pollId);
      clearTimeout(retryTimer);
    };
  }, []);

  // Diagnostics — primed once on mount; live updates arrive via SSE 'diagnostics' event.
  useEffect(() => {
    fetch('/api/colony/status?action=diagnostics')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setDiagnostics(d);
      })
      .catch(() => {});
  }, []);

  // Wallet
  useEffect(() => {
    const fetchWallet = () =>
      fetch('/api/colony/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          const root = json?.root;
          if (
            root?.address &&
            typeof root.address === 'string' &&
            root.address !== '0x0000000000000000000000000000000000000000'
          ) {
            setWallet({
              address: root.address,
              designation: root.designation ?? null,
              balance: root.wallet_balance ?? null,
            });
          }
        })
        .catch(() => {});
    fetchWallet();
    const id = setInterval(fetchWallet, 60_000);
    return () => clearInterval(id);
  }, []);

  const status = data?.dormant ? 'idle' : data?.active ? 'active' : 'offline';
  const fitness = data?.fitness ?? EMPTY_FITNESS;
  // Null-safe locals so the JSX below never dereferences a missing field.
  const role = data?.role ?? null;
  const lifecycle = data?.lifecycle ?? null;
  const cortex = data?.cortex ?? null;
  const benchmark = data?.benchmark ?? null;

  const BorgIcon = () => (
    <svg
      className="h-5 w-5 text-orange-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="square"
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
      />
    </svg>
  );

  const LiveDot = () => (
    <span className="flex items-center gap-1.5 text-[10px] font-mono">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
        }`}
      />
      <span className={connected ? 'text-emerald-600' : 'text-amber-600'}>
        {connected ? 'live' : 'polling'}
      </span>
    </span>
  );

  const action = (
    <div className="flex items-center gap-3">
      <LiveDot />
      {data && (
        <StatusPill status={status} label={data.dormant ? 'dormant' : data.mode} size="sm" />
      )}
    </div>
  );

  return (
    <DashboardShell>
      <DashboardHeader title="Borg Dashboard" icon={<BorgIcon />} action={action} />
      <DashboardContent>
        {lastFetch && (
          <div className="mb-4 text-[10px] text-zinc-500 font-mono">
            Updated {lastFetch.toLocaleTimeString()} ·{' '}
            {connected ? 'streaming live' : 'polling 30s'}
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
            <WifiOff className="w-8 h-8 text-zinc-500 mb-3" />
            <p className="text-xs text-zinc-500 font-mono mb-2">Soul offline</p>
            <p className="text-[10px] text-zinc-500 font-mono mb-4">{error}</p>
          </div>
        )}

        {data && (
          <>
            {wallet && (
              <WalletPanel
                address={wallet.address}
                designation={wallet.designation}
                balance={wallet.balance}
              />
            )}

            {/* Stat bar */}
            <div className="grid gap-px bg-zinc-900 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              <StatCard
                label="Soul Cycles"
                value={data.total_cycles}
                sub={`mode: ${data.mode}`}
                delta={cyclesDelta}
              />
              <StatCard
                label="Fitness"
                value={`${Math.round(fitness.total * 100)}%`}
                sub={`trend ${fitness.trend >= 0 ? '+' : ''}${(fitness.trend * 100).toFixed(3)}`}
                accent={
                  fitness.total >= 0.6
                    ? 'text-emerald-400'
                    : fitness.total >= 0.3
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
                delta={fitnessDelta}
              />
              <StatCard
                label="IQ Score"
                value={benchmark?.opus_iq ?? '—'}
                sub={benchmark ? `ELO ${benchmark.elo_rating.toFixed(0)}` : 'no benchmark'}
              />
              <StatCard
                label="Colony Ψ"
                value={(role?.psi ?? 0).toFixed(4)}
                sub={
                  role
                    ? `${role.colony_size} node${role.colony_size !== 1 ? 's' : ''} · phase3 ${
                        role.phase3_ready ? '✓' : '✗'
                      }`
                    : 'no role'
                }
              />
              {data.cycle_health && (
                <>
                  <StatCard
                    label="Plans Done"
                    value={data.cycle_health.completed_plans_count}
                    sub={`${data.cycle_health.failed_plans_count} failed`}
                    accent="text-emerald-400"
                  />
                  <StatCard
                    label="Stagnation"
                    value={`${data.cycle_health.cycles_since_last_commit}c`}
                    sub="cycles since commit"
                    accent={
                      data.cycle_health.cycles_since_last_commit > 10
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }
                  />
                </>
              )}
            </div>

            {/* Active plan + cycle health */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <ActivePlanPanel plan={data.active_plan} goals={data.goals ?? []} />
              {data.cycle_health ? (
                <CycleHealthPanel health={data.cycle_health} />
              ) : (
                <FitnessPanel fitness={fitness} />
              )}
            </div>

            {/* Thought stream (full width) */}
            {data.recent_thoughts && data.recent_thoughts.length > 0 && (
              <div className="mb-4">
                <ThoughtStreamPanel thoughts={data.recent_thoughts} />
              </div>
            )}

            {/* Fitness + Free energy */}
            {data.cycle_health && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
                <FitnessPanel fitness={fitness} />
                <FreeEnergyPanel fe={data.free_energy} />
              </div>
            )}
            {!data.cycle_health && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
                <FreeEnergyPanel fe={data.free_energy} />
                <BrainPanel
                  brain={data.brain}
                  transformer={data.transformer}
                  benchmark={data.benchmark}
                />
              </div>
            )}

            {/* Brain + Goals */}
            {data.cycle_health && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
                <BrainPanel
                  brain={data.brain}
                  transformer={data.transformer}
                  benchmark={data.benchmark}
                />
                <GoalsPanel goals={data.goals ?? []} />
              </div>
            )}
            {!data.cycle_health && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
                <GoalsPanel goals={data.goals ?? []} />
                <CapabilityPanel profile={data.capability_profile} />
              </div>
            )}

            {/* Capabilities + Beliefs */}
            {data.cycle_health && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
                <CapabilityPanel profile={data.capability_profile} />
                <BeliefPanel beliefs={data.beliefs ?? []} />
              </div>
            )}
            {!data.cycle_health && (
              <div className="mb-4">
                <BeliefPanel beliefs={data.beliefs ?? []} />
              </div>
            )}

            {/* Genesis + Hivemind + Diagnostics */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
              <GenesisPanel genesis={data.genesis} />
              <HivemindPanel hivemind={data.hivemind} synthesis={data.synthesis} />
            </div>
            {diagnostics && (
              <div className="mb-4">
                <DiagnosticsPanel diag={diagnostics} />
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500 border-t border-zinc-900 pt-4 mb-4">
              {lifecycle && (
                <>
                  <span>
                    phase: <span className="text-zinc-400">{lifecycle.phase}</span>
                  </span>
                  {lifecycle.branch && (
                    <span>
                      branch: <span className="text-zinc-400">{lifecycle.branch}</span>
                    </span>
                  )}
                  <span>
                    commits: <span className="text-zinc-400">{lifecycle.own_commits}</span>
                  </span>
                  <span>
                    diverged:{' '}
                    <span className="text-zinc-400">{lifecycle.lines_diverged} lines</span>
                  </span>
                </>
              )}
              {data.acceleration && (
                <span>
                  α:{' '}
                  <span className="text-zinc-400">
                    {data.acceleration.alpha} ({data.acceleration.regime})
                  </span>
                </span>
              )}
              {cortex && (
                <>
                  <span>
                    emotion:{' '}
                    <span className="text-zinc-400">
                      v={(cortex.emotion?.valence ?? 0).toFixed(2)} a=
                      {(cortex.emotion?.arousal ?? 0).toFixed(2)} {cortex.emotion?.drive ?? '—'}
                    </span>
                  </span>
                  <span>
                    curiosity:{' '}
                    <span className="text-zinc-400">
                      {((cortex.global_curiosity ?? 0) * 100).toFixed(1)}%
                    </span>
                  </span>
                  <span>
                    experiences: <span className="text-zinc-400">{cortex.total_experiences}</span>
                  </span>
                </>
              )}
              {data.tools_enabled !== undefined && (
                <span>
                  tools:{' '}
                  <span className={data.tools_enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                    {data.tools_enabled ? 'on' : 'off'}
                  </span>
                </span>
              )}
              {data.coding_enabled !== undefined && (
                <span>
                  coding:{' '}
                  <span className={data.coding_enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                    {data.coding_enabled ? 'on' : 'off'}
                  </span>
                </span>
              )}
            </div>

            {/* Command surface */}
            <CommandPanel soulUrl={soulUrl} />
          </>
        )}
      </DashboardContent>
    </DashboardShell>
  );
}
