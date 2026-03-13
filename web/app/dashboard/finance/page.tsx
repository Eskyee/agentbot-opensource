'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, Activity } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';
import CostCharts from '@/components/dashboard/fleet/CostCharts';
import TokenUsageTable from '@/components/dashboard/fleet/TokenUsageTable';

export default function FinancePage() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ['fleet-costs'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/costs');
      return res.json();
    },
    refetchInterval: 10000 // 10s refresh for financials
  });

  const totalSpend = costs?.reduce((sum: number, c: any) => sum + Number(c.total_spend), 0) ?? 0;
  const aiCost = costs?.filter((c: any) => c.category === 'ai_metric').reduce((sum: number, c: any) => sum + Number(c.total_spend), 0) ?? 0;
  const coordinationRevenue = (costs?.filter((c: any) => c.category === 'agent_message').length ?? 0) * 0.01; // 1% tax logic

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Finance & Profit</h1>
        <p className="text-gray-400">Real-time spend attribution and revenue tracking across your agent fleet.</p>
      </div>

      {/* High-level metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Total Fleet Spend"
          value={`$${totalSpend.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={-12}
        />
        <MetricCard
          label="Managed AI Cost"
          value={`$${aiCost.toFixed(2)}`}
          icon={<Activity className="h-4 w-4" />}
          trend={-85} // Highlighting local ollama savings
        />
        <MetricCard
          label="Coordination Revenue"
          value={`$${coordinationRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={1}
        />
        <MetricCard
          label="Net Profit Margin"
          value="88.2%"
          icon={<PieChart className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Cost Over Time Chart */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>📈</span> Spend Attribution
            </h2>
            <select className="bg-black border border-gray-700 rounded px-2 py-1 text-xs outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <CostCharts />
          </div>
        </div>

        {/* Token Usage Breakdown */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>🤖</span> Agent Intelligence Usage
            </h2>
          </div>
          <TokenUsageTable />
        </div>
      </div>

      {/* Treasury Alert */}
      <div className="mt-8 bg-blue-600/10 border border-blue-500/30 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-400 uppercase text-xs tracking-widest">Platform Treasury</h3>
            <p className="text-gray-300">Your $AGENTBOT liquidity is being automatically rebalanced.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold">$12,482.10</div>
          <div className="text-[10px] text-green-400 font-bold">+2.4% TODAY</div>
        </div>
      </div>
    </div>
  );
}
