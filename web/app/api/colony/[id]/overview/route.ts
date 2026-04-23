import { NextRequest, NextResponse } from 'next/server'
import type { ColonyOverview } from '@/lib/colony/types'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // TODO: Replace with real Colony / Orchestration / Health / Metrics API calls.
  // For now returns a typed stub so the UI has real shape to render against.
  const payload: ColonyOverview = {
    colonyId: id,
    name: id === 'friday-alpha' ? 'Friday Alpha Terminal' : `Colony ${id}`,
    status: 'healthy',
    nodes: [
      {
        id: 'agent-manager',
        name: 'Manager',
        role: 'manager',
        status: 'healthy',
        currentTask: 'Coordinating market summary',
        walletBalanceUsd: 24.2,
        mood: 'curious',
      },
      {
        id: 'agent-researcher',
        name: 'Researcher',
        role: 'researcher',
        status: 'healthy',
        currentTask: 'Scanning feeds',
        walletBalanceUsd: 14.9,
        mood: 'excited',
      },
      {
        id: 'agent-executor',
        name: 'Executor',
        role: 'executor',
        status: 'healthy',
        currentTask: 'Drafting output',
        walletBalanceUsd: 11.1,
        mood: 'calm',
      },
    ],
    edges: [
      { from: 'agent-manager', to: 'agent-researcher', label: 'dispatches' },
      { from: 'agent-researcher', to: 'agent-executor', label: 'hands off' },
      { from: 'agent-executor', to: 'agent-manager', label: 'reports' },
    ],
    events: [
      {
        id: 'evt_1',
        timestamp: new Date().toISOString(),
        type: 'summary_ready',
        title: 'Morning market summary generated',
        detail: 'Researcher and Executor completed briefing cycle',
        agentId: 'agent-manager',
      },
      {
        id: 'evt_2',
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        type: 'task_assigned',
        title: 'New task dispatched to Researcher',
        detail: 'Scanning 12 data sources for trend signals',
        agentId: 'agent-researcher',
      },
    ],
    metrics: {
      tasksToday: 18,
      successRate: 0.94,
      avgLatencyMs: 1820,
      tokenSpendUsd: 2.87,
      revenueUsd: 0,
    },
  }

  return NextResponse.json(payload)
}
