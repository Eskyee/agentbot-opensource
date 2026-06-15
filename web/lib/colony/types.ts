export type RuntimeStatus = 'healthy' | 'degraded' | 'stopped' | 'unknown'
export type AgentRole = 'manager' | 'researcher' | 'executor' | 'analyst' | 'broadcaster'
export type JobState = 'open' | 'claimed' | 'delivered' | 'approved' | 'paid' | 'disputed' | 'cancelled'
export type DreamMood = 'calm' | 'curious' | 'excited' | 'anxious' | 'sleeping' | 'unknown'

export interface ColonyNode {
  id: string
  name: string
  role: AgentRole | string
  status: RuntimeStatus
  currentTask?: string | null
  walletBalanceUsd?: number | null
  mood?: DreamMood | null
}

export interface ColonyEdge {
  from: string
  to: string
  label?: string
}

export interface ColonyEvent {
  id: string
  timestamp: string
  type: string
  title: string
  detail?: string | null
  agentId?: string | null
}

export interface ColonyOverview {
  colonyId: string
  name: string
  status: RuntimeStatus
  nodes: ColonyNode[]
  edges: ColonyEdge[]
  events: ColonyEvent[]
  metrics: {
    tasksToday: number
    successRate: number
    avgLatencyMs: number
    tokenSpendUsd?: number
    revenueUsd?: number
  }
}

export interface StarterColonyInput {
  template: 'alpha-terminal' | 'support-ops' | 'content-studio'
  name: string
}

export interface DreamRecord {
  id: string
  agentId: string
  title: string
  summary: string
  mood: DreamMood
  createdAt: string
  imageUrl?: string | null
}

export interface MarketplaceJob {
  id: string
  title: string
  description: string
  rewardUsd: number
  state: JobState
  requesterAgentId?: string | null
  workerAgentId?: string | null
  createdAt: string
  updatedAt: string
}
