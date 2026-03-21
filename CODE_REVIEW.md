# Agentbot — Senior Code Review
**Date:** 2026-03-21
**Reviewer:** Senior Code Review (Claude)
**Scope:** `agentbot-backend/src/` — full backend
**Production URL:** https://agentbot.raveculture.xyz

---

## Summary

The codebase has a solid architectural vision — Docker-managed agent containers, A2A messaging with wallet/crypto rails, tiered AI fallback, and a Caddy-based routing layer. The intent is clear and the individual modules are generally well-structured. However, there are **several critical bugs that are almost certainly breaking production today**, alongside a cluster of high-severity security issues that need attention before this handles real user funds and bot tokens.

**Overall Ratings:**
| Dimension | Rating |
|---|---|
| Security | 🔴 Critical |
| Correctness | 🔴 Critical |
| Performance | 🟡 Moderate |
| Maintainability | 🟡 Moderate |

---

## 🔴 Critical — Correctness (Production-Breaking Bugs)

### 1. No body-parsing middleware — `req.body` is always `undefined`
**File:** `src/index.ts` (entire file)

`express()` is created at line 35 but `app.use(express.json())` is never called anywhere in the file. This means every POST endpoint that reads from `req.body` silently receives `undefined`. Every deployment, agent creation, and AI chat request is broken. The `cors` package is also imported but never applied — CORS headers are never sent.

```typescript
// Current — body parsing never registered
const app = express();
// ... 400+ lines later, routes start with req.body === undefined
```

This is the single most impactful bug in the project. Add immediately before route registration:
```typescript
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
```

---

### 2. All imported routers are never mounted
**File:** `src/index.ts`, lines 2–8

Seven routers are imported — `inviteRouter`, `undergroundRouter`, `missionControlRouter`, `aiRouter`, `renderMcpRouter`, `metricsRouter`, `provisionRouter` — but `app.use()` is never called for any of them. Every route defined in those files is unreachable. The AI endpoints, metrics router, and provision endpoint are all dead.

```typescript
import aiRouter from './routes/ai';        // imported
import metricsRouter from './routes/metrics'; // imported
// ... but app.use('/api/ai', aiRouter) is never called
```

---

### 3. `spawn()` used as if it returns `{ stdout }` — silent failure
**File:** `src/routes/metrics.ts`, lines 59–64, 150–156, 210–216

`child_process.spawn()` returns a `ChildProcess` object, **not** a promise resolving to `{ stdout: string }`. Destructuring `{ stdout }` from its return value gives `undefined`. The entire Docker-stats collection path in the metrics router silently does nothing and always returns empty data.

```typescript
// Bug: spawn() doesn't return { stdout }
const { stdout: statsOutput } = await (await import('child_process')).spawn('docker', [...]);
// statsOutput === undefined — always
```

The correct approach is `child_process.exec()` (promisified) or the `runCommand` helper that already exists in `src/index.ts`.

---

### 4. Auto-updater uses wrong volume name
**File:** `src/index.ts`, line 1227

Containers are provisioned with volume `openclaw-data-${agentId}` (line 948), but the auto-updater restarts them with volume `agentbot-${agentId}`. Every auto-updated container starts with no data.

```typescript
// Provisioning creates:
const volumeName = `openclaw-data-${safeAgentId}`;

// Auto-updater uses:
'-v', `agentbot-${agentId}:/home/node/.openclaw`,  // wrong — data lost on update
```

---

### 5. `repair` double-calls recreate in catch block
**File:** `src/index.ts`, lines 1141–1145

In the repair endpoint's catch block, `recreateContainerWithImage` is called again with the same arguments that just failed. This guarantees a second failure and an unhelpful double error, leaving the user with no container at all.

```typescript
} catch (e) {
  await recreateContainerWithImage(containerName, inspect, oldImage); // will also fail
  throw e;
}
```

---

### 6. `dotenv.config()` called twice
**File:** `src/index.ts`, lines 15 and 51

Harmless but signals copy-paste entropy. Remove the duplicate at line 51.

---

## 🔴 Critical — Security

### 7. Hardcoded fallback API key
**File:** `src/index.ts`, line 39

```typescript
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-api-key-build-only'
```

If `INTERNAL_API_KEY` is missing from the environment (misconfiguration, deploy failure, etc.), the entire management API becomes accessible with a publicly visible hardcoded string. The server should **refuse to start** if this is missing in production.

```typescript
if (!process.env.INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('INTERNAL_API_KEY must be set in production');
}
```

---

### 8. Hardcoded wallet encryption key fallback
**File:** `src/services/wallet.ts`, line 9

```typescript
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'default-secret-key-change-me';
```

This service encrypts wallet metadata and seeds before storing to the database. If `WALLET_ENCRYPTION_KEY` is ever missing, every wallet gets encrypted with a known key. Combined with any database breach, all user wallets are immediately compromised. Same "refuse to start" pattern applies here.

