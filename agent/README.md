# agentbot eve agent

Durable backend agent (eve framework). Tools and connections live under
`tools/`, `connections/`, `schedules/`, and `lib/`.

## Connections (external services, via Vercel Connect)

| File | MCP server | Vercel Connect connector slug |
|------|------------|-------------------------------|
| `connections/notion.ts` | `mcp.notion.com/mcp` | `mcp.notion.com/agentbot` |
| `connections/linear.ts` | `mcp.linear.app/mcp` | `linear/eve-agentbot` |
| `connections/github.ts` | `api.githubcopilot.com/mcp` | `github/github-agentbot` |
| `connections/slack.ts` | `mcp.slack.com/mcp` | `slack/slack-agentbot` |

Each connector must be created once in the Vercel dashboard with the matching
slug. First use triggers a one-time sign-in plus a per-session approval.

## Environment variables (backend tools)

`get_agent_status`, `query_metrics`, and `manage_schedules` call the
agentbot-backend API using signed user-context headers. Set these on the agent
deployment:

| Var | Required | Notes |
|-----|----------|-------|
| `HMAC_SECRET` | yes | Must match the backend's `HMAC_SECRET` (used to sign request headers) |
| `AGENTBOT_SERVICE_USER_ID` | yes | Identity the agent acts as; must have access to the agents/metrics it queries |
| `AGENTBOT_SERVICE_USER_EMAIL` | yes | Same identity |
| `AGENTBOT_SERVICE_USER_ROLE` | no | Defaults to `user` |
| `BACKEND_API_URL` | no | Defaults to `https://YOUR_SERVICE_URL` |

Set them with the Vercel CLI (run once per environment):

```bash
vercel env add HMAC_SECRET production
vercel env add AGENTBOT_SERVICE_USER_ID production
vercel env add AGENTBOT_SERVICE_USER_EMAIL production
# optional:
vercel env add AGENTBOT_SERVICE_USER_ROLE production
vercel env add BACKEND_API_URL production
```

## Schedules

- `schedules/daily-ops-summary.ts` — native eve cron (file-defined, durable),
  fire-and-forget ops summary on weekdays at 09:00 UTC.
- Runtime/ad-hoc tasks go through `manage_schedules` → backend `/api/schedules`
  (DB-backed `scheduled_tasks`, one-shot at `runAt`).
