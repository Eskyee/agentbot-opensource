# Backend Consolidation & Docker/Instance Fix Plan

**Date:** 2026-02-25  
**Goal:** Consolidate to `agentbot-backend/` as single backend, fix Docker/instance issues  
**Timeline:** 2-3 weeks

---

## Overview

This plan consolidates two backend APIs into one, fixes Docker/instance management issues, and establishes a clean foundation for the Royalty Split Agent.

### Current State
```
┌─────────────────┐     ┌─────────────────┐
│ agentbot-backend│     │      api/       │
│   (Primary)     │     │   (Legacy)      │
│   TypeScript    │     │   JavaScript    │
│   Port: 3001    │     │   Port: 3000    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────────┐
         │  Docker Containers  │
         │  (OpenClaw agents)  │
         └─────────────────────┘
```

### Target State
```
┌─────────────────────────────────────────┐
│         agentbot-backend (Unified)       │
│         TypeScript, Port: 3001           │
│                                         │
│  ┌───────────┐  ┌───────────┐           │
│  │  Docker   │  │   Caddy   │           │
│  │  Mgmt     │  │  Routes   │           │
│  └───────────┘  └───────────┘           │
│                                         │
│  ┌───────────┐  ┌───────────┐           │
│  │ PostgreSQL│  │   Redis   │  (Future) │
│  │  (Prisma) │  │  (Queue)  │           │
│  └───────────┘  └───────────┘           │
└────────────────┬────────────────────────┘
                 ▼
    ┌─────────────────────┐
    │  Docker Containers  │
    │  (OpenClaw agents)  │
    └─────────────────────┘
```

---

## Phase 1: Audit & Document Current Issues

### 1.1 Docker/Instance Issues to Fix

| Issue | Location | Description | Priority |
|-------|----------|-------------|----------|
| Port race condition | [`index.ts:244-249`](agentbot-backend/src/index.ts:244) | `getNextPort()` not atomic | High |
| No container health checks | [`index.ts:549-558`](agentbot-backend/src/index.ts:549) | Container started but not verified healthy | High |
| Missing Caddy integration | `agentbot-backend/` | No subdomain routing | High |
| File-based metadata | [`index.ts:251-264`](agentbot-backend/src/index.ts:251) | JSON files instead of database | Medium |
| No retry logic | [`index.ts:70-80`](agentbot-backend/src/index.ts:70) | Docker commands fail without retry | Medium |
| Missing cleanup on failure | [`index.ts:581-584`](agentbot-backend/src/index.ts:581) | Partial deployments not cleaned | Medium |
| No resource limits validation | [`index.ts:549-558`](agentbot-backend/src/index.ts:549) | Memory/CPU not enforced consistently | Low |

### 1.2 Features to Migrate from `api/` to `agentbot-backend/`

| Feature | Source | Target | Priority |
|---------|--------|--------|----------|
| Caddy route management | [`server.js:94-109`](api/server.js:94) | New file `caddy.ts` | High |
| External IP detection | [`server.js:27-32`](api/server.js:27) | Add to `index.ts` | Medium |
| User data persistence | [`server.js:326-337`](api/server.js:326) | Add to agent metadata | Medium |
| Telegram validation | [`server.js:477-496`](api/server.js:477) | Add endpoint | Low |

---

## Phase 2: Fix Critical Docker Issues

### 2.1 Add Container Health Checks

**File:** `agentbot-backend/src/health.ts` (new)

```typescript
import { runCommand } from './utils';

export interface ContainerHealth {
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  lastCheck: string;
  uptime?: number;
  memoryUsage?: string;
  cpuUsage?: string;
}

export const checkContainerHealth = async (
  containerName: string,
  maxRetries: number = 5
): Promise<ContainerHealth> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { stdout } = await runCommand(
        `docker inspect ${containerName} --format '{{.State.Status}}|{{.State.StartedAt}}'`
      );
      
      const [status, startedAt] = stdout.trim().split('|');
      
      if (status === 'running') {
        // Check if container is responding
        try {
          await runCommand(
            `docker exec ${containerName} curl -s localhost:18789/health`
          );
          return {
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            startedAt,
          };
        } catch {
          // Container running but not healthy yet
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          return {
            status: 'starting',
            lastCheck: new Date().toISOString(),
          };
        }
      }
      
      return {
        status: status === 'exited' ? 'stopped' : 'unhealthy',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
      };
    }
  }
  
  return {
    status: 'unhealthy',
    lastCheck: new Date().toISOString(),
  };
};
```