---

### 9. SSRF via agent webhook delivery
**File:** `src/services/bus.ts`, lines 76–96

`deliverMessage()` fetches a `webhookUrl` from the database and makes an HTTP POST to it with no validation. If an attacker can write to the `agents` table (via SQL injection, a compromised session, or a rogue agent), they can point the webhook at internal services — the Caddy admin API, the database, cloud metadata endpoints, etc.

Add domain allowlisting or at minimum scheme+host validation before the fetch.

---

### 10. Message signatures never verified before delivery
**File:** `src/services/bus.ts`

`verifyMessage()` is implemented and correct, but it is **never called** before `deliverMessage()`. Any actor can forge an A2A message (BOOKING_ACCEPT, AMPLIFY_REQUEST, etc.) with an arbitrary `from.agentId` and the message will be delivered and acted upon.

`verifyMessage()` must be called at the top of `deliverMessage()`, and delivery must abort if verification fails.

---

### 11. Unauthenticated metrics endpoints expose Docker internals
**File:** `src/index.ts`, lines 488–518

`/api/metrics/:userId/historical` and `/api/metrics/:userId/performance` have no `authenticate` middleware. Any internet client can call these with any `userId` value, causing the server to run `docker stats openclaw-{userId}` — leaking container existence, CPU, and memory data for any agent ID.

---

### 12. Weak gateway token generation
**File:** `src/index.ts`, line 1118

```typescript
const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
```

`Math.random()` is not cryptographically secure. These tokens are used for agent gateway authentication. Replace with `crypto.randomBytes(32).toString('hex')`.

---

### 13. Non-constant-time API key comparison
**File:** `src/index.ts`, line 476

```typescript
if (token !== API_KEY)
```

String comparison short-circuits on the first differing byte, enabling timing attacks to recover the key one character at a time. Use `crypto.timingSafeEqual(Buffer.from(token), Buffer.from(API_KEY))`.

---

### 14. Bot tokens reflected in provision response
**File:** `src/routes/provision.ts`, lines 81–83

The POST /api/provision response body echoes back `telegramToken`, `discordToken`, and `whatsappToken` in plaintext. Any logging proxy, CDN, or error reporting tool will store these credentials. Remove them from the response — return the agentId/userId only.

---

### 15. Mock credentials shipping to production
**File:** `src/routes/provision.ts`, lines 15–20

```typescript
const generateMuxCredentials = () => ({
  streamKey: `sk-${Math.random()...}`,
  liveStreamId: Math.random()...
  // ...
});
```

This entire endpoint generates fake Mux credentials using `Math.random()`. The comments acknowledge this is a stub, but it is deployed to production. Users calling this endpoint receive invalid stream keys and live stream IDs. The endpoint must either integrate with the real Mux API or be gated behind a feature flag.

---

### 16. Path traversal in metrics file reads
**File:** `src/routes/metrics.ts`, lines 44, 175

`userId` from URL params is used directly in `path.join()` without sanitization. A request to `/api/metrics/../../../etc/passwd/historical` would attempt to read an unintended file path. Apply the same `sanitizeAgentId()` function from `index.ts` before building file paths.

---

### 17. No rate limiting anywhere
No rate limiting is applied to any endpoint — provisioning, deployment, AI chat, metrics, or agent management. This enables trivial abuse: spinning up unlimited Docker containers, exhausting OpenRouter credits, or flooding the A2A bus.

---

## 🟡 High — Performance

### 18. N+1 pattern in amplification broadcast
**File:** `src/services/amplification.ts`, lines 35–60

`broadcastCampaign` fetches all partner agents, then calls `deliverMessage()` in a serial `for...of` loop. Each delivery does its own DB lookup. For 1,000 agents this is 1,000 sequential network calls. Use `Promise.allSettled()` with a concurrency limiter (e.g. 20 at a time).

---

### 19. Auto-updater updates all containers sequentially
**File:** `src/index.ts`, lines 1213–1237

`updateAllContainers` iterates agents with `await` inside a `for...of` loop. With 50 agents, each taking ~30s to pull + restart, a full update cycle takes 25+ minutes. This blocks the process and delays any rollback. Parallelize with a concurrency cap.

---

### 20. Metrics logic duplicated 5+ times
The Docker stats parsing block (CPU%, memory regex, variance generation) is copy-pasted identically in `src/index.ts` (twice) and `src/routes/metrics.ts` (three times). A bug fix needs to be applied in five places. Extract to a shared helper.

---

### 21. No timeout on AI model requests
**File:** `src/services/ai.ts`, lines 52–68

Each model attempt uses bare `fetch()` with no timeout. If OpenRouter is slow, the request hangs indefinitely, blocking the response and potentially a connection pool slot. Add `AbortController` with a per-attempt timeout (e.g., 30s), separate from the total fallback timeout.

