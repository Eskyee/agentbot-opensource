'use client';

import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: 'active' | 'idle' | 'error' | 'offline' | string;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  idle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  offline: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function StatusPill({ status, label, size = 'md' }: StatusPillProps) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.offline;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        styles,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-green-400': status === 'active',
        'bg-yellow-400': status === 'idle',
        'bg-red-400': status === 'error',
        'bg-gray-400': status === 'offline' || !STATUS_STYLES[status],
      })} />
      {label ?? status}
    </span>
  );
}
