'use client'

import { useState } from 'react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { FleetStatus } from './components/FleetStatus'
import { AgentList } from './components/AgentList'
import { WorkflowList } from './components/WorkflowList'
import { SwarmList } from './components/SwarmList'
import { AICoach } from './components/AICoach'
import { AIPalette } from './components/AIPalette'
import { AuditTrail } from './components/AuditTrail'

export default function OpsPage() {
  const [selectedFleet, setSelectedFleet] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const coachContext = selectedAgent
    ? { agentId: selectedAgent }
    : selectedFleet
      ? { fleetData: { designation: selectedFleet } }
      : null

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

        {/* Main grid: left 1/3, right 2/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column — stacked cards */}
          <div className="lg:col-span-1 space-y-4">
            <FleetStatus onSelect={setSelectedFleet} selected={selectedFleet} />
            <AgentList onSelect={setSelectedAgent} selected={selectedAgent} />
            <WorkflowList />
            <SwarmList />
          </div>

          {/* Right column — AI Coach + Audit Trail */}
          <div className="lg:col-span-2 space-y-4">
            <AICoach context={coachContext} />
            <AuditTrail />
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
