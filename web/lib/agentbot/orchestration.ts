// Orchestration adapter — stub until platform orchestration API is wired.
// TODO(P2): Wire to agentbot-backend orchestration endpoints when available.
// Currently returns empty arrays; only used by /app/orchestration UI which is
// behind a feature flag, so this is non-blocking until that flag flips on.

export interface OrchestrationTask {
  id: string
  agentId: string
  type: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  createdAt: string
}

export async function listOrchestrationTasks(_agentId: string): Promise<OrchestrationTask[]> {
  // TODO(P2): Replace with real orchestration API call when backend route lands
  return []
}
