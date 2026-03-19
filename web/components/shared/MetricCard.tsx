'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-4',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {icon && (
          <span className="text-text-muted">{icon}</span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-text-primary">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-text-secondary">{unit}</span>
        )}
      </div>

      {trend !== undefined && trend !== 0 && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium',
            trend > 0 ? 'text-status-green' : 'text-status-red',
          )}
        >
          {trend > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        </div>
      )}
    </div>
  );
}
