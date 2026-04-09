---
name: sentry-cli
description: Monitor and debug production errors with Sentry CLI. Use when agents need error tracking, issue triage, log streaming, or distributed tracing. Triggers on "sentry", "error tracking", "issue monitoring", "production errors", "debug production".
---

# Sentry CLI — Production Error Monitoring

Interact with Sentry from the command line to monitor errors, view issues, stream logs, and trace requests across your agent infrastructure.

## Installation

```bash
curl https://cli.sentry.dev/install -fsS | bash
# or
npm install -g sentry
```

## Authentication

```bash
sentry auth login                          # OAuth (recommended)
sentry auth login --token YOUR_TOKEN       # API token
sentry auth status                         # Check auth
sentry auth whoami                         # Current user
```

## Issue Management

```bash
# List issues in a project
sentry issue list my-org/my-project
sentry issue list my-org/my-project --query "is:unresolved"
sentry issue list my-org/my-project --sort freq --limit 20

# View issue details
sentry issue view PROJ-123
sentry issue view PROJ-123 -w                # Open in browser

# AI root cause analysis
sentry issue explain 123456789
sentry issue plan 123456789                  # Generate fix plan
```

## Log Streaming

```bash
# List logs
sentry log list my-org/backend

# Stream live logs
sentry log list my-org/backend -f
sentry log list my-org/backend -f 5          # 5s poll interval

# Filter by level
sentry log list -q 'level:error'

# View specific log entry
sentry log view my-org/backend <log-id>
```

## Distributed Tracing

```bash
# List recent traces
sentry trace list my-org/my-project
sentry trace list my-org/my-project --sort duration

# View trace details
sentry trace view <trace-id>
sentry trace view <trace-id> --spans all     # Full span tree
```

## API Access

```bash
# List organizations
sentry api /organizations/

# Get project details
sentry api /projects/my-org/my-project/

# Update issue status
sentry api /issues/123456789/ --method PUT --field status=resolved

# Assign issue
sentry api /issues/123456789/ --method PUT --field assignedTo="user@example.com"
```

## Project & Team Management

```bash
sentry org list                              # List organizations
sentry project list my-org                   # List projects
sentry team list my-org                      # List teams
```

## Output Formats

```bash
sentry issue list my-org/proj --json | jq '.[].title'  # JSON output
sentry issue view PROJ-123 -w                            # Open in browser
```

## Agentbot Integration

For monitoring agent containers in production:

1. Install Sentry SDK in the OpenClaw container
2. Set `SENTRY_DSN` in agent environment variables
3. Use `sentry-cli` to triage issues across your agent fleet
4. Stream logs from specific agent projects: `sentry log list my-org/agent-prod -f`
5. Set up alerts for error spikes in agent containers

### Environment Variables

```bash
SENTRY_DSN=https://xxx@sentry.io/yyy        # Project DSN
SENTRY_AUTH_TOKEN=sntrys_xxx                 # CLI auth token
SENTRY_ORG=my-org                            # Default organization
SENTRY_PROJECT=my-project                    # Default project
```

_Adapted from [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/sentry-cli) for Agentbot._
