import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface AgentNode {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  metadata: any;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export class MissionControlService {
  /**
   * Generates the constellation graph for a user's agent fleet.
   */
  static async getFleetGraph(userId: number): Promise<{ nodes: AgentNode[]; edges: AgentEdge[] }> {
    const agentsResult = await pool.query(
      'SELECT id, name, config FROM agents WHERE user_id = $1',
      [userId]
    );

    const nodes: AgentNode[] = agentsResult.rows.map(a => ({
      id: a.id.toString(),
      name: a.name,
      type: a.config.agentType || 'general',
      status: 'active',
      metadata: a.config
    }));

    // Generate edges based on A2A coordination logs
    const edgesResult = await pool.query(
      `SELECT DISTINCT metadata->'from'->>'agentId' as source, metadata->'to'->>'agentId' as target, action as label
       FROM treasury_transactions 
       WHERE user_id = $1 AND category = 'agent_message'`,
      [userId]
    );

    const edges: AgentEdge[] = edgesResult.rows.map((e, idx) => ({
      id: `edge-${idx}`,
      source: e.source,
      target: e.target,
      label: e.label
    }));

    return { nodes, edges };
  }

  /**
   * Fetches real-time execution traces for a fleet.
   */
  static async getTraces(userId: number): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM treasury_transactions WHERE user_id = $1 AND category IN (\'agent_message\', \'ai_metric\') ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return result.rows;
  }

  /**
   * Calculates per-agent cost attribution.
   */
  static async getCostMetrics(userId: number): Promise<any> {
    const result = await pool.query(
      `SELECT agent_id, SUM(amount_usdc) as total_spend, category
       FROM treasury_transactions 
       WHERE user_id = $1 
       GROUP BY agent_id, category`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Fetches talent bookings for a user's agents.
   */
  static async getBookings(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT b.*, e.name as event_name 
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE e.agent_id IN (SELECT id FROM agents WHERE user_id = $1)
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}
