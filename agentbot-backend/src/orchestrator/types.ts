/**
 * Core interfaces for the Agentbot Orchestrator
 */

export type AgentStatus = 'active' | 'stopped' | 'provisioning' | 'failed';

export interface AgentInstance {
  id: string;
  name: string;
  plan: string;
  status: AgentStatus;
  runtimeId?: string; // Container ID or Service ID
  endpoint?: string;  // Public URL
  metadata: Record<string, unknown>;
}

export interface RuntimeOptions {
  image: string;
  memory: string;
  cpus: string;
  env: Record<string, string>;
  ports: Record<number, number>; // ContainerPort -> HostPort
  volumes: Array<{ source: string; target: string }>;
}

export interface IAgentRuntime {
  deploy(id: string, options: RuntimeOptions): Promise<AgentInstance>;
  start(id: string): Promise<void>;
  stop(id: string): Promise<void>;
  status(id: string): Promise<AgentInstance>;
  list(): Promise<AgentInstance[]>;
  destroy(id: string): Promise<void>;
  logs(id: string, lines: number): Promise<string>;
}

export interface INetworkManager {
  allocatePort(agentId: string): Promise<number>;
  releasePort(agentId: string): Promise<void>;
  getEndpoint(agentId: string): Promise<string>;
}

export interface IStorageProvider {
  createVolume(id: string): Promise<string>;
  deleteVolume(id: string): Promise<void>;
  backupVolume(id: string): Promise<string>;
  saveMetadata(agent: AgentInstance): Promise<void>;
  getMetadata(id: string): Promise<AgentInstance | null>;
}
