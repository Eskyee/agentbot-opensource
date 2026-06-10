import { IAgentRuntime, INetworkManager, IStorageProvider, AgentInstance, RuntimeOptions } from './types';
import { RegistryService } from './registry';
import { DockerRuntime } from './docker';
import { RailwayRuntime } from './railway';
import { KubernetesRuntime } from './kubernetes';
import { log } from '../lib/logger';

/**
 * AgentOrchestrator is the high-level API for managing agents.
 * It coordinates between the Registry (state) and the Runtime (containers).
 */
export class AgentOrchestrator {
  private runtime: IAgentRuntime;
  private registry: RegistryService;

  constructor() {
    this.registry = new RegistryService();
    
    // Choose runtime based on environment
    const runtimeType = process.env.AGENT_RUNTIME || 'docker';
    if (runtimeType === 'railway') {
      this.runtime = new RailwayRuntime(this.registry);
    } else if (runtimeType === 'kubernetes' || runtimeType === 'k8s') {
      this.runtime = new KubernetesRuntime(this.registry);
    } else {
      this.runtime = new DockerRuntime(this.registry);
    }
    
    log.info('Orchestrator', { event: 'initialized', runtime: runtimeType });
  }

  /**
   * Deploys a new agent instance or updates an existing one.
   */
  async deployAgent(id: string, options: RuntimeOptions & { name: string, plan: string }): Promise<AgentInstance> {
    log.info('Orchestrator', { event: 'agent_deploy_request', id, plan: options.plan });

    try {
      // 1. Allocate port if not already assigned
      const port = await this.registry.allocatePort(id);
      options.ports[18789] = port; // Map OpenClaw's internal port

      // 2. Delegate to runtime for deployment
      const instance = await this.runtime.deploy(id, options);

      // 3. Update registry with metadata and status
      const fullInstance: AgentInstance = {
        ...instance,
        name: options.name,
        plan: options.plan,
        metadata: {
          ...instance.metadata,
          ...options.env, // Track some env vars in metadata
          image: options.image
        }
      };

      await this.registry.saveMetadata(fullInstance);
      
      log.info('Orchestrator', { event: 'agent_deploy_success', id, port });
      return fullInstance;
    } catch (error) {
      log.error('Orchestrator', { event: 'agent_deploy_failed', id, error: String(error) });
      throw error;
    }
  }

  /**
   * Creates an agent record without deploying it.
   */
  async createAgent(id: string, metadata: Record<string, any>): Promise<void> {
    const instance: AgentInstance = {
      id,
      name: metadata.name || id,
      plan: metadata.plan || 'solo',
      status: 'provisioning',
      metadata
    };
    await this.registry.saveMetadata(instance);
  }

  /**
   * Lists all managed agent instances.
   */
  async listAgents(): Promise<AgentInstance[]> {
    const runtimeAgents = await this.runtime.list();
    
    // Attempt to hydrate each with registry metadata
    return Promise.all(runtimeAgents.map(async (ra) => {
      const metadata = await this.registry.getMetadata(ra.id);
      if (!metadata) return ra;
      return {
        ...ra,
        name: metadata.name,
        plan: metadata.plan,
        metadata: {
          ...ra.metadata,
          ...metadata.metadata
        }
      };
    }));
  }

  /**
   * Retrieves the current status of an agent.
   */
  async getAgentStatus(id: string): Promise<AgentInstance | null> {
    const metadata = await this.registry.getMetadata(id);
    if (!metadata) return null;

    const runtimeStatus = await this.runtime.status(id);
    
    // Merge database metadata with live runtime state
    return {
      ...metadata,
      status: runtimeStatus.status,
      runtimeId: runtimeStatus.runtimeId,
      metadata: {
        ...metadata.metadata,
        ...runtimeStatus.metadata
      }
    };
  }

  /**
   * Stops a running agent.
   */
  async stopAgent(id: string): Promise<void> {
    await this.runtime.stop(id);
    const status = await this.getAgentStatus(id);
    if (status) {
      status.status = 'stopped';
      await this.registry.saveMetadata(status);
    }
  }

  /**
   * Starts a stopped agent.
   */
  async startAgent(id: string): Promise<void> {
    await this.runtime.start(id);
    const status = await this.getAgentStatus(id);
    if (status) {
      status.status = 'active';
      await this.registry.saveMetadata(status);
    }
  }

  /**
   * Completely removes an agent and its data.
   */
  async deleteAgent(id: string): Promise<void> {
    await this.runtime.destroy(id);
    await this.registry.releasePort(id);
    // Note: We might want to keep the metadata row with status 'deleted' 
    // but for now we'll rely on the runtime/registry cleanup.
  }
}

// Export a singleton instance
export const orchestrator = new AgentOrchestrator();