### 2.2 Add Atomic Port Allocation

**File:** `agentbot-backend/src/port-manager.ts` (new)

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { runCommand } from './utils';

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const PORTS_FILE = path.join(DATA_DIR, 'ports.json');
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');

// File lock for atomic operations
const LOCK_FILE = path.join(DATA_DIR, 'ports.lock');

const acquireLock = async (): Promise<() => Promise<void>> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  let attempts = 0;
  while (attempts < 10) {
    try {
      await fs.writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
      return async () => {
        try {
          await fs.unlink(LOCK_FILE);
        } catch {}
      };
    } catch {
      attempts++;
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error('Could not acquire port lock');
};

export const allocatePort = async (agentId: string): Promise<number> => {
  const release = await acquireLock();
  
  try {
    // Read current ports
    let ports: Record<string, number> = {};
    try {
      const data = await fs.readFile(PORTS_FILE, 'utf8');
      ports = JSON.parse(data);
    } catch {}
    
    // Check if already allocated
    if (ports[agentId]) {
      return ports[agentId];
    }
    
    // Find next available port
    const usedPorts = new Set(Object.values(ports));
    let port = BASE_PORT;
    while (usedPorts.has(port)) {
      port++;
    }
    
    // Verify port is not in use by Docker
    try {
      const { stdout } = await runCommand(
        `docker ps --format '{{.Ports}}' | grep -c ':${port}->' || true`
      );
      if (stdout.trim() !== '0') {
        // Port in use, try next
        return allocatePort(agentId);
      }
    } catch {}
    
    // Allocate port
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
    const data = await fs.readFile(PORTS_FILE, 'utf8');
    const ports = JSON.parse(data);
    delete ports[agentId];
    await fs.writeFile(PORTS_FILE, JSON.stringify(ports, null, 2));
  } catch {}
  finally {
    await release();
  }
};
```

### 2.3 Add Caddy Integration

**File:** `agentbot-backend/src/caddy.ts` (new)

```typescript
import { promises as fs } from 'fs';
import { runCommand } from './utils';

const CADDY_FILE = process.env.CADDY_FILE || '/etc/caddy/Caddyfile';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';

export interface CaddyRoute {
  subdomain: string;
  port: number;
}

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
  } catch {}
  
  // Check if route already exists
  if (caddyContent.includes(subdomain)) {
    return subdomain;
  }
  
  // Append route
  await fs.appendFile(CADDY_FILE, routeBlock);
  
  // Reload Caddy
  try {
    await runCommand('systemctl reload caddy');
  } catch {
    // Try Caddy API if systemd fails
    try {
      await runCommand('caddy reload --config ' + CADDY_FILE);
    } catch {}
  }
  
  return subdomain;
};

export const removeCaddyRoute = async (agentId: string): Promise<void> => {
  const subdomain = `${agentId}.${AGENTS_DOMAIN}`;
  
  let caddyContent = '';
  try {
    caddyContent = await fs.readFile(CADDY_FILE, 'utf8');
  } catch {
    return;
  }
  
  // Remove route block (simple regex-based removal)
  const regex = new RegExp(
    `\\n${subdomain.replace(/\./g, '\\.')} \\{[^}]*\\}`,
    'g'
  );
  const newContent = caddyContent.replace(regex, '');
  
  if (newContent !== caddyContent) {
    await fs.writeFile(CADDY_FILE, newContent);
    try {
      await runCommand('systemctl reload caddy');
    } catch {}
  }
};
```

### 2.4 Add Retry Logic & Cleanup

**File:** `agentbot-backend/src/utils.ts` (new)

```typescript
import { exec } from 'child_process';

