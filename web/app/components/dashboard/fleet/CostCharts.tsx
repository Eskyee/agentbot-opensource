'use client';

import { useState, useMemo } from 'react';
import { useTokenUsage } from '@/hooks/useTokenUsage';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

type Period = '7d' | '30d';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-text-secondary">
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value < 1
            ? '$' + p.value.toFixed(4)
            : '$' + p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

function TokenTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const tokens = payload[0]?.value ?? 0;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      <p className="text-text-secondary">
        Tokens: {typeof tokens === 'number' ? tokens.toLocaleString() : tokens}
      </p>
    </div>
  );
}

export default function CostCharts() {
  const { data } = useTokenUsage();
  const [period, setPeriod] = useState<Period>('7d');

  const chartData = useMemo(() => {
    if (!data?.dailyChart) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - (period === '7d' ? 7 : 30));

    return data.dailyChart.filter((entry) => {
      const entryDate = new Date(`${entry.date}T00:00:00`);
      return entryDate >= cutoff;
    });
  }, [data?.dailyChart, period]);

  const modelNames = useMemo(() => {
    if (!chartData?.length) return [];
    const names = new Set<string>();
    for (const entry of chartData) {
      for (const key of Object.keys(entry.models)) names.add(key);
    }
    return Array.from(names);
  }, [chartData]);

  const rechartsData = useMemo(
    () =>
      chartData.map((d) => ({
        name: d.label,
        total: d.total,
        tokens: d.tokens,
        ...d.models,
      })),
    [chartData],
  );

  if (!data?.dailyChart?.length) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>No chart data available yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-medium text-text-primary">
            Cost & Token Trends
          </h3>
        </div>
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          <button
            className={cn(
              'px-3 py-1 transition-colors',
              period === '7d'
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary',
            )}
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </button>
          <button
            className={cn(
              'px-3 py-1 transition-colors',
              period === '30d'
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary',
            )}
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chart 1: Daily Cost Trend */}
        <div>
          <p className="text-xs text-text-secondary mb-2">Daily Cost Trend</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rechartsData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#737373', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737373', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: '#737373' }}
                />
                {modelNames.map((model, i) => (
                  <Area
                    key={model}
                    type="monotone"
                    dataKey={model}
                    stackId="cost"
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    fillOpacity={0.4}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Token Volume */}
        <div>
          <p className="text-xs text-text-secondary mb-2">
            Daily Token Volume
          </p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rechartsData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#737373', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737373', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toLocaleString()}
                />
                <Tooltip content={<TokenTooltip />} />
                <Bar
                  dataKey="tokens"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
