# Railway Protection Runbook

Project: `motivated-comfort`  
Scope: production protection for Agentbot on Railway

This runbook exists to reduce the chance of accidental deletion, destructive edits, or unsafe production changes by humans or AI agents.

## Current Protected Shape

- Production project: `motivated-comfort`
- Safe non-production lane: `staging`
- Live production services:
  - `agentbot-backend`
  - `agentbot-worker`
  - `OpenClaw 🦞`
  - `Ollama`
  - `bitcoind-mainnet`
  - `bitcoin-backend-mainnet`
  - `Postgres`

## Non-Negotiable Rules

1. Keep only the project owner as `Owner`.
2. Set everyone else to `Viewer` unless they truly need deploy access.
3. Use `Editor` only for people who must change services or variables.
4. Do not test risky changes in `production`.
5. Use `staging` first for service, variable, or volume changes.
6. Do not recreate testnet Bitcoin services in production unless there is an explicit operational need.
7. Do not use broad account-wide Railway tokens in automation when a project-scoped token will work.

## Required Dashboard Checks

### Members

- Open Railway project `motivated-comfort`
- Go to `Members`
- Confirm:
  - you are the only `Owner`
  - all other users are `Viewer` by default
  - only trusted operators are `Editor`

### Backups

Enable scheduled backups for every persistent production volume:

- `postgres-volume`
- `bitcoind-mainnet-volume`
- `bitcoin-backend-mainnet-volume`
- `openclaw-🦞 -volume`
- `ollama-volume` if model/state persistence matters

Recommended minimum:

- daily backups
- weekly backups

### Tokens

- Audit Railway tokens used by scripts, CI, and local env files
- Replace broad Railway account tokens with project-scoped tokens for `motivated-comfort`
- Revoke or rotate older broad tokens after replacement succeeds

## Safe Change Workflow

1. Make the change in `staging` first.
2. Verify health, routing, and data persistence there.
3. Record the intended production change in the PR or ops note.
4. Apply the production change.
5. Check Railway activity feed immediately after.
6. Verify health URLs and critical routes.

## High-Risk Actions Requiring Extra Care

- deleting a service
- deleting a volume
- changing `DATABASE_URL`
- changing `INTERNAL_API_KEY`
- changing `OPENCLAW_GATEWAY_URL`
- changing `BTC_BACKEND_NBXPLORER_URL`
- changing persistent mount paths

For these, pause and verify:

- target project is `motivated-comfort`
- target environment is `production` or `staging` intentionally
- service name exactly matches the intended target
- there is a recent backup if persistent data is involved

## Recovery Priorities

If production is damaged:

1. Check Railway activity feed
2. Check service deployment status
3. Confirm volumes are still attached
4. Confirm environment variables did not drift
5. Restore from volume backup if needed
6. Update [CURRENT_PLATFORM_STATE.md](/Users/raveculture/Documents/GitHub/agentbot/docs/CURRENT_PLATFORM_STATE.md) if production topology changed

## Notes For Future Agents

- Treat `motivated-comfort` as the protected production project.
- Prefer additive, reversible changes.
- Never delete services or volumes unless the user explicitly asks.
- If asked to “clean up Railway,” verify the exact project, environment, and service names first.
