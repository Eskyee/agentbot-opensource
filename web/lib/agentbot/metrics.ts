// Metrics adapter — derives from colony tree data.
// TODO: Wire to dedicated metrics API when available.

export interface ColonyMetrics {
  tasksToday: number
  successRate: number
  avgFitness: number
  colonySize: number
}

export async function getColonyMetrics(): Promise<ColonyMetrics> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/colony/status?action=tree`, { cache: 'no-store' })
    if (!res.ok) return { tasksToday: 0, successRate: 0, avgFitness: 0, colonySize: 0 }
    const tree = await res.json()
    return {
      tasksToday: tree.root?.soul?.total_cycles ?? 0,
      successRate: tree.avg_fitness ? tree.avg_fitness / 100 : 0,
      avgFitness: tree.avg_fitness ?? 0,
      colonySize: tree.colony_size ?? 0,
    }
  } catch {
    return { tasksToday: 0, successRate: 0, avgFitness: 0, colonySize: 0 }
  }
}
