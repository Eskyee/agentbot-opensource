'use client';

import { useState } from 'react';
import { cn, formatCost, formatTokens } from '@/lib/utils';
import type { AgentTask } from '@/types';

interface ExecutionTraceProps {
  tasks: AgentTask[];
}

function taskBgColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-900/30 border-green-800/40';
    case 'failed':
      return 'bg-red-900/30 border-red-800/40';
    case 'running':
      return 'bg-blue-900/30 border-blue-800/40';
    case 'partial':
    case 'uncertain':
      return 'bg-amber-900/30 border-amber-800/40';
    default:
      return 'bg-surface-hover border-border';
  }
}

function taskDotColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-status-green';
    case 'failed':
      return 'bg-status-red';
    case 'running':
      return 'bg-status-blue';
    case 'partial':
    case 'uncertain':
      return 'bg-status-amber';
    default:
      return 'bg-text-muted';
  }
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'running...';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60_000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${(diffMs / 60_000).toFixed(1)}m`;
}

export function ExecutionTrace({ tasks }: ExecutionTraceProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Take last 10 tasks, ordered most recent first for display
  const displayTasks = tasks.slice(-10).reverse();

  if (displayTasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Execution Trace
        </h3>
        <p className="text-sm text-text-muted">No recent tasks</p>
      </div>
    );
  }

  const expandedTask = expandedTaskId
    ? displayTasks.find((t) => t.id === expandedTaskId) ?? null
    : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Execution Trace
      </h3>

      {/* Vertical task list */}
      <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
        {displayTasks.map((task) => {
          const isExpanded = task.id === expandedTaskId;
          return (
            <button
              key={task.id}
              onClick={() =>
                setExpandedTaskId(isExpanded ? null : task.id)
              }
              className={cn(
                'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-all',
                taskBgColor(task.status),
                isExpanded && 'ring-1 ring-accent',
              )}
            >
              <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', taskDotColor(task.status))} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">
                {task.description}
              </span>
              <span className="flex-shrink-0 text-[10px] text-text-muted">
                {formatDuration(task.startedAt, task.completedAt)}
              </span>
              <span className="flex-shrink-0 text-[10px] capitalize text-text-muted">
                {task.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {expandedTask && (
        <div className="mt-3 rounded-md border border-border bg-surface-hover p-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-text-muted">Description</span>
              <p className="mt-0.5 font-medium text-text-primary">
                {expandedTask.description}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Status</span>
              <p className="mt-0.5 font-medium capitalize text-text-primary">
                {expandedTask.status}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Tokens Used</span>
              <p className="mt-0.5 font-medium text-text-primary">
                {formatTokens(expandedTask.tokensUsed)}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Cost</span>
              <p className="mt-0.5 font-medium text-text-primary">
                {formatCost(expandedTask.costUSD)}
              </p>
            </div>
            {expandedTask.model && (
              <div>
                <span className="text-text-muted">Model</span>
                <p className="mt-0.5 font-medium text-text-primary">
                  {expandedTask.model}
                </p>
              </div>
            )}
            <div>
              <span className="text-text-muted">Duration</span>
              <p className="mt-0.5 font-medium text-text-primary">
                {formatDuration(expandedTask.startedAt, expandedTask.completedAt)}
              </p>
            </div>
          </div>

          {expandedTask.errorMessage && (
            <div className="mt-3 rounded border border-red-900/40 bg-red-900/20 p-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-status-red">
                Error
              </span>
              <p className="mt-1 font-mono text-xs text-status-red">
                {expandedTask.errorMessage}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
