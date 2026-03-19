'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, Activity, RefreshCw, Loader2 } from 'lucide-react';
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
    <div className="p-8 bg-black min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Finance & Profit</h1>
        <p className="text-gray-400">Real-time spend attribution and revenue tracking across your agent fleet.</p>
      </div>

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
          trend={-85}
        />
        <MetricCard
          label="Coordination Revenue"
          value={`$${coordinationRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={1}
        />
        <MetricCard
          label="Crypto Portfolio"
          value={`$${portfolioValue.toFixed(2)}`}
          icon={<PieChart className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
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

        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>🤖</span> Agent Intelligence Usage
            </h2>
          </div>
          <TokenUsageTable />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mt-8">
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-400 uppercase text-xs tracking-widest">Crypto Wallet</h3>
                <p className="text-gray-300">Bankr trading balance</p>
              </div>
            </div>
            <button
              onClick={() => refetchBalances()}
              className="p-2 hover:bg-purple-500/20 rounded-lg transition"
              disabled={balancesLoading}
            >
              <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {balancesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : balances && balances.length > 0 ? (
            <div className="space-y-2">
              {balances.slice(0, 5).map((b: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400">{b.symbol} ({b.chain})</span>
                  <span className="font-mono">{Number(b.balance).toFixed(4)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No crypto holdings</p>
          )}
          
          <div className="mt-4 pt-4 border-t border-purple-500/20">
            <div className="text-2xl font-mono font-bold text-purple-400">
              ${portfolioValue.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-blue-400 uppercase text-xs tracking-widest">Platform Treasury</h3>
              <p className="text-gray-300">Your $AGENTBOT liquidity</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">$12,482.10</div>
            <div className="text-[10px] text-green-400 font-bold">+2.4% TODAY</div>
          </div>
        </div>
      </div>
    </div>
  );
}
