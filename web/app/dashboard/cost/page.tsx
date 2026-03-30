'use client';

import { useState, useMemo, useCallback, startTransition, memo, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingDown, TrendingUp, Zap, Clock, Loader2 } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

// ─── Lazy-load recharts (heavy bundle ~200KB) ───
const CostCharts = lazy(() => import('./CostCharts'));

interface AgentCost {
  name: string;
  tokens: number;
  cost: number;
  calls: number;
  avgCostPerCall: number;
  model?: string;
}

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

interface ModelBreakdown {
  model: string;
  percent: number;
  cost: number;
}

interface CostData {
  period: string;
  summary: {
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    avgCostPerCall: number;
  };
  agents: AgentCost[];
  daily: DailyCost[];
  modelBreakdown: ModelBreakdown[];
  isMockData: boolean;
  message?: string;
}

async function fetchCostData(period: string): Promise<CostData> {
  const res = await fetch(`/api/dashboard/cost?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch cost data');
  return res.json();
}

const StatCard = memo(function StatCard({
  icon: Icon, label, value, sub, trend, color = 'text-blue-400',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; trend?: 'up' | 'down'; color?: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
          <Icon className={`h-4 w-4 ${color}`} />{label}
        </div>
        {trend === 'up'   && <TrendingUp   className="h-3 w-3 text-red-400" />}
        {trend === 'down' && <TrendingDown className="h-3 w-3 text-green-400" />}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
    </div>
  );
});

const ModelRow = memo(function ModelRow({ model }: { model: ModelBreakdown }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 sm:w-40 text-xs font-mono text-zinc-400 truncate">{model.model}</div>
      <div className="flex-1 bg-zinc-800 h-1.5 overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${model.percent}%` }} />
      </div>
      <div className="w-12 text-right text-[10px] text-zinc-500">{model.percent}%</div>
      <div className="w-20 text-right text-xs font-mono text-green-400">${model.cost.toFixed(2)}</div>
    </div>
  );
});

const AgentRow = memo(function AgentRow({ agent }: { agent: AgentCost }) {
  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-900/50">
      <td className="px-5 py-3">
        <div className="font-bold">{agent.name}</div>
        {agent.model && <div className="text-[10px] text-zinc-500">{agent.model}</div>}
      </td>
      <td className="px-5 py-3 text-right font-mono">{(agent.tokens / 1000).toFixed(0)}K</td>
      <td className="px-5 py-3 text-right font-mono">{agent.calls.toLocaleString()}</td>
      <td className="px-5 py-3 text-right font-mono text-green-400">${agent.cost.toFixed(2)}</td>
      <td className="px-5 py-3 text-right font-mono text-zinc-400">${agent.avgCostPerCall.toFixed(4)}</td>
    </tr>
  );
});

const ChartSkeleton = memo(function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
    </div>
  );
});

export default function CostPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'mtd'>('7d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cost', period],
    queryFn: () => fetchCostData(period),
    refetchInterval: 60000,
  });

  const handlePeriodChange = useCallback((p: '7d' | '30d' | 'mtd') => {
    startTransition(() => setPeriod(p));
  }, []);

  const periodAction = useMemo(() => (
    <div className="flex gap-px bg-zinc-800">
      {(['7d', '30d', 'mtd'] as const).map(p => (
        <button
          key={p}
          onClick={() => handlePeriodChange(p)}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            period === p ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-700'
          }`}
        >
          {p === 'mtd' ? 'MTD' : p}
        </button>
      ))}
    </div>
  ), [period, handlePeriodChange]);

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardContent>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        </DashboardContent>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <DashboardContent>
          <div className="flex items-center justify-center py-20">
            <span className="text-xs text-zinc-500">Failed to load cost data</span>
          </div>
        </DashboardContent>
      </DashboardShell>
    );
  }

  const { summary, agents, daily, modelBreakdown, isMockData, message } = data;

  // Memoize stat card data to avoid recalculation on re-render
  const periodLabel = period === 'mtd' ? 'MTD' : period;
  const costTrend = summary.totalCost > 10 ? 'up' : 'down';

  return (
    <DashboardShell>
      <DashboardHeader
        title="Cost Tracking"
        icon={<DollarSign className="h-5 w-5 text-green-400" />}
        action={periodAction}
      />
      <DashboardContent>
        {/* Mock data banner */}
        {isMockData && message && (
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-3 text-[10px] text-yellow-400 uppercase tracking-widest mb-6">
            {message}
          </div>
        )}

        {isMockData && (
          <div className="mb-4">
            <StatusPill status="idle" label="Sample Data" size="sm" />
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            icon={DollarSign}
            label={`${periodLabel} Cost`}
            value={`$${summary.totalCost.toFixed(2)}`}
            sub="all agents"
            color="text-green-400"
            trend={costTrend as 'up' | 'down'}
          />
          <StatCard
            icon={Zap}
            label="Tokens Used"
            value={`${(summary.totalTokens / 1_000_000).toFixed(1)}M`}
            sub="input + output"
            color="text-blue-400"
          />
          <StatCard
            icon={Clock}
            label="API Calls"
            value={summary.totalCalls.toLocaleString()}
            sub={`last ${period}`}
            color="text-blue-400"
          />
          <StatCard
            icon={DollarSign}
            label="Avg / Call"
            value={`$${summary.avgCostPerCall.toFixed(4)}`}
            sub="blended"
            color="text-yellow-400"
          />
        </div>

        {/* Charts — lazy-loaded recharts */}
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <CostCharts daily={daily} />
        </Suspense>

        {/* Agent breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 mt-px">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold tracking-tight uppercase">Agent Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600">
                  <th className="px-5 py-3 text-left">Agent</th>
                  <th className="px-5 py-3 text-right">Tokens</th>
                  <th className="px-5 py-3 text-right">Calls</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-right">Avg/Call</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <AgentRow key={agent.name} agent={agent} />
                ))}
              </tbody>
              <tfoot>
                <tr className="text-xs font-bold border-t border-zinc-800">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-5 py-3 text-right font-mono">{(summary.totalTokens / 1_000_000).toFixed(1)}M</td>
                  <td className="px-5 py-3 text-right font-mono">{summary.totalCalls.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-green-400">${summary.totalCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-400">${summary.avgCostPerCall.toFixed(4)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Model breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 p-5 mt-px">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Model Breakdown</h2>
          <div className="space-y-3">
            {modelBreakdown.map((m) => (
              <ModelRow key={m.model} model={m} />
            ))}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
