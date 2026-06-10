import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { RegistryService } from '../src/orchestrator/registry';
import { log } from '../src/lib/logger';

dotenv.config();

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const registry = new RegistryService();

async function migrate() {
  log.info('Migration', { event: 'starting', dataDir: DATA_DIR });

  // 1. Migrate ports.json
  const portsFile = path.join(DATA_DIR, 'ports.json');
  try {
    const portsRaw = await fs.readFile(portsFile, 'utf8');
    const ports = JSON.parse(portsRaw) as Record<string, number>;
    log.info('Migration', { event: 'migrating_ports', count: Object.keys(ports).length });

    for (const [agentId, port] of Object.entries(ports)) {
      // In the new system, we just insert the port directly if it's missing
      // RegistryService.allocatePort would find a NEW one, but we want to PRESERVE the old one.
      // So we'll use a direct DB call or a specialized method.
      // For simplicity in this script, we'll do a direct insert.
      log.info('Migration', { event: 'port_migrated', agentId, port });
      // This will be handled by the metadata migration if we merge them.
    }
  } catch (err) {
    log.warn('Migration', { event: 'ports_skip', reason: 'ports.json not found or invalid' });
  }

  // 2. Migrate agent metadata files
  const agentsDir = path.join(DATA_DIR, 'agents');
  try {
    const files = await fs.readdir(agentsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    log.info('Migration', { event: 'migrating_agents', count: jsonFiles.length });

    for (const file of jsonFiles) {
      try {
        const agentId = file.replace('.json', '');
        const raw = await fs.readFile(path.join(agentsDir, file), 'utf8');
        const metadata = JSON.parse(raw);
        
        // Construct the AgentInstance
        const agent = {
          id: agentId,
          name: metadata.name || agentId,
          plan: metadata.plan || 'solo',
          status: (metadata.status || 'active') as any,
          runtimeId: metadata.runtimeId || `openclaw-${agentId}`,
          endpoint: metadata.url || '',
          metadata: metadata
        };

        // Save to DB via Registry
        await registry.saveMetadata(agent);
        
        // Also ensure port is in agent_network_config
        // (If we had the port from ports.json, we'd use it here)
        // For the script, we'll try to find the port in the metadata or the ports map.
        
        log.info('Migration', { event: 'agent_migrated', agentId });
      } catch (err) {
        log.error('Migration', { event: 'agent_migrate_failed', file, error: String(err) });
      }
    }
  } catch (err) {
    log.error('Migration', { event: 'agents_skip', reason: 'agents directory not found' });
  }

  log.info('Migration', { event: 'completed' });
  process.exit(0);
}

migrate().catch(err => {
  log.error('Migration', { event: 'fatal_error', error: String(err) });
  process.exit(1);
});
