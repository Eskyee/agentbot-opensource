# Agentbot Durable Agent Implementation Plan

## Goal

Implement durable, replayable, resumable agent sessions in Agentbot using the workflow primitives already present in the repo, while keeping OpenClaw as the managed runtime layer.

## Why Now

Agentbot now has:

- X app status
- encrypted user X account storage
- X recent-search ingestion
- X draft generation
- approval queue

This is enough surface area to justify a durable session architecture.

## First Target

Start with:

- **X social agent sessions**

Do not start with:

- BaseFM media transport
- generic all-agent chat
- every dashboard page at once

## Repo Facts

The repo already includes `workflow` packages in `web/package.json`.

Current useful building blocks:

- encrypted token storage in `web/app/lib/token-encryption.ts`
- user settings storage via `UserSetting`
- X app/user config in:
  - `web/app/lib/xApi.ts`
  - `web/app/api/user/x-account/route.ts`
  - `web/app/api/x/status/route.ts`
- X draft queue in:
  - `web/app/lib/xDrafts.ts`
  - `web/app/api/x/drafts/*`

## Deliverable 1: Session Metadata Table

Add a Prisma model such as:

### `managed_agent_sessions`

Fields:

- `id`
- `userId`
- `type`
- `title`
- `workflowRunId`
- `providerSessionId` (nullable)
- `agentId` (nullable)
- `environmentId` (nullable)
- `createdAt`
- `updatedAt`

Indexes:

- `(userId, updatedAt desc)`
- `(workflowRunId)`
- `(type)`

## Deliverable 2: Workflow For X Social Sessions

Create a workflow that:

1. accepts the first message/input directly
2. performs:
   - signal ingestion
   - draft generation
   - approval-needed event
3. pauses waiting for follow-up actions
4. resumes when the user:
   - requests a new draft
   - approves
   - rejects
   - requests publish

## Deliverable 3: Readable SSE Stream

Add:

- `/api/managed-agents/readable/[runId]`

Behavior:

- verify ownership using the metadata table
- read workflow stream
- emit SSE
- replay from the beginning on reconnect

## Deliverable 4: Resume Route

Add:

- `/api/managed-agents/message`

Behavior:

- verify ownership of the session
- resume the deterministic hook token
- continue the same workflow run

## Deliverable 5: Session Create Route

Add:

- `/api/managed-agents/session`

Behavior:

- create metadata row
- start workflow
- pass first message directly
- return:
  - `sessionId`
  - `runId`

## UI Integration

### Start in Signals dashboard

Replace ad hoc local draft state with:

- a durable session panel
- live event feed
- approval events
- publish events

This can coexist with the current route first, then absorb it.

### UI events to render

- `signal.detected`
- `draft.generated`
- `approval.required`
- `draft.approved`
- `draft.rejected`
- `publish.started`
- `publish.succeeded`
- `publish.failed`

## Credential Vault Layer

Short term:

- keep storing user credentials in encrypted `UserSetting` rows

Medium term:

- add a formal vault abstraction that wraps:
  - encrypted storage
  - provider metadata
  - scope
  - access policy

Suggested internal API:

- `getOrCreateVaultForUser(userId)`
- `putCredential(userId, provider, token)`
- `getCredential(userId, provider)`
- `deleteCredential(userId, provider)`

## Ownership Rules

Every session/readable/message route must:

- verify authenticated user
- verify user owns the session row
- deny cross-user readable access

This is mandatory.

## Event Model

Keep event payloads small and structured.

Suggested shape:

```ts
type ManagedAgentEvent = {
  id: string
  type: string
  payload: Record<string, unknown>
  occurredAt: string
}
```

## Agentbot-Specific Adaptation

### X social agent

Use durable workflow for:

- signals
- drafts
- approvals
- publishing

### Runtime operator sessions

Next target after X:

- probe
- repair
- sync
- deploy/update/restart events

### BaseFM

Only use workflow/event model for:

- station event log
- relay state changes
- pickup/reconcile events

Do not use it for:

- raw video/audio transport

## Delivery Order

### Phase 1

- add metadata table
- add session create route
- add readable SSE route
- add message resume route

### Phase 2

- create X social workflow
- connect Signals dashboard to workflow event stream
- preserve existing draft routes during migration

### Phase 3

- move publish flow into the workflow path
- remove duplicated ad hoc queue logic

### Phase 4

- reuse the same session architecture for runtime diagnostics

## Success Criteria

You know this worked when:

- refresh does not lose session history
- follow-up actions reuse the same run
- X draft generation and publish history replay after refresh
- ownership is enforced
- the database stores metadata only, not the full event transcript

## Anti-Slop Rules

Do not:

- create one workflow run per follow-up action
- duplicate the full event log into Prisma
- mix user credential storage with unrelated settings blobs forever
- conflate OpenClaw runtime execution with workflow session orchestration

Keep the layers separate:

- OpenClaw for runtime
- Workflow for orchestration and UI event history
