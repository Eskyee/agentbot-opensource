'use client';

import { cn } from '@/lib/utils';

interface ContextHealthBarProps {
  percent: number;
  agentName: string;
}

function getBarColor(percent: number): string {
  if (percent > 85) return 'bg-status-red';
  if (percent >= 60) return 'bg-status-amber';
  return 'bg-status-green';
}

function getTextColor(percent: number): string {
  if (percent > 85) return 'text-status-red';
  if (percent >= 60) return 'text-status-amber';
  return 'text-status-green';
}

export default function ContextHealthBar({ percent, agentName }: ContextHealthBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className={cn('text-sm font-medium', getTextColor(clampedPercent))}>
          Context: {Math.round(clampedPercent)}%
        </span>
        <button
          onClick={() => {
            console.log(`[ContextHealthBar] Compact requested for agent: ${agentName}`);
          }}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            'bg-accent text-white hover:bg-accent-hover',
          )}
        >
          Compact Now
        </button>
      </div>

      {/* Progress track */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-hover">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getBarColor(clampedPercent),
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
