/**
 * Shared agent-registration queries.
 *
 * Hosts the small number of helpers that previously got duplicated across
 * routes/agents.ts and routes/provision.ts. Living here means a single
 * SQL change covers every plan-limit enforcement path on the API.
 */

import { pool } from './db';

/** Returns the number of active agents for this email from the DB. */
export async function getAgentCount(email: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM agent_registrations
     WHERE user_id = $1 AND status = 'active'`,
    [email]
  );
  return parseInt(result.rows[0]?.cnt ?? '0', 10);
}
