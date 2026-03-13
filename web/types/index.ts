export interface AgentTask {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'partial' | 'uncertain' | string;
  description: string;
  startedAt: string;
  completedAt: string | null;
  tokensUsed: number;
  costUSD: number;
  model?: string;
  errorMessage?: string;
}
