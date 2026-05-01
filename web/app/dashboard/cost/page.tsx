'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Zap, Clock, Loader2, type LucideIcon } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import StatusPill from '@/app/components/shared/StatusPill';

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

interface Quota {
  monthlyTokens: number;
  usedTokens: number;
  percent: number;
  overageWarning: boolean;
  nextPlan: string | null;
}

interface CostData {
  period: string;
  summary: {
    totalCost: number;
    totalTokens: number;
    totalCalls: number;
    avgCostPerCall: number;
  };
  quota?: Quota;
  agents: AgentCost[];
  daily: DailyCost[];
  modelBreakdown: ModelBreakdown[];
  isMockData: boolean;
  plan?: string;
  message?: string;
}

async function fetchCostData(period: string): Promise<CostData> {
  const res = await fetch(`/api/dashboard/cost?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch cost data');
  return res.json();
}

const StatCard = ({
  icon: Icon, label, value, sub, trend, colorClass = 'text-orange-400',
}: {
  icon: LucideIcon; label: string; value: string; sub?: string; trend?: 'up' | 'down'; colorClass?: string;
}) => (
  <div className="bg-zinc-950 border border-zinc-800 p-5">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
        <Icon className={`h-4 w-4 ${colorClass}`} />{label}
      </div>
      {trend === 'up'   && <TrendingUp   className="h-3 w-3 text-red-400" />}
      {trend === 'down' && <TrendingDown className="h-3 w-3 text-green-400" />}
    </div>
        <div className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</div>
    {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
  </div>
);

interface PlatformOutcome {
  id: number
  outcome_type: string
  title: string
  description: string | null
  value_usd: string | null
  created_at: string
}

const OUTCOME_LABELS: Record<string, string> = {
  broadcast_complete:    '📻 Broadcast',
  negotiation_complete:  '🤝 Negotiation',
  amplification_complete:'📣 Amplification',
  deal_closed:           '💰 Deal Closed',
  task_complete:         '✅ Task',
  content_published:     '📝 Published',
}

function OutcomeFeed() {
  const { data, isLoading } = useQuery<{ outcomes: PlatformOutcome[] }>({
    queryKey: ['outcomes'],
    queryFn: () => fetch('/api/outcomes').then((r) => r.json()),
    refetchInterval: 60000,
  })

  const outcomes = data?.outcomes ?? []

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-5 mt-px">
      <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Value Delivered</h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-600"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
      ) : outcomes.length === 0 ? (
        <p className="text-xs text-zinc-600">No outcomes recorded yet. Completed broadcasts, negotiations, and agent tasks will appear here.</p>
      ) : (
        <div className="space-y-2">
          {outcomes.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-3 py-2 border-b border-zinc-900 last:border-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2">
                  {OUTCOME_LABELS[o.outcome_type] ?? o.outcome_type}
                </span>
                <span className="text-xs text-zinc-300">{o.title}</span>
                {o.description && <p className="text-[10px] text-zinc-600 mt-0.5">{o.description}</p>}
              </div>
              <div className="shrink-0 text-right">
                {o.value_usd && <p className="text-xs font-mono text-green-400">${parseFloat(o.value_usd).toFixed(2)}</p>}
                <p className="text-[10px] text-zinc-700">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CostPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'mtd'>('7d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cost', period],
    queryFn: () => fetchCostData(period),
    refetchInterval: 60000,
  });

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

  const { summary, agents, daily, modelBreakdown, isMockData, message, quota, plan } = data;

  const periodAction = (
    <div className="flex gap-px bg-zinc-800">
      {(['7d', '30d', 'mtd'] as const).map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            period === p ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-700'
          }`}
        >
          {p === 'mtd' ? 'MTD' : p}
        </button>
      ))}
    </div>
  );

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

        {/* Token Quota Meter */}
        {quota && (
          <div className={`mb-6 rounded-[20px] border p-5 ${
            quota.overageWarning
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-zinc-800 bg-zinc-950/80'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Monthly Token Quota — {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} Plan
                </p>
                <p className="mt-1 text-sm text-white">
                  {(quota.usedTokens / 1_000_000).toFixed(2)}M
                  <span className="text-zinc-500"> / {(quota.monthlyTokens / 1_000_000).toFixed(1)}M tokens used this month</span>
                </p>
              </div>
              <span className={`text-lg font-bold ${
                quota.percent >= 90 ? 'text-red-400' :
                quota.percent >= 80 ? 'text-amber-400' :
                'text-green-400'
              }`}>{quota.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quota.percent >= 90 ? 'bg-red-500' :
                  quota.percent >= 80 ? 'bg-amber-400' :
                  'bg-green-500'
                }`}
                style={{ width: `${quota.percent}%` }}
              />
            </div>
            {quota.overageWarning && quota.nextPlan && (
              <p className="mt-3 text-[11px] text-amber-300">
                You&apos;re approaching your monthly limit. Upgrade to <strong>{quota.nextPlan}</strong> for more tokens and higher limits.
                {' '}<a href="/billing" className="underline underline-offset-2 hover:text-white">Upgrade now →</a>
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            icon={DollarSign}
            label={`${period === 'mtd' ? 'MTD' : period} Cost`}
            value={`$${summary.totalCost.toFixed(2)}`}
            sub="all agents"
            colorClass="text-green-400"
            trend={summary.totalCost > 10 ? 'up' : 'down'}
          />
          <StatCard
            icon={Zap}
            label="Tokens Used"
            value={`${(summary.totalTokens / 1_000_000).toFixed(1)}M`}
            sub="input + output"
            colorClass="text-orange-400"
          />
          <StatCard
            icon={Clock}
            label="API Calls"
            value={summary.totalCalls.toLocaleString()}
            sub={`last ${period}`}
            colorClass="text-orange-400"
          />
          <StatCard
            icon={DollarSign}
            label="Avg / Call"
            value={`$${summary.avgCostPerCall.toFixed(4)}`}
            sub="blended"
            colorClass="text-yellow-400"
          />
        </div>

        {/* Daily cost chart */}
        <div className="bg-zinc-950 border border-zinc-800 p-5 mb-px">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Daily Cost</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#09090b', border: '1px solid #27272a', fontSize: 12 }}
                labelStyle={{ color: '#71717a' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
              />
              <Area type="monotone" dataKey="cost" stroke="#4ade80" fill="#4ade80" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
                  <tr key={agent.name} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                    <td className="px-5 py-3">
                      <div className="font-bold">{agent.name}</div>
                      {agent.model && <div className="text-[10px] text-zinc-500">{agent.model}</div>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{(agent.tokens / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-right font-mono">{agent.calls.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-green-400">${agent.cost.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-zinc-400">${agent.avgCostPerCall.toFixed(4)}</td>
                  </tr>
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
              <div key={m.model} className="flex items-center gap-4">
                <div className="w-24 sm:w-40 text-xs font-mono text-zinc-400 truncate">{m.model}</div>
                <div className="flex-1 bg-zinc-800 h-1.5 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${m.percent}%` }} />
                </div>
                <div className="w-12 text-right text-[10px] text-zinc-500">{m.percent}%</div>
                <div className="w-20 text-right text-xs font-mono text-green-400">${m.cost.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Delivered feed */}
        <OutcomeFeed />

        {/* Token usage chart */}
        <div className="bg-zinc-950 border border-zinc-800 p-5 mt-px">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Token Usage</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: '#09090b', border: '1px solid #27272a', fontSize: 12 }}
                labelStyle={{ color: '#71717a' }}
                formatter={(value: any) => [`${(value / 1000).toFixed(0)}K`, 'Tokens']}
              />
              <Bar dataKey="tokens" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
