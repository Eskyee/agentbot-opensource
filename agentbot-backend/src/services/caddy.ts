/**
 * Caddy reverse proxy integration
 *
 * Manages subdomain routes for agent containers.
 * Migrated from api/server.js
 *
 * NOTE: This module is part of the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Currently not imported in the main application.
 *
 * FIXES APPLIED:
 *  - runCommand() calls updated to the spawn-based (cmd, args[]) API introduced
 *    in MED-06 — previously called with a shell string which would have thrown
 *    a TypeScript error after the utils/index.ts rewrite.
 *  - addCaddyRoute() / removeCaddyRoute() now accept an ownerUserId parameter.
 *    Callers MUST verify that the agentId belongs to ownerUserId before calling
 *    these functions. The functions themselves read agent metadata and assert
 *    ownership so even internal mis-calls are rejected.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { runCommand } from '../utils';

const CADDY_FILE = process.env.CADDY_FILE || '/etc/caddy/Caddyfile';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';

export interface CaddyRoute {
  subdomain: string;
  port: number;
}

/**
 * Read agent metadata JSON to verify ownership.
 * Returns null if the file does not exist or cannot be parsed.
 */
async function readAgentOwner(agentId: string): Promise<string | null> {
  // Sanitise before constructing a path (mirrors sanitizeAgentId in index.ts)
  const safeId = agentId.replace(/[^a-zA-Z0-9_-]/g, '');
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, 'agents', `${safeId}.json`),
      'utf8'
    );
    const meta = JSON.parse(raw) as { userId?: string };
    return meta.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Assert that ownerUserId actually owns agentId.
 * Throws if the check fails so all code paths are protected.
 */
async function assertOwnership(agentId: string, ownerUserId: string): Promise<void> {
  const storedOwner = await readAgentOwner(agentId);
  if (storedOwner === null) {
    // Agent metadata missing — refuse rather than fail open
    throw new Error(`Agent ${agentId} not found or has no owner record`);
  }
  if (storedOwner !== ownerUserId) {
    throw new Error(`Ownership check failed: user ${ownerUserId} does not own agent ${agentId}`);
  }
}

/**
 * Add a Caddy route for an agent.
 * Creates a subdomain that routes to the agent's container port.
 *
 * @param agentId     The agent identifier (sanitised internally)
 * @param port        The container port to proxy to
 * @param ownerUserId The authenticated user performing this action.
 *                    Ownership is verified against agent metadata before
 *                    any file writes occur.
 */
export const addCaddyRoute = async (
  agentId: string,
  port: number,
  ownerUserId: string
): Promise<string> => {
  // Ownership check — must pass before touching the Caddyfile
  await assertOwnership(agentId, ownerUserId);

  const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

  const routeBlock = `
${subdomain} {
    reverse_proxy localhost:${port}
}
`;

  // Read current Caddyfile
  let caddyContent = '';
  try {
    caddyContent = await fs.readFile(CADDY_FILE, 'utf8');
  } catch {
    // Caddyfile might not exist yet — start empty
    caddyContent = '';
  }

  // Idempotent — skip if route already exists
  if (caddyContent.includes(subdomain)) {
    console.log(`Caddy route already exists for ${subdomain}`);
    return subdomain;
  }

  // Append route and reload
  await fs.appendFile(CADDY_FILE, routeBlock);
  console.log(`Added Caddy route: ${subdomain} -> localhost:${port}`);

  await reloadCaddy();
  return subdomain;
};

/**
 * Remove a Caddy route for an agent.
 *
 * @param agentId     The agent identifier
 * @param ownerUserId The authenticated user performing this action.
 */
export const removeCaddyRoute = async (agentId: string, ownerUserId: string): Promise<void> => {
  // Ownership check — must pass before touching the Caddyfile
  await assertOwnership(agentId, ownerUserId);

  const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

  let caddyContent = '';
  try {
    caddyContent = await fs.readFile(CADDY_FILE, 'utf8');
  } catch {
    return; // Nothing to remove
  }

  // Remove route block: matches `\nsubdomain { ... }`
  const escapedSubdomain = subdomain.replace(/\./g, '\\.');
  const regex = new RegExp(`\\n${escapedSubdomain}\\s*\\{[^}]*\\}`, 'g');
  const newContent = caddyContent.replace(regex, '');

  if (newContent !== caddyContent) {
    await fs.writeFile(CADDY_FILE, newContent);
    console.log(`Removed Caddy route for ${subdomain}`);
    await reloadCaddy();
  }
};

/**
 * Reload Caddy configuration.
 * Tries systemd first, then falls back to caddy CLI.
 * Uses spawn (no shell) for both commands.
 */
const reloadCaddy = async (): Promise<void> => {
  try {
    await runCommand('systemctl', ['reload', 'caddy']);
    console.log('Caddy reloaded via systemctl');
  } catch {
    try {
      await runCommand('caddy', ['reload', '--config', CADDY_FILE]);
      console.log('Caddy reloaded via CLI');
    } catch (error) {
      console.error('Failed to reload Caddy:', error);
      // Don't throw — route was written; a stale config is preferable to an error cascade
    }
  }
};

/** Returns the configured agents domain. */
export const getAgentsDomain = (): string => AGENTS_DOMAIN;

/** Returns the full HTTPS URL for an agent. */
export const getAgentUrl = (agentId: string): string =>
  `https://${agentId}.${AGENTS_DOMAIN}`;
