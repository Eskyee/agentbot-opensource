---
name: docker-containers
description: Best practices for building and managing Docker agent containers. Use when provisioning agents, optimizing container images, managing stateful storage, or debugging container issues. Triggers on "docker", "container", "agent container", "provision agent", "dockerfile".
---

# Docker Containers — Agent Runtime Best Practices

Production patterns for building, deploying, and managing OpenClaw agent containers on Agentbot.

## Core Principles

| Need | Pattern |
|------|---------|
| Agent isolation | One container per agent, resource-limited by plan |
| Persistent state | Volume mounts or DB-backed state (never in-memory only) |
| Secret management | Environment variables via agent config, never in Dockerfile |
| Health checks | HTTP health endpoint, container restart policy |
| Resource limits | CPU/memory caps per plan tier |

## Plan Resource Limits

| Plan | Memory | CPUs | Use Case |
|------|--------|------|----------|
| solo | 2GB | 1 | Single agent, basic tasks |
| collective | 4GB | 2 | Multi-channel agent |
| label | 8GB | 4 | High-throughput agent fleet |
| network | 16GB | 4 | Enterprise agent network |

## Dockerfile Best Practices

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install deps first (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Non-root user
RUN addgroup -g 1001 -S agent && adduser -S agent -u 1001
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
```

## Anti-Patterns (NEVER)

| Anti-Pattern | Why |
|-------------|-----|
| `FROM node:latest` | Non-deterministic builds, large image |
| Secrets in Dockerfile/ENV | Leaked in image layers and logs |
| Running as root | Container escape risk |
| No health check | Silent failures, no auto-restart |
| `npm install` in prod image | Includes devDependencies, larger image |
| In-memory-only state | Lost on container restart |
| No resource limits | One agent can starve others |
| `exec()` for shell commands | Shell injection — use `spawn()` |

## Container Lifecycle

```bash
# Build agent image
docker build -t agentbot/openclaw:latest .

# Run with resource limits
docker run -d \
  --name agent-123 \
  --memory=2g \
  --cpus=1 \
  --restart=unless-stopped \
  -e OPENROUTER_API_KEY=xxx \
  -e AGENT_ID=123 \
  agentbot/openclaw:latest

# Health check
docker inspect --format='{{.State.Health.Status}}' agent-123

# Logs
docker logs -f agent-123 --tail 100

# Stop/remove
docker stop agent-123 && docker rm agent-123
```

## Stateful Storage

Always use DB-backed state. Agent containers can restart at any time.

```typescript
// Good: DB-backed state (survives restart)
const state = await prisma.agentState.upsert({
  where: { agentId },
  update: { data: JSON.stringify(newState) },
  create: { agentId, data: JSON.stringify(newState) },
})

// Bad: in-memory only (lost on restart)
const cache = new Map()
```

## Security Checklist

- [ ] Non-root user in Dockerfile
- [ ] No secrets in image layers
- [ ] Resource limits set per plan
- [ ] Health check endpoint
- [ ] SSRF blocklist for outbound requests
- [ ] `spawn()` not `exec()` for shell commands
- [ ] Bearer token auth on all protected routes
- [ ] SHA-256 hashed API keys (never store raw)

## Networking

- Each agent gets a subdomain via Caddy reverse proxy
- SSRF protection blocks private IPs (IPv4/IPv6/CGN)
- Agent-to-agent communication via the message bus (not direct HTTP)

_Adapted from Cloudflare Workers patterns in [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/workers-best-practices) for Agentbot's Docker-based architecture._
