import { promises as fs } from 'fs';
import path from 'path';
import { sanitizeAgentId } from './docker';
import { snapshotAgentState } from '../services/gitlawb';

export type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  aiProvider?: string;
  port?: number;
  subdomain?: string;
  url?: string;
  status?: string;
  openclawVersion?: string;
  botUsername?: string;
  metadata?: Record<string, unknown>;
  gatewayToken?: string;
  config?: Record<string, unknown>;
  verified?: boolean;
  verificationType?: string;
  attestationUid?: string;
  verifierAddress?: string;
  verifiedAt?: string;
  verificationMetadata?: Record<string, unknown>;
};

export const agentFilePath = (dataDir: string, agentId: string): string =>
  path.join(dataDir, 'agents', `${sanitizeAgentId(agentId)}.json`);

export const readAgentMetadata = async (dataDir: string, agentId: string): Promise<AgentMetadata | null> => {
  try {
    const raw = await fs.readFile(agentFilePath(dataDir, agentId), 'utf8');
    return JSON.parse(raw) as AgentMetadata;
  } catch {
    return null;
  }
};

export const writeAgentMetadata = async (dataDir: string, agent: AgentMetadata): Promise<void> => {
  await fs.writeFile(agentFilePath(dataDir, agent.agentId), JSON.stringify(agent, null, 2));
  await snapshotAgentState(agent.agentId, agent);
};
