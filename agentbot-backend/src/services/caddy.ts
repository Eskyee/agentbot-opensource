/**
 * Caddy reverse proxy integration
 * 
 * Manages subdomain routes for agent containers
 * Migrated from api/server.js
 * 
 * NOTE: This module is part of the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Currently not imported in the main application.
 */

import { promises as fs } from 'fs';
import { runCommand, escapeShellArg } from '../utils';

const CADDY_FILE = process.env.CADDY_FILE || '/etc/caddy/Caddyfile';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';

export interface CaddyRoute {
  subdomain: string;
  port: number;
}

/**
 * Add a Caddy route for an agent
 * Creates a subdomain that routes to the agent's container port
 */
export const addCaddyRoute = async (
  agentId: string,
  port: number
): Promise<string> => {
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
    // Caddyfile might not exist yet
    caddyContent = '';
  }

  // Check if route already exists
  if (caddyContent.includes(subdomain)) {
    console.log(`Caddy route already exists for ${subdomain}`);
    return subdomain;
  }

  // Append route
  await fs.appendFile(CADDY_FILE, routeBlock);
  console.log(`Added Caddy route: ${subdomain} -> localhost:${port}`);

  // Reload Caddy
  await reloadCaddy();

  return subdomain;
};

/**
 * Remove a Caddy route for an agent
 */
export const removeCaddyRoute = async (agentId: string): Promise<void> => {
  const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

  let caddyContent = '';
  try {
    caddyContent = await fs.readFile(CADDY_FILE, 'utf8');
  } catch {
    return;
  }

  // Remove route block using regex
  // Matches: subdomain { ... }
  const escapedSubdomain = subdomain.replace(/\./g, '\\.');
  const regex = new RegExp(
    `\\n${escapedSubdomain}\\s*\\{[^}]*\\}`,
    'g'
  );
  const newContent = caddyContent.replace(regex, '');

  if (newContent !== caddyContent) {
    await fs.writeFile(CADDY_FILE, newContent);
    console.log(`Removed Caddy route for ${subdomain}`);
    await reloadCaddy();
  }
};

/**
 * Reload Caddy configuration
 * Tries systemd first, then falls back to caddy CLI
 */
const reloadCaddy = async (): Promise<void> => {
  try {
    await runCommand('systemctl reload caddy');
    console.log('Caddy reloaded via systemctl');
  } catch {
    try {
      await runCommand(`caddy reload --config ${escapeShellArg(CADDY_FILE)}`);
      console.log('Caddy reloaded via CLI');
    } catch (error) {
      console.error('Failed to reload Caddy:', error);
      // Don't throw - route was added, just reload failed
    }
  }
};

/**
 * Get the agents domain
 */
export const getAgentsDomain = (): string => AGENTS_DOMAIN;

/**
 * Get the full URL for an agent
 */
export const getAgentUrl = (agentId: string): string => {
  return `https://${agentId}.${AGENTS_DOMAIN}`;
};
