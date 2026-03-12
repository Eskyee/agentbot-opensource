'use client';
import { useState } from 'react';
import { useTokenUsage } from '@/hooks/useTokenUsage';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtCost(n: number): string {
  return '$' + n.toFixed(2);
}

const periodMap = { today: 'today', '7d': 'week', '30d': 'month', all: 'all' } as const;
type Period = keyof typeof periodMap;

const periodLabels: Record<Period, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  all: 'All Time',
};

export default function TokenUsageTable() {
  const [period, setPeriod] = useState<Period>('7d');
  const { data, isLoading } = useTokenUsage();

  const buckets = data?.[periodMap[period]] ?? [];

  const totals = buckets.reduce(
    (acc, b) => ({
      calls: acc.calls + b.calls,
      input: acc.input + b.input,
      output: acc.output + b.output,
      cacheRead: acc.cacheRead + b.cacheRead,
      totalTokens: acc.totalTokens + b.totalTokens,
      cost: acc.cost + b.cost,
    }),
    { calls: 0, input: 0, output: 0, cacheRead: 0, totalTokens: 0, cost: 0 },
  );

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <BarChart3 className="h-4 w-4 text-text-muted" />
          Token Usage
        </h2>

        <div className="flex gap-1">
          {(Object.keys(periodMap) as Period[]).map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                period === key
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover',
              )}
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-text-muted">
            Loading...
          </div>
        ) : buckets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-text-muted">
            No usage data
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-4 py-2.5 text-left font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Calls</th>
                <th className="px-4 py-2.5 text-right font-medium">Input</th>
                <th className="px-4 py-2.5 text-right font-medium">Output</th>
                <th className="px-4 py-2.5 text-right font-medium">Cache Read</th>
                <th className="px-4 py-2.5 text-right font-medium">Total Tokens</th>
                <th className="px-4 py-2.5 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr
                  key={b.model}
                  className="border-b border-border/30 hover:bg-surface-hover"
                >
                  <td className="px-4 py-2.5 text-left font-medium text-text-primary">
                    {b.model}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {b.calls.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {fmtTokens(b.input)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {fmtTokens(b.output)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {fmtTokens(b.cacheRead)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {fmtTokens(b.totalTokens)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-text-primary">
                    {fmtCost(b.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-text-primary">
                <td className="px-4 py-2.5 text-left">Total</td>
                <td className="px-4 py-2.5 text-right">
                  {totals.calls.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {fmtTokens(totals.input)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {fmtTokens(totals.output)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {fmtTokens(totals.cacheRead)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {fmtTokens(totals.totalTokens)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {fmtCost(totals.cost)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