export const runCommand = (
  command: string,
  options: {
    maxBuffer?: number;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<{ stdout: string; stderr: string }> => {
  const {
    maxBuffer = 10 * 1024 * 1024,
    timeout = 60000,
    retries = 0,
    retryDelay = 1000,
  } = options;

  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber: number) => {
      exec(
        command,
        { maxBuffer, timeout },
        (error, stdout, stderr) => {
          if (error) {
            if (attemptNumber < retries) {
              setTimeout(() => attempt(attemptNumber + 1), retryDelay);
              return;
            }
            reject(new Error(stderr || error.message));
            return;
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      );
    };
    attempt(0);
  });
};

export const escapeShellArg = (value: string): string =>
  `'${value.replace(/'/g, `'\\''`)}'`;

export const cleanupContainer = async (
  containerName: string,
  volumeName?: string
): Promise<void> => {
  try {
    await runCommand(`docker rm -f ${containerName}`);
  } catch {}
  
  if (volumeName) {
    try {
      await runCommand(`docker volume rm ${volumeName}`);
    } catch {}
  }
};
```

---

## Phase 3: Improve Deployment Flow

### 3.1 Enhanced Deployment Endpoint

**Update:** `agentbot-backend/src/routes/deployments.ts`

```typescript
import { Router, Request, Response } from 'express';
import { runCommand, cleanupContainer } from '../utils';
import { allocatePort, releasePort } from '../port-manager';
import { checkContainerHealth } from '../health';
import { addCaddyRoute, removeCaddyRoute } from '../caddy';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { agentId, config } = req.body;
  
  // Validation
  if (!agentId || !config?.telegramToken) {
    return res.status(400).json({
      error: 'agentId and telegramToken are required',
    });
  }
  
  const containerName = `openclaw-${agentId}`;
  const volumeName = `openclaw-data-${agentId}`;
  
  try {
    // 1. Allocate port atomically
    const port = await allocatePort(agentId);
    
    // 2. Create volume
    await runCommand(`docker volume create ${volumeName}`);
    
    // 3. Write config
    const openclawConfig = createOpenClawConfig(
      config.telegramToken,
      config.aiProvider || 'openrouter',
      config.apiKey,
      config.ownerIds
    );
    
    const configBase64 = Buffer.from(
      JSON.stringify(openclawConfig, null, 2)
    ).toString('base64');
    
    await runCommand([
      'docker run --rm',
      `-e OPENCLAW_CONFIG_B64='${configBase64}'`,
      `-v ${volumeName}:/target`,
      'alpine',
      `sh -lc "mkdir -p /target/agents /target/workspace && echo \\$OPENCLAW_CONFIG_B64 | base64 -d > /target/openclaw.json"`,
    ].join(' '));
    
    // 4. Start container
    await runCommand([
      'docker run -d',
      `--name ${containerName}`,
      '--restart unless-stopped',
      `-v ${volumeName}:/home/node/.openclaw`,
      `-p ${port}:18789`,
      '--memory=1280m',
      '--cpus=0.5',
      process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:latest',
    ].join(' '));
    
    // 5. Wait for health check
    const health = await checkContainerHealth(containerName, 10);
    
    if (health.status !== 'healthy') {
      // Rollback
      await cleanupContainer(containerName, volumeName);
      await releasePort(agentId);
      
      return res.status(500).json({
        error: 'Container failed to start',
        health,
      });
    }
    
    // 6. Add Caddy route
    const subdomain = await addCaddyRoute(agentId, port);
    
    // 7. Save metadata
    await writeAgentMetadata({
      agentId,
      createdAt: new Date().toISOString(),
      plan: config.plan || 'free',
      aiProvider: config.aiProvider || 'openrouter',
      port,
      subdomain,
    });
    
    res.status(201).json({
      id: `deploy-${agentId}`,
      agentId,
      subdomain,
      url: `https://${subdomain}`,
      status: 'active',
      port,
    });
    
  } catch (error) {
    // Cleanup on failure
    await cleanupContainer(containerName, volumeName);
    await releasePort(agentId);
    
    const message = error instanceof Error ? error.message : 'Deployment failed';
    res.status(500).json({ error: message });
  }
});

