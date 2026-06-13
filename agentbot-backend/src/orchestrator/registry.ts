import { pool } from '../lib/db';
import { AgentInstance, INetworkManager, IStorageProvider, AgentStatus } from './types';
import { log } from '../lib/logger';

const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');

/**
 * RegistryService handles persistence of agent state and network configuration
 * using the PostgreSQL database.
 */
export class RegistryService implements INetworkManager, IStorageProvider {
  
  // --- INetworkManager ---

  async allocatePort(agentId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check if agent already has a port
      const existing = await client.query(
        'SELECT assigned_port FROM agent_network_config WHERE agent_id = $1',
        [agentId]
      );

      if (existing.rows[0]?.assigned_port) {
        await client.query('COMMIT');
        return existing.rows[0].assigned_port;
      }

      // 2. Find the next available port
      // We use the same offset logic: port and port + 2 must be free
      // To ensure atomicity and prevent race conditions across processes, 
      // we query for the max assigned port and find a gap or the next one.
      const usedPortsResult = await client.query(
        'SELECT assigned_port FROM agent_network_config ORDER BY assigned_port ASC'
      );
      
      const usedPorts = new Set(usedPortsResult.rows.map(r => r.assigned_port));
      // Also account for the offset (port + 2)
      usedPortsResult.rows.forEach(r => usedPorts.add(r.assigned_port + 2));

      let port = BASE_PORT;
      while (usedPorts.has(port) || usedPorts.has(port + 2)) {
        port++;
      }

      // 3. Assign the port
      await client.query(
        'INSERT INTO agent_network_config (agent_id, assigned_port) VALUES ($1, $2) ON CONFLICT (agent_id) DO UPDATE SET assigned_port = $2',
        [agentId, port]
      );

      await client.query('COMMIT');
      log.info('Registry', { details: { event: 'port_allocated', agentId, port } })
      return port;
    } catch (error) {
      await client.query('ROLLBACK');
      log.error('Registry', { error: { event: 'port_allocation_failed', agentId, error: String(error) } })
      throw error;
    } finally {
      client.release();
    }
  }

  async releasePort(agentId: string): Promise<void> {
    await pool.query(
      'UPDATE agent_network_config SET assigned_port = NULL WHERE agent_id = $1',
      [agentId]
    );
  }

  async getEndpoint(agentId: string): Promise<string> {
    const result = await pool.query(
      'SELECT endpoint_url FROM agent_network_config WHERE agent_id = $1',
      [agentId]
    );
    return result.rows[0]?.endpoint_url || '';
  }

  // --- IStorageProvider ---

  async createVolume(id: string): Promise<string> {
    // Volume name pattern
    return `openclaw-data-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }

  async deleteVolume(id: string): Promise<void> {
    // Volume deletion logic will be handled by the Runtime implementation (e.g. DockerRuntime)
    // but the Registry tracks the intent.
  }

  async backupVolume(id: string): Promise<string> {
    // Path for the backup file
    return `backups/agents/${id}/${new Date().getTime()}.tar.gz`;
  }

  async saveMetadata(agent: AgentInstance): Promise<void> {
    await pool.query(
      `INSERT INTO agent_runtime_state (agent_id, runtime_type, runtime_id, status, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (agent_id) DO UPDATE SET
         runtime_id = EXCLUDED.runtime_id,
         status = EXCLUDED.status,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [agent.id, agent.metadata.runtimeType || 'docker', agent.runtimeId, agent.status, agent.metadata]
    );
  }

  async getMetadata(id: string): Promise<AgentInstance | null> {
    const result = await pool.query(
      `SELECT r.*, n.assigned_port, n.endpoint_url 
       FROM agent_runtime_state r
       LEFT JOIN agent_network_config n ON r.agent_id = n.agent_id
       WHERE r.agent_id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const baseInstance: AgentInstance = {
      id: row.agent_id,
      name: row.metadata?.name || row.agent_id,
      plan: row.resource_plan || 'solo',
      status: row.status as AgentStatus,
      runtimeId: row.runtime_id,
      endpoint: row.endpoint_url,
      metadata: row.metadata
    };

    // Onchain governance enforcement is not yet wired — placeholder for future integration

    return baseInstance;
  }
}
