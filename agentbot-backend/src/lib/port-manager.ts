/**
 * Atomic port allocation with file locking
 * Prevents race conditions when multiple deployments happen simultaneously
 * 
 * NOTE: This module is part of the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Currently not imported in the main application.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { runCommand } from '../utils';

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const PORTS_FILE = path.join(DATA_DIR, 'ports.json');
const LOCK_FILE = path.join(DATA_DIR, 'ports.lock');
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');

const acquireLock = async (): Promise<() => Promise<void>> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  for (let attempts = 0; attempts < 10; attempts++) {
    try {
      await fs.writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
      return async () => { try { await fs.unlink(LOCK_FILE); } catch {} };
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error('Could not acquire port lock');
};

export const allocatePort = async (agentId: string): Promise<number> => {
  const release = await acquireLock();
  
  try {
    let ports: Record<string, number> = {};
    try {
      ports = JSON.parse(await fs.readFile(PORTS_FILE, 'utf8'));
    } catch {}
    
    if (ports[agentId]) return ports[agentId];
    
    const usedPorts = Object.values(ports);
    // Account for port offset: each agent uses assignedPort and assignedPort + 2
    const allUsedPorts = new Set([
      ...usedPorts,
      ...usedPorts.map((p: number) => p + 2)
    ]);
    
    // Find next available port accounting for offset
    let port = BASE_PORT;
    while (allUsedPorts.has(port) || allUsedPorts.has(port + 2)) port++;
    
    ports[agentId] = port;
    await fs.writeFile(PORTS_FILE, JSON.stringify(ports, null, 2));
    return port;
  } finally {
    await release();
  }
};

export const releasePort = async (agentId: string): Promise<void> => {
  const release = await acquireLock();
  try {
    const ports = JSON.parse(await fs.readFile(PORTS_FILE, 'utf8'));
    delete ports[agentId];
    await fs.writeFile(PORTS_FILE, JSON.stringify(ports, null, 2));
  } catch {}
  finally { await release(); }
};

export const getAllocatedPort = async (agentId: string): Promise<number | null> => {
  try {
    const ports = JSON.parse(await fs.readFile(PORTS_FILE, 'utf8'));
    return ports[agentId] || null;
  } catch { return null; }
};
