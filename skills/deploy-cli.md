---
name: deploy-cli
description: CLI reference for deploying and managing Agentbot agents. Use when users need to deploy, manage secrets, view logs, or troubleshoot agent containers from the command line. Triggers on "cli deploy", "agent logs", "manage secrets", "agent status", "cli reference".
---

# Deploy CLI — Agent Management from the Command Line

Manage agent deployments, secrets, logs, and configuration from the terminal.

## Agent Lifecycle

```bash
# Deploy a new agent
curl -X POST https://api.agentbot.raveculture.xyz/api/provision \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent", "plan": "solo"}'

# Check agent status
curl https://api.agentbot.raveculture.xyz/api/agent/status \
  -H "Authorization: Bearer $API_KEY"

# Stop agent
curl -X POST https://api.agentbot.raveculture.xyz/api/agent/stop \
  -H "Authorization: Bearer $API_KEY"

# Restart agent
curl -X POST https://api.agentbot.raveculture.xyz/api/agent/restart \
  -H "Authorization: Bearer $API_KEY"
```

## Secrets Management

Never hardcode secrets. Use the agent config API:

```bash
# Set a secret
curl -X POST https://api.agentbot.raveculture.xyz/api/agent/config \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "OPENROUTER_API_KEY", "value": "sk-..."}'

# List configured keys (values are masked)
curl https://api.agentbot.raveculture.xyz/api/agent/config \
  -H "Authorization: Bearer $API_KEY"

# Delete a secret
curl -X DELETE https://api.agentbot.raveculture.xyz/api/agent/config/OPENROUTER_API_KEY \
  -H "Authorization: Bearer $API_KEY"
```

## Logs

```bash
# Stream agent logs
curl -N https://api.agentbot.raveculture.xyz/api/agent/logs \
  -H "Authorization: Bearer $API_KEY"

# Last 100 lines
curl "https://api.agentbot.raveculture.xyz/api/agent/logs?tail=100" \
  -H "Authorization: Bearer $API_KEY"

# Filter by level
curl "https://api.agentbot.raveculture.xyz/api/agent/logs?level=error" \
  -H "Authorization: Bearer $API_KEY"
```

## Docker Direct (Self-Hosted)

For self-hosted deployments:

```bash
# Build
docker build -t agentbot/openclaw:latest -f Dockerfile.lwk .

# Run with plan limits
docker run -d \
  --name my-agent \
  --memory=2g --cpus=1 \
  --restart=unless-stopped \
  -p 3000:3000 \
  -e OPENROUTER_API_KEY=sk-... \
  -e DATABASE_URL=postgres://... \
  agentbot/openclaw:latest

# Logs
docker logs -f my-agent --tail 100

# Shell into container (debug)
docker exec -it my-agent /bin/sh

# Health check
curl http://localhost:3000/health
```

## Vercel Deployment (Frontend)

```bash
cd web
vercel --prod

# Environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
```

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Agent won't start | Check `docker logs <name>`, verify env vars |
| Auth failures | Verify `API_KEY` is valid, check bearer token |
| Out of memory | Upgrade plan tier or optimize agent code |
| Container keeps restarting | Check health endpoint, review crash logs |
| Slow responses | Check OpenRouter quota, verify model availability |
| SSRF blocked | Outbound request hit private IP — use public endpoints only |

## Best Practices

1. **Use environment variables** for all secrets — never in code or Dockerfile
2. **Set resource limits** matching your plan tier
3. **Enable health checks** for automatic restart on failure
4. **Use `spawn()` not `exec()`** for shell commands (no injection)
5. **Monitor logs** regularly — stream with `-f` flag
6. **Keep images small** — use Alpine base, multi-stage builds
7. **Tag images** with version numbers, not just `latest`

_Adapted from [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/wrangler) Wrangler CLI for Agentbot's deployment model._
