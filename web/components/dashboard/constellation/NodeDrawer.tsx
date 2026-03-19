'use client';

import { useEffect, useCallback } from 'react';
import type { ConstellationNode } from '@/types/constellation';
import { cn } from '@/lib/utils';
import StatusPill from '@/components/shared/StatusPill';
import {
  X,
  Cpu,
  Zap,
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  DollarSign,
  Database,
  Layers,
} from 'lucide-react';

const STATUS_MAP: Record<string, 'online' | 'idle' | 'error' | 'offline'> = {
  active: 'online',
  idle: 'idle',
  error: 'error',
  offline: 'offline',
};

const ROLE_LABELS: Record<string, string> = {
  orchestrator: 'Orchestrator',
  developer: 'Developer',
  qa: 'QA Engineer',
  researcher: 'Researcher',
  designer: 'Designer',
  other: 'Agent',
};

const ROLE_COLORS: Record<string, string> = {
  orchestrator: 'bg-accent/20 text-accent border-accent/30',
  developer: 'bg-status-green/20 text-status-green border-status-green/30',
  qa: 'bg-status-amber/20 text-status-amber border-status-amber/30',
  researcher: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  designer: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  other: 'bg-surface-hover text-text-secondary border-border',
};

function formatRelative(iso?: string): string {
  if (!iso) return 'Unknown';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatTokens(n?: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(n?: number): string {
  if (!n) return '$0.00';
  return `$${n.toFixed(4)}`;
}

interface NodeDrawerProps {
  node: ConstellationNode | null;
  onClose: () => void;
}

export default function NodeDrawer({ node, onClose }: NodeDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (node) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [node, onClose]);

  if (!node) return null;

  const pillStatus = STATUS_MAP[node.status] || 'offline';
  const roleLabel = ROLE_LABELS[node.role] || 'Agent';
  const roleColor = ROLE_COLORS[node.role] || ROLE_COLORS.other;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-border bg-[#0f1117]/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border',
                roleColor,
              )}
            >
              <Cpu className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary truncate">
                {node.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                    roleColor,
                  )}
                >
                  {roleLabel}
                </span>
                <StatusPill status={pillStatus} label={node.status} size="sm" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Cost (24h)"
              value={formatCost(node.costUSD24h)}
              accent={
                (node.costUSD24h ?? 0) > 1
                  ? 'text-status-amber'
                  : 'text-text-primary'
              }
            />
            <MetricCard
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Tokens (24h)"
              value={formatTokens(node.tokensUsed24h)}
            />
            <MetricCard
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="Errors (24h)"
              value={`${node.errorCount24h ?? 0}`}
              accent={
                (node.errorCount24h ?? 0) > 0
                  ? 'text-status-red'
                  : 'text-status-green'
              }
            />
            <MetricCard
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Last Seen"
              value={formatRelative(node.lastSeenAt)}
            />
          </div>

          {/* Model Info */}
          <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              Model Configuration
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Primary</span>
                <span className="font-mono text-text-primary">
                  {node.modelPrimary || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Provider</span>
                <span className="font-medium text-text-secondary capitalize">
                  {node.provider || 'Unknown'}
                </span>
              </div>
              {node.modelFallbacks && node.modelFallbacks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    Fallbacks
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {node.modelFallbacks.map((fb) => (
                      <span
                        key={fb}
                        className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
                      >
                        {fb}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context Usage */}
          {node.contextPercent !== undefined && node.contextPercent > 0 && (
            <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <Database className="h-3.5 w-3.5" />
                Context Window
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      node.contextPercent > 85
                        ? 'bg-status-red'
                        : node.contextPercent > 60
                          ? 'bg-status-amber'
                          : 'bg-accent',
                    )}
                    style={{ width: `${Math.min(node.contextPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-medium text-text-primary">
                  {node.contextPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Last Error */}
          {node.lastError && (
            <div className="rounded-lg border border-status-red/30 bg-status-red/5 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-status-red flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Last Error
              </h3>
              <p className="text-xs text-text-secondary font-mono leading-relaxed">
                {node.lastError}
              </p>
            </div>
          )}

          {/* Tasks Summary */}
          {(node.recentTaskCount ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Activity
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Tasks executed</span>
                <span className="font-mono font-medium text-text-primary">
                  {node.recentTaskCount}
                </span>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Quick Links
            </h3>
            <QuickLink href="/fleet" label="Agent Fleet" description="Full fleet overview" />
            <QuickLink href="/security" label="System Pulse" description="Cost & security monitoring" />
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-text-muted mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-base font-bold font-mono', accent || 'text-text-primary')}>
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-3 py-2.5 transition-colors hover:bg-surface-hover group"
    >
      <div>
        <p className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
          {label}
        </p>
        <p className="text-[10px] text-text-muted">{description}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-text-muted group-hover:text-accent transition-colors" />
    </a>
  );
}
