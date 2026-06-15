import { promises as fs } from 'fs';
import path from 'path';
import { pool } from './db';
import { log } from './logger';

const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');

export const portsFilePath = (dataDir: string): string => path.join(dataDir, 'ports.json');
export const lockFilePath = (dataDir: string): string => path.join(dataDir, 'ports.lock');

export const withLock = async <T>(fn: () => Promise<T>, dataDir: string): Promise<T> => {
  const lockKey = 0x4147454E54;
  let useDbLock = false;

  try {
    const result = await pool.query('SELECT pg_advisory_lock($1)', [lockKey]);
    if (result.rows[0]?.pg_advisory_lock) useDbLock = true;
  } catch { /* Fall back to file lock */ }

  if (useDbLock) {
    try {
      return await fn();
    } finally {
      try { await pool.query('SELECT pg_advisory_unlock($1)', [lockKey]); } catch { /* Released on close */ }
    }
  }

  const lockFile = lockFilePath(dataDir);
  let retries = 50;
  while (retries > 0) {
    try {
      const handle = await fs.open(lockFile, 'wx');
      await handle.close();
      break;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      throw err;
    }
  }
  if (retries === 0) throw new Error('Could not acquire lock after multiple retries');

  try {
    return await fn();
  } finally {
    try { await fs.unlink(lockFile); } catch { /* Best-effort */ }
  }
};

export const readPorts = async (dataDir: string): Promise<Record<string, number>> => {
  try {
    const raw = await fs.readFile(portsFilePath(dataDir), 'utf8');
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
};

export const writePorts = async (dataDir: string, ports: Record<string, number>): Promise<void> => {
  await fs.writeFile(portsFilePath(dataDir), JSON.stringify(ports, null, 2));
};

export const getNextPortAndAssign = async (agentId: string, dataDir: string): Promise<number> => {
  return await withLock(async () => {
    const ports = await readPorts(dataDir);
    if (ports[agentId]) return ports[agentId];

    const usedPorts = Object.values(ports);
    const allUsedPorts = new Set([...usedPorts, ...usedPorts.map(p => p + 2)]);

    let port = BASE_PORT;
    while (allUsedPorts.has(port) || allUsedPorts.has(port + 2)) port++;

    ports[agentId] = port;
    await writePorts(dataDir, ports);
    return port;
  }, dataDir);
};
