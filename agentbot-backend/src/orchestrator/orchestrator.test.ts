import { RegistryService } from './registry';
import { DockerRuntime } from './docker';
import { AgentOrchestrator } from './index';
import { pool } from '../lib/db';
import { runCommand } from '../utils/secure-exec';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../utils/secure-exec', () => ({
  runCommand: jest.fn(),
  SecureExec: {
    dockerBackup: jest.fn(),
    provisionConfig: jest.fn(),
  },
}));

jest.mock('../lib/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ─── RegistryService Tests ─────────────────────────────────────────────────

describe('RegistryService', () => {
  let registry: RegistryService;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new RegistryService();
  });

  describe('allocatePort', () => {
    it('should return existing port if already allocated', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ assigned_port: 19001 }] }) // Check existing
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      const port = await registry.allocatePort('test-agent');
      expect(port).toBe(19001);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT assigned_port'),
        ['test-agent']
      );
    });

    it('should allocate next available port if not allocated', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // Check existing
          .mockResolvedValueOnce({ rows: [{ assigned_port: 19000 }] }) // Get used ports
          .mockResolvedValueOnce({}) // Insert new port
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      const port = await registry.allocatePort('new-agent');
      
      // BASE_PORT is 19000. 
      // usedPorts will contain {19000, 19002}.
      // while loop:
      // port 19000: usedPorts.has(19000) is true. port++
      // port 19001: usedPorts.has(19001) is false, usedPorts.has(19003) is false. loop ends.
      expect(port).toBe(19001);
    });
  });
});

// ─── DockerRuntime Tests ────────────────────────────────────────────────────

describe('DockerRuntime', () => {
  let runtime: DockerRuntime;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      createVolume: jest.fn().mockResolvedValue('test-vol'),
      deleteVolume: jest.fn(),
    };
    runtime = new DockerRuntime(mockStorage);
  });

  describe('status', () => {
    it('should parse active status from running container', async () => {
      (runCommand as jest.Mock).mockResolvedValue({
        stdout: 'container-id|running|2026-06-10T00:00:00Z',
        stderr: '',
      });

      const instance = await runtime.status('test-agent');
      expect(instance.status).toBe('active');
      expect(instance.runtimeId).toBe('container-id');
    });

    it('should parse stopped status from exited container', async () => {
      (runCommand as jest.Mock).mockResolvedValue({
        stdout: 'container-id|exited|2026-06-10T00:00:00Z',
        stderr: '',
      });

      const instance = await runtime.status('test-agent');
      expect(instance.status).toBe('stopped');
    });
  });
});

// ─── AgentOrchestrator Tests ───────────────────────────────────────────────

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new AgentOrchestrator();
  });

  describe('deployAgent', () => {
    it('should coordinate port allocation and runtime deployment', async () => {
      // 1. Mock Port Allocation (RegistryService)
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ assigned_port: 19005 }] }) // Existing
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // 2. Mock Runtime Deployment (DockerRuntime)
      (runCommand as jest.Mock).mockResolvedValue({
        stdout: 'new-container-id|running|2026-06-10T00:00:00Z',
        stderr: '',
      });

      // 3. Mock Metadata Save (RegistryService.saveMetadata)
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const options = {
        image: 'agent-image',
        memory: '2g',
        cpus: '1',
        env: { KEY: 'VAL' },
        ports: {},
        volumes: [],
        name: 'Test Agent',
        plan: 'solo'
      };

      const instance = await orchestrator.deployAgent('test-id', options);

      expect(instance.status).toBe('active');
      expect(instance.name).toBe('Test Agent');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_runtime_state'),
        expect.any(Array)
      );
    });
  });
});
