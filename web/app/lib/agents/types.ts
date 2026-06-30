export type SubAgentType = 'coding' | 'research' | 'social' | 'voice' | 'data' | 'security';

export interface SubAgentConfig {
  type: SubAgentType;
  name: string;
  description: string;
  model: string;
  fallbackModel: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  capabilities: string[];
  requiredTools: string[];
}

export interface SubAgentTask {
  id: string;
  type: SubAgentType;
  prompt: string;
  context?: Record<string, unknown>;
  parentId?: string;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  timeout?: number;
}

export interface SubAgentResult {
  taskId: string;
  type: SubAgentType;
  status: 'success' | 'error' | 'timeout';
  output: string;
  metadata?: Record<string, unknown>;
  duration: number;
  tokensUsed: number;
}

export interface AgentOrchestrator {
  route(task: SubAgentTask): Promise<SubAgentResult>;
  routeToSubAgent(
    type: SubAgentType,
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<SubAgentResult>;
  getSubAgent(type: SubAgentType): SubAgentConfig;
}
