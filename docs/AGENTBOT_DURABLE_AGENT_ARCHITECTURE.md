# Agentbot Durable Agent Architecture

## Why This Exists

The Vercel guide for Claude Managed Agents has several strong architectural ideas that Agentbot should adopt:

- durable workflow runs as execution engines
- replayable event streams
- pause/resume message hooks
- per-user credential vaults
- minimal metadata tables

Agentbot should steal those ideas.

It should **not** copy the product identity.

Agentbot still remains:

- OpenClaw-first for managed runtime operations
- private cloud for managed product lanes
- open source for self-hosted starter lanes
- x402-native
- BaseFM-aware

## What We Should Steal

### 1. Durable workflow per long-lived session

For agent interactions that take multiple turns or produce asynchronous events, create one durable workflow run and keep resuming it.

Use cases:

- X social agent sessions
- internal operator sessions
- managed support / incident sessions
- long-running research or outreach jobs

Benefits:

- one execution thread
- one replayable event timeline
- resumable after page refresh
- better than creating a fresh stateless job every turn

### 2. Workflow run as event log

The workflow run should be both:

- the executor
- the event history

The database should only store metadata like:

- who owns the session
- session title
- workflow run id
- last updated time

This reduces event duplication and avoids writing every token/event into Prisma.

### 3. Pause / resume hooks

Agentbot should support:

- first message starts the workflow directly
- follow-up messages resume the existing workflow

This avoids race conditions and keeps conversations or task sessions durable.

### 4. SSE / readable event stream

The UI should connect to a durable readable stream endpoint and receive:

- replay from the start
- live new events
- refresh-safe history

This is better than:

- repeated polling with ad hoc JSON
- fragmented UI state
- “refresh and lose context” behavior

### 5. Per-user credential vault pattern

Agentbot already has encrypted token storage patterns.

The next step is to formalize this into a credential vault layer that:

- stores per-user external credentials
- syncs them into usable runtime/tool contexts
- separates app-level and user-level credentials

Use cases:

- X API
- GitHub
- Notion
- Slack
- Discord
- Telegram
- future MCP integrations

## Agentbot-Specific Architecture

### Core Principle

Agentbot should use:

- **OpenClaw** for managed runtime control and deployed agent execution
- **Durable workflows** for user-facing asynchronous orchestration and replayable UI sessions

These are complementary, not competing.

### Split Of Responsibility

#### OpenClaw layer

Use OpenClaw for:

- managed runtime operations
- deployed cloud agent execution
- tool calling inside managed agent environments
- channel integrations
- long-running hosted agent behavior

#### Durable workflow layer

Use durable workflows for:

- user-facing chat/session orchestration
- X social agent drafting + approval sessions
- support and operator task streams
- event replay to the UI
- pause/resume interaction loops

## Recommended Data Model

Add a session metadata table for durable workflow-backed sessions.

Suggested shape:

### `managed_agent_session`

Fields:

- `id`
- `userId`
- `type`
- `title`
- `workflowRunId`
- `providerSessionId` (optional)
- `agentId` (optional)
- `environmentId` (optional)
- `updatedAt`
- `createdAt`

Optional `type` values:

- `x-social`
- `support`
- `ops`
- `research`
- `knowledge`

This table should **not** store the full event history.

## Recommended Event Flow

```text
user opens session
  -> create metadata row
  -> start workflow run
  -> first input passed directly

workflow executes
  -> emits events
  -> writes to durable readable stream

client connects via SSE
  -> receives replay
  -> receives live updates

follow-up message
  -> resume workflow hook
  -> continue same run
```

## Where To Apply This First

### 1. X social agents

This is the best first target.

Current state already exists:

- X app/user config
- X recent search ingestion
- draft generation
- approval queue

Next step:

- wrap this in a durable session
- stream signal -> draft -> approval events to the UI
- resume the same workflow on follow-up actions

### 2. Operator runtime sessions

For managed runtime diagnostics, use durable event streams for:

- probe results
- repair actions
- sync attempts
- restart/update progress

### 3. BaseFM event timeline

Do not use workflows for the actual media pipeline.

Do use them for:

- station event replay
- relay state changes
- stream pickup events
- broadcast summaries

## Credential Vault Strategy

Agentbot should standardize credentials in two layers:

### App-level credentials

Examples:

- Mux token id / secret
- OpenRouter API key
- Stripe secrets
- Railway API key

These belong to Agentbot infrastructure.

### User-level credentials

Examples:

- X account access tokens
- GitHub user tokens
- Notion user tokens
- Discord/Slack/Telegram user-scoped credentials

These should be:

- encrypted at rest
- stored per user
- exposed to workflows/tools only when needed

## Recommended Interfaces

### Session creation route

Pattern:

- create metadata row
- start workflow
- return `sessionId` + `runId`

### Message route

Pattern:

- look up metadata row
- verify ownership
- resume hook using deterministic token

### Readable SSE route

Pattern:

- verify ownership
- open workflow readable stream
- emit SSE events

## What To Avoid

Do not:

- store every event in Prisma when the workflow already stores them
- create a new workflow run for every single follow-up
- mix app credentials and user credentials in one settings blob
- tie Agentbot too tightly to one provider’s managed-agent product

## Recommended Implementation Order

### Phase 1

- add session metadata table
- add SSE readable endpoint
- add first durable workflow-backed X social session

### Phase 2

- move draft generation / approval queue into the workflow event model
- add ownership-checked resume route
- add replay-safe Signals UI

### Phase 3

- standardize credential vault abstraction
- connect GitHub / Notion / Slack / X through one vault layer

### Phase 4

- add workflow-backed operator sessions
- add workflow-backed BaseFM event timelines

## Agentbot Translation Of The Vercel Guide

What we are stealing:

- durable workflow sessions
- replayable SSE streams
- resume hooks
- minimal metadata table
- vault mindset

What we are not stealing:

- replacing OpenClaw with Anthropic Managed Agents everywhere
- making Agentbot depend on one agent provider
- abandoning the private-cloud + OSS split

## Conclusion

Agentbot should adopt the durable workflow architecture as an orchestration and UI-session layer.

It should keep OpenClaw as the managed runtime layer.

That combination is stronger than either one alone.
