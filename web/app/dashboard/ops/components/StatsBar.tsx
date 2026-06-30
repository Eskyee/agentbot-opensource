'use client';

import { useMemo } from 'react';

interface FleetStats {
  running: number;
  total: number;
  throughput: { callsPerMin: number; p95: number };
  verifiedFacts: { percent: number; mirrorLag: number };
  errors: { percent: number; flagged: string[] };
  spend24h: { amount: number; budgetPercent: number };
}

interface StatsBarProps {
  stats: FleetStats | null;
  loading?: boolean;
}

/* Mini sparkline bar */
function Sparkline({ values, color = 'bg-cyan-500' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px h-4 mt-1">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 ${color} opacity-60`}
          style={{ height: `${(v / max) * 100}%`, minHeight: 1 }}
        />
      ))}
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  color = 'text-zinc-300',
  sparkData,
  sparkColor,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="flex-1 min-w-0 px-3 py-2.5 bg-zinc-950 border border-zinc-800">
      <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-1">{label}</div>
      <div className={`text-lg font-mono font-medium tracking-tight ${color}`}>{value}</div>
      <div className="text-[10px] font-mono text-zinc-500">{sub}</div>
      {sparkData && sparkData.length > 0 && <Sparkline values={sparkData} color={sparkColor} />}
    </div>
  );
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  // Generate mock sparkline data for visual appeal
  const sparkData = useMemo(
    () => ({
      throughput: Array.from({ length: 12 }, () => Math.floor(Math.random() * 800 + 600)),
      facts: Array.from({ length: 12 }, () => 95 + Math.random() * 5),
      errors: Array.from({ length: 12 }, () => Math.random() * 0.5),
      spend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20 + 170)),
    }),
    []
  );

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-zinc-900 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-950 animate-pulse" />
        ))}
      </div>
    );
  }

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toFixed(0);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-zinc-900 mb-4 border border-zinc-800">
      <StatBlock
        label="Running"
        value={`${String(stats.running).padStart(2, '0')}/${stats.total}`}
        sub={stats.total > 0 ? `+${Math.min(stats.running, 2)} · 5m` : 'no agents'}
        color="text-green-400"
      />
      <StatBlock
        label="Throughput"
        value={
          stats.throughput.callsPerMin > 0
            ? `${formatNumber(stats.throughput.callsPerMin)}/min`
            : '—'
        }
        sub={stats.throughput.p95 > 0 ? `p95 ${stats.throughput.p95}ms` : 'awaiting data'}
        sparkData={sparkData.throughput}
        sparkColor="bg-cyan-500"
      />
      <StatBlock
        label="Verified Facts"
        value={stats.verifiedFacts.percent > 0 ? `${stats.verifiedFacts.percent}%` : '—'}
        sub={
          stats.verifiedFacts.mirrorLag > 0
            ? `lag ${stats.verifiedFacts.mirrorLag}ms`
            : 'mirror offline'
        }
        color="text-green-400"
        sparkData={sparkData.facts}
        sparkColor="bg-green-500"
      />
      <StatBlock
        label="Errors"
        value={
          stats.errors.percent > 0 ? `${String(stats.errors.percent).padStart(4, '0')}%` : '00.00%'
        }
        sub={stats.errors.flagged.length > 0 ? `flagged: ${stats.errors.flagged[0]}` : 'all clear'}
        color={stats.errors.percent > 1 ? 'text-red-400' : 'text-zinc-300'}
        sparkData={sparkData.errors}
        sparkColor="bg-red-500"
      />
      <StatBlock
        label="Spend 24H"
        value={stats.spend24h.amount > 0 ? `$${stats.spend24h.amount}` : '$0'}
        sub={
          stats.spend24h.budgetPercent > 0
            ? `${stats.spend24h.budgetPercent}% of budget`
            : 'no spend'
        }
        color={stats.spend24h.budgetPercent > 80 ? 'text-yellow-400' : 'text-zinc-300'}
        sparkData={sparkData.spend}
        sparkColor="bg-zinc-400"
      />
    </div>
  );
}
