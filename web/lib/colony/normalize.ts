import type { ColonyOverview, ColonyNode, ColonyEvent, DreamMood, RuntimeStatus } from './types'

export function normalizeTreeToOverview(tree: any, id: string): ColonyOverview {
  const agents: ColonyNode[] = (tree.agents ?? []).map((a: any) => ({
    id: a.id,
    name: a.name ?? a.designation ?? 'Agent',
    role: a.specialization ?? 'executor',
    status: normalizeStatus(a.status),
    currentTask: a.soul?.active_plan
      ? `Step ${a.soul.active_plan.current_step}/${a.soul.active_plan.total_steps}: ${a.soul.active_plan.status}`
      : null,
    walletBalanceUsd: a.walletBalance ? parseFloat(a.walletBalance.formatted ?? '0') : null,
    mood: fitnessToMood(a.fitness),
  }))

  const events: ColonyEvent[] = []
  if (tree.root?.soul?.active_plan) {
    const plan = tree.root.soul.active_plan
    events.push({
      id: plan.id,
      timestamp: new Date().toISOString(),
      type: 'plan_active',
      title: `Active plan: step ${plan.current_step}/${plan.total_steps}`,
      detail: plan.status,
      agentId: tree.agents?.[0]?.id ?? null,
    })
  }

  return {
    colonyId: id,
    name: tree.root?.designation ?? 'Agentbot Colony',
    status: tree.degraded ? 'degraded' : (tree.colony_size > 0 ? ('healthy' as RuntimeStatus) : 'unknown'),
    nodes: agents,
    edges: buildEdges(tree.agents ?? []),
    events,
    metrics: {
      tasksToday: tree.root?.soul?.total_cycles ?? 0,
      successRate: tree.avg_fitness ? tree.avg_fitness / 100 : 0,
      avgLatencyMs: 0,
      tokenSpendUsd: undefined,
      revenueUsd: undefined,
    },
  }
}

function normalizeStatus(s: string): RuntimeStatus {
  if (s === 'active') return 'healthy' as RuntimeStatus
  if (s === 'culling') return 'stopped'
  if (s === 'stale') return 'degraded'
  return 'unknown'
}

function fitnessToMood(fitness: number): DreamMood {
  if (fitness >= 80) return 'excited'
  if (fitness >= 60) return 'curious'
  if (fitness >= 40) return 'calm'
  if (fitness >= 20) return 'anxious'
  return 'sleeping'
}

function buildEdges(agents: any[]) {
  return agents
    .filter((a: any) => a.parent)
    .map((a: any) => ({ from: a.parent, to: a.id, label: 'spawned' }))
}
