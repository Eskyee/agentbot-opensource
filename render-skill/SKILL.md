---
name: render-infra
description: Manage Render cloud infrastructure — services, deploys, databases, Redis, logs, env vars, scaling, and custom domains. Use this skill whenever the user mentions Render, deploy to Render, Render services, Render database, Render logs, scaling on Render, Render environment variables, Render infrastructure, or when they need to check deploy status, restart services, view logs, or manage their Render account. Also trigger when the user asks about their backend infrastructure, server status, deploy history, or database connections if the project uses Render hosting.
---

# Render Infrastructure Management

Manage your Render cloud platform through the Render API (v1). This skill works with the `render-mcp-server` MCP server for direct API access, or can guide manual operations via the Render dashboard.

## Prerequisites

- **RENDER_API_KEY** environment variable set (get from https://dashboard.render.com/u/settings#api-keys)
- The `render-mcp-server` MCP must be connected for tool access

## Available Operations

### Services
- **List services**: Filter by name, type (web_service, private_service, background_worker, static_site, cron_job), region, environment
- **Get service details**: Full config including URL, repo, branch, scaling, plan
- **Update service**: Change name, branch, auto-deploy, instance type
- **Restart service**: Graceful restart without redeploying
- **Scale service**: Change instance count (1-50)
- **Suspend/Resume**: Stop a service to save costs, resume later
- **Delete service**: Permanent removal

### Deploys
- **List deploys**: Recent deploy history with status, commit, timing
- **Trigger deploy**: Start a new deploy, optionally clearing build cache
- **Get deploy details**: Full deploy info including build logs link
- **Cancel deploy**: Stop an in-progress deploy

### Databases
- **List PostgreSQL**: All Postgres instances with plan, version, status
- **Get PostgreSQL details**: Connection strings, disk usage, config
- **List Redis**: All Redis instances with plan, eviction policy

### Logs & Monitoring
- **Get logs**: Recent log lines filtered by level (debug/info/warn/error)
- **Direction**: Forward (oldest first) or backward (newest first)

### Environment Variables
- **List env vars**: All variables (values masked for security)
- **Set env var**: Create or update (triggers redeploy)
- **Delete env var**: Remove a variable

### Custom Domains
- **List domains**: All custom domains with verification status

## Common Workflows

### Check deploy status after a push
1. `render_list_deploys` with the service ID, limit 1
2. Check the status field: `live` = success, `build_failed` = check logs

### Debug a failing service
1. `render_get_logs` with `level: "error"` to find errors
2. `render_list_deploys` to check if recent deploys failed
3. `render_get_service` to verify config

### Scale for traffic
1. `render_get_service` to see current instance count
2. `render_scale_service` with target instance count
3. Monitor with `render_get_logs`

### Emergency: service down
1. `render_restart_service` for a quick restart
2. If restart doesn't help, `render_get_logs` for errors
3. Check `render_list_deploys` — was a bad deploy pushed?
4. If needed, trigger a fresh deploy: `render_trigger_deploy` with `clear_cache: "clear"`

## Render API Reference

- **Base URL**: `https://api.render.com/v1`
- **Auth**: Bearer token
- **Rate limit**: 100 requests/minute
- **Pagination**: Cursor-based (pass `cursor` from previous response)
- **Regions**: oregon, frankfurt, ohio, singapore, virginia
- **Service types**: web_service, private_service, background_worker, static_site, cron_job

## Render Workflows (Advanced)

Render Workflows provide distributed task execution:
- Write tasks in TypeScript or Python
- Sub-second spin-up, up to 24-hour execution
- Automatic orchestration of dependent tasks
- Ideal for data pipelines, batch processing, scheduled jobs

Access workflows via the Render dashboard or API at `/workflows`.

## Agentbot-Specific Context

Agentbot's Render infrastructure:
- **API server**: web_service (Node.js/Express)
- **Worker**: background_worker (Bull queue processor for agent deployments)
- **PostgreSQL**: Primary database (Prisma ORM)
- **Redis**: Bull queue backend + rate limiting cache
- **Port range**: 30000-39999 for agent containers

Scaling notes:
- Current setup handles 10-20 concurrent agent deployments
- For 100+ concurrent: upgrade DB plan, scale worker instances, leverage Render auto-scaling
- Redis is the bottleneck for queue throughput — monitor memory usage
