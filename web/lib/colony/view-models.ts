export interface AgentCardVM {
  id: string
  name: string
  role: string
  status: 'healthy' | 'degraded' | 'stopped' | 'unknown'
  currentTask: string | null
  walletBalanceUsd: number | null
  mood: string | null
  fitness: number
  walletAddress: string
  generation: number
}

export interface ColonyVM {
  id: string
  name: string
  status: string
  colonySize: number
  avgFitness: number
  agents: AgentCardVM[]
  soulActive: boolean
  soulMode: string
  totalCycles: number
  walletBalance: { formatted: string; token: string } | null
  activePlan: { currentStep: number; totalSteps: number; status: string } | null
  degraded: boolean
}

export function buildColonyVM(tree: any, id: string): ColonyVM {
  return {
    id,
    name: tree.root?.designation ?? 'Colony',
    status: tree.degraded ? 'degraded' : 'healthy',
    colonySize: tree.colony_size ?? 0,
    avgFitness: tree.avg_fitness ?? 0,
    degraded: tree.degraded ?? false,
    walletBalance: tree.root?.wallet_balance ?? null,
    soulActive: tree.root?.soul?.active ?? false,
    soulMode: tree.root?.soul?.mode ?? 'unknown',
    totalCycles: tree.root?.soul?.total_cycles ?? 0,
    activePlan: tree.root?.soul?.active_plan
      ? {
          currentStep: tree.root.soul.active_plan.current_step,
          totalSteps: tree.root.soul.active_plan.total_steps,
          status: tree.root.soul.active_plan.status,
        }
      : null,
    agents: (tree.agents ?? []).map((a: any): AgentCardVM => ({
      id: a.id,
      name: a.name ?? 'Agent',
      role: a.specialization ?? 'executor',
      status: a.status === 'active' ? 'healthy' : a.status === 'culling' ? 'stopped' : 'degraded',
      currentTask: null,
      walletBalanceUsd: null,
      mood: null,
      fitness: a.fitness ?? 0,
      walletAddress: a.walletAddress ?? '',
      generation: a.generation ?? 1,
    })),
  }
}
