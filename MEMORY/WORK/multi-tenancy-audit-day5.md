# Multi-Tenancy Audit — Day 5 (March 16, 2026)

## Verdict: NOT SAFE for multi-tenant production

4 critical, 4 high, 3 medium, 3 low issues found.

## Critical (fix before any user deploys an agent)

1. **Backend auth validates API key only, not user identity** — Any request with valid INTERNAL_API_KEY can access ANY agent. Complete multi-tenancy bypass.

2. **Agent endpoints have no ownership validation** — GET/PUT/DELETE on /api/agents/:id return any agent regardless of who's asking. User A can read/modify/delete User B's agents.

3. **Deployments create containers with no userId** — metadata.json stores agentId and config but no userId. No way to verify who owns a container after creation.

4. **Bull queue worker processes jobs without validation** — Royalty split worker accepts job data from queue without verifying userId or signing. Attacker can enqueue fake jobs to steal royalties.

## High (fix this week)

5. **Port allocation uses agentId only** — Should be (userId, agentId) tuple for proper isolation.

6. **Container listing returns ALL agents** — /api/openclaw/instances shows every Docker container to any authenticated user.

7. **Prisma schema has no foreign key constraints** — Agent, ScheduledTask, AgentMemory models have userId/agentId strings with no @relation.

8. **Frontend proxies to backend without ownership check** — web/app/api/agents/[id]/ checks session exists but never verifies session.user.id owns the agent before forwarding.

## The fix pattern (same for all critical/high)
Every agent endpoint needs this before doing anything:
```typescript
const agent = await prisma.agent.findFirst({
  where: { id: agentId, userId: session.user.id }
});
if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
```