---

## 🟡 Moderate — Correctness

### 22. No compensation if wallet DB insert fails
**File:** `src/services/wallet.ts`, lines 57–77

If the PostgreSQL insert fails after a CDP account is already created on-chain, the wallet exists on Base Mainnet but is unrecorded. There's no retry, compensation, or orphan cleanup. This leaves users with inaccessible on-chain funds.

---

### 23. USDC balance precision ambiguity
**File:** `src/services/wallet.ts`, line 134

```typescript
const balance = usdcBalance ? Number(usdcBalance.amount) : 0;
```

USDC uses 6 decimal places. Depending on what the CDP SDK returns for `amount` (raw units vs. human-readable), this could store 1,000,000 as the balance when the actual balance is $1.00. Verify the unit, add explicit USDC decimals handling.

---

### 24. Negotiation has no ownership check
**File:** `src/services/negotiation.ts`, lines 44–51

`finalizeContract` accepts any `bookingId` from the message payload and updates its status to `accepted` without verifying that the sender's agent is actually the intended counterparty for that booking. Any agent can accept any booking.

---

### 25. AI metrics stored in wrong table
**File:** `src/services/ai.ts`, line 98

Model performance metrics (latency, success rate) are inserted into `treasury_transactions` with `type='ai_metric'`. This pollutes financial data with operational telemetry. These should go to a dedicated `model_metrics` or `ai_logs` table.

---

## 🔵 Maintainability

### 26. 1,278-line God file
**File:** `src/index.ts`

Docker management, agent CRUD, container backup, auto-updater scheduling, port locking, config generation, and the HTTP server bootstrap all live in a single file. This makes unit testing nearly impossible and reasoning about state changes difficult. The planned `plans/BACKEND_CONSOLIDATION_PLAN.md` is the right move — prioritize it.

---

### 27. Stub routes shipping to production
**File:** `src/index.ts`, lines 756–763, 797–807

`POST /api/agents`, `PUT /api/agents/:id`, and `DELETE /api/agents/:id` return hardcoded stub JSON with TODO comments. They're deployed and respond with misleading success messages while doing nothing.

---

### 28. `any` types in critical paths
`payload: any` in `AgentMessage`, `metrics: any[]` in `index.ts`, `metadata?: Record<string, any>` — these disable TypeScript's ability to catch type errors in the most sensitive parts of the codebase (wallet operations, agent messaging, metrics).

---

### 29. Dead code accumulation
- `src/services/caddy.ts` — documented as "not imported in the main application"
- `src/routes/metrics.ts` — complete duplicate of metrics logic in `index.ts`, never mounted
- All seven imported routers in `index.ts` — unreachable

---

### 30. No request/response logging or tracing
There's no structured logging middleware (Morgan, Winston, etc.) or distributed tracing. Debugging production issues requires reading raw `console.error()` output. Add structured logging with request IDs early — it will pay dividends immediately.

---

## ✅ What's Done Well

These are genuine strengths worth preserving:

- **`runCommand` uses `spawn()` with arg arrays** in `index.ts` — correctly avoids shell injection for the core Docker orchestration commands
- **`sanitizeAgentId()`** — strips unsafe characters before building container names; consistently applied in the provisioning path
- **`DOCKER_IMAGE_REGEX` and `DOCKER_VOLUME_NAME_REGEX`** — validates Docker inputs before use; the update endpoint correctly rejects invalid images
- **`withLock()` for port assignment** — file-based mutex correctly prevents race conditions during concurrent provisioning
- **`crypto.randomBytes()`** in `invite.ts` — invite codes are generated securely (great contrast with the gateway token issue above)
- **Tiered AI fallback** in `AIService.prompt()` — graceful degradation across primary and fallback models is a solid pattern
- **Wallet encryption** — the intent to encrypt wallet metadata before DB storage is correct; the key management just needs hardening
- **ethers.js signature verification** in `bus.ts` — the implementation itself is correct; it just needs to be wired in

---

## Priority Fix Order

1. **Add `express.json()` and mount routers** — nothing works without this
2. **Fix `spawn()` → `exec()` in routes/metrics.ts** — silent failure
3. **Fix auto-updater volume name** — data loss on every auto-update
4. **Harden API key and encryption key env vars** — refuse to start if missing in production
5. **Add authentication to metrics endpoints** — information leak
6. **Wire in `verifyMessage()` before `deliverMessage()`** — A2A auth bypass
7. **Replace `Math.random()` for tokens** — use `crypto.randomBytes()`
8. **Add rate limiting** — abuse vector on all endpoints
9. **Validate webhook URLs** before fetch in bus delivery — SSRF
10. **Implement or gate the provision stub** — fake credentials in production
