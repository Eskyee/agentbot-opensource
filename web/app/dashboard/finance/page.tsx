'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Activity, RefreshCw, Loader2, Wallet, BarChart3, Cpu } from 'lucide-react';
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell';
import { SectionHeader } from '@/app/components/shared/SectionHeader';
import StatusPill from '@/app/components/shared/StatusPill';
import MetricCard from '@/components/shared/MetricCard';
import CostCharts from '@/components/dashboard/fleet/CostCharts';
import TokenUsageTable from '@/components/dashboard/fleet/TokenUsageTable';

export default function FinancePage() {
  const { data: costs, isLoading: costsLoading } = useQuery({
    queryKey: ['fleet-costs'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/costs');
      return res.json();
    },
    refetchInterval: 10000
  });

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ['bankr-balances'],
    queryFn: async () => {
      const res = await fetch('/api/bankr/balances');
      const data = await res.json();
      return data.balances || [];
    },
    refetchInterval: 30000
  });

  const totalSpend = costs?.reduce((sum: number, c: any) => sum + Number(c.total_spend), 0) ?? 0;
  const aiCost = costs?.filter((c: any) => c.category === 'ai_metric').reduce((sum: number, c: any) => sum + Number(c.total_spend), 0) ?? 0;
  const coordinationRevenue = (costs?.filter((c: any) => c.category === 'agent_message').length ?? 0) * 0.01;
  const portfolioValue = balances?.reduce((sum: number, b: any) => sum + Number(b.value || 0), 0) ?? 0;

  return (
    <DashboardShell>
      <DashboardHeader title="Finance & Profit" icon={<DollarSign className="h-5 w-5 text-green-400" />} />
      <DashboardContent>
        {/* Metric Cards */}
        <div className="grid gap-px bg-zinc-800 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Total Fleet Spend</span>
              <DollarSign className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight">${totalSpend.toFixed(2)}</div>
            <div className="text-[10px] text-zinc-600 mt-1">all agents</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Managed AI Cost</span>
              <Activity className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight">${aiCost.toFixed(2)}</div>
            <div className="text-[10px] text-green-500 mt-1">-85% from baseline</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Coordination Revenue</span>
              <TrendingUp className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight">${coordinationRevenue.toFixed(2)}</div>
            <div className="text-[10px] text-green-500 mt-1">+1 trend</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Crypto Portfolio</span>
              <BarChart3 className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-bold tracking-tight">${portfolioValue.toFixed(2)}</div>
            <div className="text-[10px] text-zinc-600 mt-1">bankr holdings</div>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="grid gap-px bg-zinc-800 lg:grid-cols-1 sm:grid-cols-2">
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold tracking-tight uppercase">Spend Attribution</h2>
              <select className="bg-black border border-zinc-700 px-2 py-1 text-[10px] outline-none uppercase tracking-widest text-zinc-400">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px]">
              <CostCharts />
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold tracking-tight uppercase">Agent Intelligence Usage</h2>
            </div>
            <TokenUsageTable />
          </div>
        </div>

        {/* Wallet & Treasury */}
        <div className="grid gap-px bg-zinc-800 lg:grid-cols-1 sm:grid-cols-2 mt-8">
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-400" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Crypto Wallet</span>
                  <span className="text-sm font-bold tracking-tight uppercase">Bankr Trading Balance</span>
                </div>
              </div>
              <button
                onClick={() => refetchBalances()}
                className="border border-zinc-700 hover:border-zinc-500 p-2 transition-colors"
                disabled={balancesLoading}
              >
                <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {balancesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : balances && balances.length > 0 ? (
              <div className="space-y-2">
                {balances.slice(0, 5).map((b: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-xs text-zinc-500">{b.symbol} ({b.chain})</span>
                    <span className="text-xs font-mono text-zinc-300">{Number(b.balance).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No crypto holdings</p>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Total Value</div>
              <div className="text-2xl font-bold tracking-tight">${portfolioValue.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Platform Treasury</span>
                <span className="text-sm font-bold tracking-tight uppercase">$AGENTBOT Liquidity</span>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">$12,482.10</div>
            <div className="mt-2">
              <StatusPill status="active" label="+2.4% Today" size="sm" />
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