export default router;
```

---

## Phase 4: Restructure Backend

### 4.1 New Directory Structure

```
agentbot-backend/
├── src/
│   ├── index.ts              # Express app entry
│   ├── routes/
│   │   ├── agents.ts         # Agent CRUD
│   │   ├── deployments.ts    # Deploy/undeploy
│   │   ├── health.ts         # Health check routes
│   │   └── invite.ts         # Invite codes (existing)
│   ├── services/
│   │   ├── docker.ts         # Docker operations
│   │   ├── caddy.ts          # Caddy integration
│   │   └── notifications.ts  # Telegram/email (future)
│   ├── lib/
│   │   ├── port-manager.ts   # Port allocation
│   │   ├── health.ts         # Container health
│   │   └── metadata.ts       # Agent metadata
│   ├── utils/
│   │   └── index.ts          # Shared utilities
│   └── types/
│       └── index.ts          # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema (future)
├── tests/
│   ├── docker.test.ts
│   └── api.test.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 4.2 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/utils/index.ts` | Shared utilities with retry logic |
| Create | `src/lib/port-manager.ts` | Atomic port allocation |
| Create | `src/lib/health.ts` | Container health checks |
| Create | `src/services/caddy.ts` | Caddy route management |
| Create | `src/routes/deployments.ts` | Enhanced deployment endpoint |
| Modify | `src/index.ts` | Import new routes, clean up |
| Deprecate | `../api/server.js` | Mark for removal after migration |

---

## Phase 5: Testing & Validation

### 5.1 Test Cases

```typescript
// tests/docker.test.ts

describe('Docker Management', () => {
  it('should allocate unique ports atomically', async () => {
    const ports = await Promise.all([
      allocatePort('agent-1'),
      allocatePort('agent-2'),
      allocatePort('agent-3'),
    ]);
    
    expect(new Set(ports).size).toBe(3);
  });
  
  it('should detect unhealthy containers', async () => {
    const health = await checkContainerHealth('nonexistent-container');
    expect(health.status).toBe('unhealthy');
  });
  
  it('should cleanup on deployment failure', async () => {
    // Test rollback logic
  });
  
  it('should add Caddy routes correctly', async () => {
    const subdomain = await addCaddyRoute('test-agent', 19001);
    expect(subdomain).toBe('test-agent.agents.localhost');
  });
});
```

### 5.2 Smoke Test Checklist

- [ ] Deploy new agent via API
- [ ] Verify container is running
- [ ] Verify port is allocated
- [ ] Verify Caddy route is added
- [ ] Verify subdomain resolves
- [ ] Stop agent
- [ ] Start agent
- [ ] Restart agent
- [ ] Delete agent
- [ ] Verify cleanup

---

## Implementation Order

### Week 1: Core Fixes
1. Create `src/utils/index.ts` with retry logic
2. Create `src/lib/port-manager.ts` for atomic ports
3. Create `src/lib/health.ts` for health checks
4. Update deployment endpoint with new utilities

### Week 2: Caddy Integration
1. Create `src/services/caddy.ts`
2. Add Caddy route management to deployments
3. Test subdomain routing
4. Add cleanup on deletion

### Week 3: Restructure & Cleanup
1. Reorganize into routes/services structure
2. Add comprehensive tests
3. Update documentation
4. Deprecate `api/` folder

---

## Environment Variables Needed

```bash
# agentbot-backend/.env

# Docker
DATA_DIR=/opt/agentbot/data
OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
AGENTS_BASE_PORT=19000
AGENTS_DOMAIN=agents.agentbot.com

# Caddy
CADDY_FILE=/etc/caddy/Caddyfile

# API
INTERNAL_API_KEY=your-secret-key
PORT=3001
NODE_ENV=production

# Future: Database
DATABASE_URL=postgresql://...
```

---

## Success Criteria

- [ ] Single backend API (`agentbot-backend/`)
- [ ] No port allocation race conditions
- [ ] Container health checks working
- [ ] Caddy integration for subdomains
- [ ] Proper cleanup on failures
- [ ] All tests passing
- [ ] `api/` folder deprecated

---

## Next Steps

1. **Switch to Code mode** to implement the changes
2. Start with `src/utils/index.ts` and `src/lib/port-manager.ts`
3. Add health checks
4. Integrate Caddy
5. Test thoroughly
6. Deploy to production
