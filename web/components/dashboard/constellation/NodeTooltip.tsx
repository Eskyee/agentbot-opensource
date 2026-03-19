'use client';

import type { ConstellationNode } from '@/types/constellation';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-status-green',
  idle: 'bg-status-amber',
  error: 'bg-status-red',
  offline: 'bg-text-muted',
};

interface NodeTooltipProps {
  node: ConstellationNode;
  x: number;
  y: number;
}

export default function NodeTooltip({ node, x, y }: NodeTooltipProps) {
  // Position tooltip to avoid going off-screen
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x + 16,
    top: y - 10,
    zIndex: 60,
    pointerEvents: 'none',
    maxWidth: 260,
  };

  // Adjust if near right edge
  if (typeof window !== 'undefined' && x > window.innerWidth - 280) {
    style.left = x - 270;
  }

  const lastSeen = node.lastSeenAt
    ? formatRelative(node.lastSeenAt)
    : 'Unknown';

  return (
    <div
      style={style}
      className="rounded-lg border border-border bg-[#1a1f2e]/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[node.status] || STATUS_DOT.offline}`} />
        <span className="text-xs font-semibold text-text-primary">{node.name}</span>
        <span className="text-[10px] text-text-muted capitalize">{node.role}</span>
      </div>
      <div className="space-y-0.5 text-[10px]">
        {node.modelPrimary && (
          <Row label="Model" value={node.modelPrimary} mono />
        )}
        <Row label="Status" value={node.status} />
        <Row label="Last seen" value={lastSeen} />
        {node.tokensUsed24h !== undefined && node.tokensUsed24h > 0 && (
          <Row label="Tokens (24h)" value={formatTokens(node.tokensUsed24h)} mono />
        )}
        {node.costUSD24h !== undefined && node.costUSD24h > 0 && (
          <Row label="Cost (24h)" value={`$${node.costUSD24h.toFixed(4)}`} mono />
        )}
        {(node.errorCount24h ?? 0) > 0 && (
          <Row label="Errors" value={`${node.errorCount24h}`} accent="text-status-red" />
        )}
      </div>
      <div className="mt-1.5 text-[9px] text-text-muted italic">Click for details</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${accent || 'text-text-secondary'}`}>
        {value}
      </span>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
