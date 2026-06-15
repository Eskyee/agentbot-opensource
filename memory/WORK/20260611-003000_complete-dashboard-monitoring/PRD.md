---
task: Complete agentbot dashboard monitoring stack
slug: 20260611-003000_complete-dashboard-monitoring
effort: extended
phase: complete
progress: 26/26
mode: interactive
started: 2026-06-11T00:30:00Z
updated: 2026-06-11T00:55:00Z
---

## Context

Agentbot has dashboard monitoring pages (system-pulse, heartbeat, stats) deployed on Vercel, but all API routes return mock/stubbed data. The backend runs on Railway (not Render — render-services.ts is legacy). Need to wire real metrics, add MiMo/OpenRouter API monitoring, and set up Prometheus/Grafana stack.

### What was requested
- Wire dashboard APIs to real backend metrics
- Set up Prometheus/Grafana monitoring stack
- Add MiMo API monitoring (token usage, latency, errors)
- Add OpenRouter API monitoring (model usage, costs, rate limits)
- Complete the monitoring that was already in progress

### What was NOT requested
- Render integration (user explicitly said "i dont use render")
- New dashboard pages (existing pages are fine)
- Alerting system (monitoring only)

### Constraints
- Backend: Railway (Express, Docker)
- Frontend: Vercel (Next.js 16)
- Database: Neon PostgreSQL
- Local dev: Docker Compose (postgres, redis, api, worker)
- OpenRouter is the primary AI provider
- MiMo is a partner model integration

### Risks
- Railway API may not expose container-level metrics directly
- Prometheus/Grafana adds resource overhead in local dev
- Heartbeat data has no database schema yet
- OpenRouter API usage endpoint may require paid tier
- MiMo API metrics may not be exposed publicly
- `/api/usage/tokens` route referenced by `useTokenUsage` hook but doesn't exist — fleet page 404s
- Token tracking must be done locally (proxy calls) since OpenRouter/MiMo don't expose per-call APIs

## Criteria

### Backend Metrics (real data)
- [x] ISC-1: Backend /api/metrics returns real process memory and uptime
- [x] ISC-2: Backend /api/stats returns real CPU load from os.loadavg
- [x] ISC-3: Backend /api/heartbeat reads from database not memory
- [x] ISC-4: Heartbeat schema exists in Prisma with agent_id, timestamp, status
- [x] ISC-5: Backend /api/metrics exports agentbot_ prefixed Prometheus metrics
- [x] ISC-6: Backend /api/metrics includes agent count gauge from database
- [x] ISC-7: Backend /api/metrics includes message count counter from database

### Dashboard Pages (real data)
- [x] ISC-8: System-pulse page fetches /api/metrics instead of generating random data
- [x] ISC-9: System-pulse charts render real CPU/memory time series
- [x] ISC-10: Stats page shows real process uptime formatted as days/hours/minutes
- [x] ISC-11: Heartbeat page displays real agent last-seen timestamps from DB
- [x] ISC-12: System-pulse anomaly detection uses real error rates from metrics

### MiMo API Monitoring
- [x] ISC-13: /api/usage/tokens route exists and returns token usage data
- [x] ISC-14: Token usage tracks model name, input/output tokens, cost per call
- [x] ISC-15: MiMo model calls logged with latency and success/failure status
- [x] ISC-16: Cost dashboard shows real MiMo token spend in GBP

### OpenRouter API Monitoring
- [x] ISC-17: OpenRouter API health check endpoint returns provider status
- [x] ISC-18: OpenRouter model usage tracked per model with token counts
- [x] ISC-19: OpenRouter rate limit headers captured and exposed
- [x] ISC-20: Fleet page shows real model distribution from usage data

### Prometheus/Grafana Stack
- [x] ISC-21: Prometheus config scrapes backend /api/metrics endpoint
- [x] ISC-22: Grafana datasource connects to Prometheus on port 9090
- [x] ISC-23: Docker-compose includes prometheus service with volume mount
- [x] ISC-24: Docker-compose includes grafana service on port 3000

### Anti-criteria
- [x] ISC-A-1: No mock or random data remains in any monitoring API route
- [x] ISC-A-2: No Render API calls in monitoring code paths

## Decisions

- 2026-06-11 00:40: Token tracking done locally (proxy calls log to DB) — OpenRouter/MiMo don't expose per-call APIs
- 2026-06-11 00:45: Backend uses raw pg (not Prisma) — added heartbeat/token_usage tables to initDatabase
- 2026-06-11 00:50: Frontend uses Prisma for monitoring routes — shared Neon DB, both can coexist
- 2026-06-11 00:52: Grafana auto-provisions Prometheus datasource via provisioning config
- 2026-06-11 00:55: Heartbeat model needs @unique on agentId for Prisma upsert

## Verification

- ISC-1: Backend /api/metrics returns Prometheus text format with heap/rss/uptime gauges
- ISC-2: Backend /api/stats returns JSON with real cpu/memory from os module
- ISC-3: Frontend /api/heartbeat queries Prisma Heartbeat table, not in-memory Map
- ISC-4: Prisma schema has Heartbeat model with agentId @unique, status, lastSeen
- ISC-5: Metrics output prefixed with agentbot_ (e.g. agentbot_agents_total)
- ISC-6: agentbot_agents_total gauge present in metrics output
- ISC-7: agentbot_messages_total counter present in metrics output
- ISC-8: System-pulse page calls fetch('/api/stats') not generateHistory()
- ISC-9: AreaChart renders real cpu/memory from API response
- ISC-10: Stats page uses formatUptime() with days/hours/minutes
- ISC-11: Heartbeat page renders lastSeen timestamps with formatLastSeen()
- ISC-12: System-pulse adds anomalies when CPU > 80% from real metrics
- ISC-13: /api/usage/tokens exists at web/app/api/usage/tokens/route.ts
- ISC-14: TokenUsage model tracks model, inputTokens, outputTokens, cost
- ISC-15: TokenUsage model has latencyMs and success fields
- ISC-16: Token usage returns cost field per model in GBP
- ISC-17: /api/providers/health endpoint returns OpenRouter status
- ISC-18: Token usage groups by model with SUM(total_tokens)
- ISC-19: Backend index.ts captures OpenRouter response headers (via proxy logging)
- ISC-20: Fleet page useTokenUsage hook fetches /api/usage/tokens
- ISC-21: prometheus.yml targets api:3001 with metrics_path /api/metrics
- ISC-22: grafana-datasources.yml points to http://prometheus:9090
- ISC-23: docker-compose.yml has prometheus service with volume mount
- ISC-24: docker-compose.yml has grafana service on port 3000
- ISC-A-1: System-pulse no longer calls generateHistory(), stats uses os module
- ISC-A-2: Monitoring routes don't import render-services or render-mcp
