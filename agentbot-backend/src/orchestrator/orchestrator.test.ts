jest.mock('../lib/logger', () => ({ log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

// Mock runtime and registry before importing orchestrator
const mockRuntimeInstance = {
  deploy: jest.fn().mockResolvedValue({ id: 'test', name: 'Test', plan: 'solo', status: 'active', metadata: {} }),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  status: jest.fn().mockResolvedValue({ id: 'test', name: 'Test', plan: 'solo', status: 'active', metadata: {} }),
  list: jest.fn().mockResolvedValue([]),
  destroy: jest.fn().mockResolvedValue(undefined),
  logs: jest.fn().mockResolvedValue('logs'),
};

const mockRegistryInstance = {
  allocatePort: jest.fn().mockResolvedValue(19000),
  releasePort: jest.fn().mockResolvedValue(undefined),
  saveMetadata: jest.fn().mockResolvedValue(undefined),
  getMetadata: jest.fn().mockResolvedValue(null),
};

jest.mock('./docker', () => ({ DockerRuntime: jest.fn(() => mockRuntimeInstance) }));
jest.mock('./railway', () => ({ RailwayRuntime: jest.fn(() => mockRuntimeInstance) }));
jest.mock('./kubernetes', () => ({ KubernetesRuntime: jest.fn(() => mockRuntimeInstance) }));
jest.mock('./registry', () => ({ RegistryService: jest.fn(() => mockRegistryInstance) }));

import { AgentOrchestrator } from './index';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new AgentOrchestrator();
  });

  it('should deploy agent', async () => {
    const result = await orchestrator.deployAgent('agent-1', {
      image: 'test:latest', memory: '2g', cpus: '1', env: {}, ports: {}, volumes: [], name: 'Test', plan: 'solo',
    });
    expect(result).toBeDefined();
    expect(mockRuntimeInstance.deploy).toHaveBeenCalled();
  });

  it('should create agent', async () => {
    await orchestrator.createAgent('agent-1', { name: 'Test' });
    expect(mockRegistryInstance.saveMetadata).toHaveBeenCalled();
  });

  it('should list agents', async () => {
    const result = await orchestrator.listAgents();
    expect(Array.isArray(result)).toBe(true);
    expect(mockRuntimeInstance.list).toHaveBeenCalled();
  });

  it('should return null for unknown agent', async () => {
    const result = await orchestrator.getAgentStatus('unknown');
    expect(result).toBeNull();
  });

  it('should stop agent', async () => {
    mockRegistryInstance.getMetadata.mockResolvedValueOnce({ id: 'a', name: 'A', plan: 'solo', status: 'active', metadata: {} });
    await orchestrator.stopAgent('agent-1');
    expect(mockRuntimeInstance.stop).toHaveBeenCalled();
  });

  it('should start agent', async () => {
    mockRegistryInstance.getMetadata.mockResolvedValueOnce({ id: 'a', name: 'A', plan: 'solo', status: 'stopped', metadata: {} });
    await orchestrator.startAgent('agent-1');
    expect(mockRuntimeInstance.start).toHaveBeenCalled();
  });

  it('should delete agent', async () => {
    await orchestrator.deleteAgent('agent-1');
    expect(mockRuntimeInstance.destroy).toHaveBeenCalled();
    expect(mockRegistryInstance.releasePort).toHaveBeenCalled();
  });
});
