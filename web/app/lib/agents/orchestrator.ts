import { SubAgentType, SubAgentTask, SubAgentResult, AgentOrchestrator } from './types';
import { getSubAgentConfig, SUB_AGENT_CONFIGS } from './subagents';
import { routeTask, createSubAgentTask, executeSubAgent } from './router';

export class AgentOrchestratorImpl implements AgentOrchestrator {
  private taskQueue: SubAgentTask[] = [];
  private results: Map<string, SubAgentResult> = new Map();

  async route(task: SubAgentTask): Promise<SubAgentResult> {
    const decision = routeTask(task);
    task.type = decision.type;

    console.log(`[Orchestrator] Routing task ${task.id} to ${decision.type} (${decision.reason})`);

    const result = await executeSubAgent(task);
    this.results.set(task.id, result);

    return result;
  }

  async routeToSubAgent(
    type: SubAgentType,
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<SubAgentResult> {
    const task = createSubAgentTask(type, prompt, context);
    return this.route(task);
  }

  getSubAgent(type: SubAgentType) {
    return getSubAgentConfig(type);
  }

  async orchestrate(
    userPrompt: string,
    context?: Record<string, unknown>
  ): Promise<{
    primary: SubAgentResult;
    subAgents?: SubAgentResult[];
  }> {
    const decision = routeTask(createSubAgentTask('research', userPrompt));

    const primary = await this.routeToSubAgent(decision.type, userPrompt, context);

    return { primary };
  }

  getAvailableAgents() {
    return Object.values(SUB_AGENT_CONFIGS).map((config) => ({
      type: config.type,
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
    }));
  }

  getTaskResult(taskId: string): SubAgentResult | undefined {
    return this.results.get(taskId);
  }
}

let orchestratorInstance: AgentOrchestratorImpl | null = null;

export function getOrchestrator(): AgentOrchestratorImpl {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestratorImpl();
  }
  return orchestratorInstance;
}
