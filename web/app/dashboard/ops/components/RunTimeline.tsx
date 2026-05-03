'use client'

import { useState } from 'react'

interface TimelineStep {
  ts: string
  name: string
  detail: string
  durationMs: number
}

interface RunTrace {
  id: string
  workflow: string
  startedAt: string
  durationMs: number
  status: string
  steps: TimelineStep[]
}

interface RunTimelineProps {
  runs: RunTrace[]
  agentId?: string
}

type Tab = 'TIMELINE' | 'LOG' | 'FACTS'

function getDurationColor(ms: number): string {
  if (ms < 100) return 'text-green-400'
  if (ms <= 500) return 'text-yellow-400'
  return 'text-red-400'
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${ms}ms`
}

export function RunTimeline({ runs, agentId }: RunTimelineProps) {
  const [activeTab, setActiveTab] = useState<Tab>('TIMELINE')
  const [selectedRun, setSelectedRun] = useState(0)
  const tabs: Tab[] = ['TIMELINE', 'LOG', 'FACTS']
  const run = runs[selectedRun]

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          {agentId ? `Run Timeline` : 'Run Timeline'}
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono transition-colors border ${
                activeTab === tab
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                  : 'border-transparent text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!agentId ? (
        <div className="py-8 text-center">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Select an agent</div>
          <div className="text-[11px] text-zinc-500">to view execution traces</div>
        </div>
      ) : runs.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">No runs yet</div>
          <div className="text-[11px] text-zinc-500">Execution traces will appear here</div>
        </div>
      ) : (
        <>
          {/* Run selector */}
          {runs.length > 1 && (
            <div className="flex gap-1 mb-3 overflow-x-auto">
              {runs.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRun(i)}
                  className={`px-2 py-1 text-[10px] font-mono border transition-colors ${
                    i === selectedRun
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {r.id}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {activeTab === 'TIMELINE' && run && (
            <div className="space-y-0.5">
              {run.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-2 py-1 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                >
                  <span className="text-[10px] font-mono text-zinc-600 shrink-0 w-16">{step.ts}</span>
                  <span className="text-[10px] font-mono text-zinc-300 shrink-0 w-28 truncate">{step.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 flex-1 min-w-0 truncate">{step.detail}</span>
                  <span className={`text-[10px] font-mono shrink-0 w-14 text-right ${getDurationColor(step.durationMs)}`}>
                    {formatDuration(step.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'LOG' && run && (
            <div className="space-y-0.5">
              {run.steps.map((step, i) => (
                <div key={i} className="text-[10px] font-mono text-zinc-400 px-2 py-0.5">
                  <span className="text-zinc-600">{step.ts}</span>{' '}
                  <span className={getDurationColor(step.durationMs)}>{step.name}</span>{' '}
                  <span className="text-zinc-500">{step.detail}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'FACTS' && run && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 px-2">
                Facts committed during this run:
              </div>
              {run.steps
                .filter((s) => s.name === 'state.commit' || s.name === 'audit.emit')
                .map((step, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-300">{step.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{step.detail}</span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
