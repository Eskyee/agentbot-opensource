// Orchestration adapter — stub until platform orchestration API is wired.
// TODO: Wire to agentbot-backend orchestration endpoints when available.

export interface OrchestrationTask {
  id: string
  agentId: string
  type: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  createdAt: string
}

export async function listOrchestrationTasks(_agentId: string): Promise<OrchestrationTask[]> {
  // TODO: Replace with real orchestration API call
  return []
}
