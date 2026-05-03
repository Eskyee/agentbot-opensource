'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { FleetStatus } from './components/FleetStatus'
import { StatsBar } from './components/StatsBar'
import { RunTimeline } from './components/RunTimeline'
import { IdentityPanel } from './components/IdentityPanel'
import { SkillsPanel } from './components/SkillsPanel'
import { BottomBar } from './components/BottomBar'
import { AICoach } from './components/AICoach'
import { AIPalette } from './components/AIPalette'

interface FleetStats {
  running: number
  total: number
  throughput: { callsPerMin: number; p95: number }
  verifiedFacts: { percent: number; mirrorLag: number }
  errors: { percent: number; flagged: string[] }
  spend24h: { amount: number; budgetPercent: number }
}

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

interface IdentityData {
  did: string
  algo: string
  issued: string
  lastSig: string
  guard: string
  rotation: { inDays: number; auto: boolean }
  facts: { count: number; leaf: string; lag: number; lastCommit: string }
}

interface Skill {
  name: string
  version: string
  type: string
  calls24h: number
}

export default function OpsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [stats, setStats] = useState<FleetStats | null>(null)
  const [agentDetail, setAgentDetail] = useState<{
    identity: IdentityData | null
    skills: Skill[]
    recentRuns: RunTrace[]
    model?: string
    workflow?: string
  }>({ identity: null, skills: [], recentRuns: [] })

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/ops/fleet')
        if (!res.ok) return
        const data = await res.json()
        setStats(data.stats)
      } catch {
        // silent
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [])

  // Fetch agent detail when selected
  const fetchAgentDetail = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/ops/fleet/${agentId}`)
      if (!res.ok) return
      const data = await res.json()
      setAgentDetail({
        identity: data.identity || null,
        skills: data.skills || [],
        recentRuns: data.recentRuns || [],
        model: data.node?.model,
        workflow: data.recentRuns?.[0]?.workflow,
      })
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentDetail(selectedAgent)
    } else {
      setAgentDetail({ identity: null, skills: [], recentRuns: [] })
    }
  }, [selectedAgent, fetchAgentDetail])

  const coachContext = selectedAgent ? { agentId: selectedAgent } : null

  return (
    <DashboardShell>
      <DashboardHeader
        title="OPS COMMAND CENTER"
        subtitle="Fleet, agents, workflows, and swarms — unified operations view"
        icon={<span className="text-lg">◈</span>}
      />
      <DashboardContent>
        {/* ⌘K Command Palette */}
        <AIPalette />

        {/* Keyboard hint */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Press</span>
          <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded-none text-[10px] text-zinc-500 font-mono">⌘K</kbd>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">for command palette</span>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Main grid: left fleet, right detail panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column — Fleet Nodes */}
          <div className="lg:col-span-1">
            <FleetStatus onSelect={setSelectedAgent} selected={selectedAgent} />
          </div>

          {/* Right column — Run Timeline + Identity + Skills + AI Coach */}
          <div className="lg:col-span-2 space-y-4">
            <RunTimeline runs={agentDetail.recentRuns} agentId={selectedAgent ?? undefined} />
            <IdentityPanel identity={agentDetail.identity} agentId={selectedAgent ?? undefined} />
            <SkillsPanel skills={agentDetail.skills} agentId={selectedAgent ?? undefined} />
            <AICoach context={coachContext} />
          </div>
        </div>

        {/* Bottom spacing for fixed bottom bar */}
        <div className="h-10" />
      </DashboardContent>

      {/* Bottom Status Bar */}
      <BottomBar
        focusedAgent={selectedAgent}
        activeWorkflow={agentDetail.workflow}
        model={agentDetail.model}
        queueDepth={13}
        uplinkOk={true}
        advisoryCount={selectedAgent ? 0 : 1}
      />
    </DashboardShell>
  )
}
