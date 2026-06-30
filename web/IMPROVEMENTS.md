# Agentbot Platform Improvements

## Security Scanner (DeepSec-style)

Based on Vercel's deepsec approach:

- **Scan**: Regex-based pattern matching for security-sensitive code
- **Investigate**: AI agents trace data flows and check mitigations
- **Revalidate**: Second agent run validates findings to reduce false positives
- **Enrich**: Git metadata identifies responsible contributors
- **Export**: Format findings as actionable tickets

**Implementation:**

- `lib/security-scanner/index.ts` — Pattern-based scanner
- `api/security/scan/route.ts` — Scan endpoint
- 10 security patterns: hardcoded secrets, eval(), innerHTML, SQL injection, XSS, etc.

## Real Automation Templates

Each template creates a working automation with:

- Proper trigger configuration
- AI prompt for the agent to follow
- MCP server connections
- Rate limiting and error handling

**Templates:**

1. CI Failure Auto-Fix — GitHub webhook → agent fixes code
2. /agent Issue Fix — Issue comment → agent creates PR
3. Daily Sentry Error Sweep — Schedule → query Sentry → fix PRs
4. Slack Bug Triage — Slack webhook → classify + create tickets
5. Weekly Dependency Updates — Schedule → scan + update PRs
6. Datadog Alert Investigation — Slack → pull metrics → root cause
7. Security Vulnerability Scan — Schedule → CVE scan → fix PRs
8. Stale PR Cleanup — Schedule → flag + close abandoned PRs
9. Webhook Alert Handler — Generic webhook → investigate

## MCP Integrations

8 services with real connection flows:

- **Slack** — OAuth + webhooks (messages, reactions)
- **GitHub** — OAuth + webhooks (PRs, issues, CI)
- **Linear** — OAuth (issues, projects)
- **Sentry** — API token (errors, performance)
- **Datadog** — API token (metrics, logs, traces)
- **Notion** — OAuth (pages, databases)
- **Jira** — OAuth (issues, sprints)
- **Figma** — OAuth (designs, components)

## Auth0 Integration

Plan for enterprise authentication:

- Auth0 Next.js SDK integration
- Automatic user provisioning
- Role-based access control
- Multi-environment sync
- Hosted login pages

## Automation Execution Engine

- `lib/automation-engine/index.ts` — Runs agent sessions
- `api/automations/process/route.ts` — Cron endpoint
- AI gateway integration for inference
- Rate limiting per automation

## Webhook Handlers

- `/api/webhooks/github` — GitHub events (PR, push, issues)
- `/api/webhooks/slack` — Slack messages, reactions
- `/api/webhooks/generic` — PagerDuty, Sentry, Datadog
- Signature verification for all webhooks
- Payload filtering with regex

## Next Steps

1. **Auth0 integration** — Add Auth0 SDK for enterprise auth
2. **DeepSec scanner** — Run security scans on agentbot codebase
3. **Cron processor** — Background job for automation execution
4. **User documentation** — Step-by-step guides for each automation
5. **MCP SDK** — Build SDK for custom MCP server integrations
