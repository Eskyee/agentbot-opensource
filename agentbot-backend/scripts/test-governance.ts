import { RegistryService } from '../src/orchestrator/registry';
import { governance } from '../src/orchestrator/governance';
import { pool } from '../src/lib/db';
import { log } from '../src/lib/logger';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test Governance Script
 * Demonstrates dynamic resource allocation based on $AGENT staking.
 */
async function testGovernance() {
  const agentId = 'governance-test-agent';
  const walletAddress = '0x1234567890123456789012345678901234567890';
  const registry = new RegistryService();

  log.info('Test', { msg: 'Starting Governance Simulation', agentId, walletAddress });

  try {
    // 1. Setup mock agent in DB with a wallet
    await pool.query(
      `INSERT INTO agent_runtime_state (agent_id, runtime_type, status, metadata)
       VALUES ($1, 'docker', 'active', $2)
       ON CONFLICT (agent_id) DO UPDATE SET metadata = $2`,
      [agentId, { name: 'Governance Test', walletAddress }]
    );

    // 2. Mock the governance check (in a real test we'd mock the RPC call)
    // For this simulation, we'll just log the logic path.
    log.info('Test', { msg: 'Querying dynamic metadata...' });
    
    const instance = await registry.getMetadata(agentId);
    
    if (instance) {
      log.info('Test', { 
        msg: 'Dynamic Metadata Result', 
        agentId: instance.id, 
        plan: instance.plan,
        stakedWallet: instance.metadata.walletAddress
      });
      
      console.log(`\n--- GOVERNANCE RESULT ---`);
      console.log(`Agent: ${instance.id}`);
      console.log(`Verified Plan (based on stake): ${instance.plan.toUpperCase()}`);
      console.log(`-------------------------\n`);
    }

  } catch (error) {
    log.error('Test', { msg: 'Simulation failed', error: String(error) });
  } finally {
    process.exit(0);
  }
}

testGovernance();
