---
name: code-review
description: Review agent code against Agentbot production best practices. Use when reviewing PRs, auditing agent code, or checking for common anti-patterns in security, state management, and container configuration. Triggers on "code review", "review PR", "audit code", "best practices check".
---

# Code Review — Agentbot Production Best Practices

Review agent and platform code against production patterns. Flag anti-patterns before they reach production.

## Review Checklist

### 1. Security

| Rule | Check |
|------|-------|
| Bearer token auth | All protected routes use `timingSafeEqual`, fail-closed |
| API key storage | SHA-256 hashed in DB, raw keys never stored |
| Shell commands | `spawn()` not `exec()` — no shell injection |
| SSRF protection | Outbound requests blocked for private IPs (IPv4/IPv6/CGN) |
| Webhook verification | Ed25519 for Discord, HMAC for Stripe/Mux/WhatsApp |
| Secret handling | No secrets in code, logs, Dockerfiles, or git |
| Timing attacks | `crypto.timingSafeEqual()` for all secret comparisons |
| Random values | `crypto.randomUUID()` / `crypto.getRandomValues()`, never `Math.random()` |

### 2. State Management

| Rule | Check |
|------|-------|
| DB-backed state | No in-memory-only stores (must survive restart) |
| Atomic operations | `UPDATE...RETURNING` for invite codes, no race conditions |
| Transaction safety | Related writes in single transaction |
| No global mutables | Request-scoped data never in module-level variables |

### 3. Error Handling

| Rule | Check |
|------|-------|
| Fail-closed | Auth/webhook failures reject by default |
| Explicit try/catch | Structured error responses, no silent swallowing |
| Every Promise handled | `await`, `return`, or explicit `.catch()` — no floating promises |
| No fake success states | Don't hide production failures behind fallback data |

### 4. Container & Deployment

| Rule | Check |
|------|-------|
| Non-root user | Dockerfile uses `USER agent`, not root |
| Health checks | `HEALTHCHECK` in Dockerfile, `/health` endpoint |
| Resource limits | Memory/CPU set per plan tier |
| Image size | Alpine base, multi-stage build, no devDependencies |
| Restart policy | `--restart=unless-stopped` |

### 5. TypeScript

| Rule | Check |
|------|-------|
| Strict mode | No `any` where avoidable |
| Zod validation | All external input validated with Zod schemas |
| Prisma for ORM | DB-backed state via Prisma, not raw SQL |
| No unsafe casts | No `as unknown as T` double-casts |

## Anti-Patterns to Flag

| Anti-Pattern | Severity | Why |
|-------------|----------|-----|
| `exec()` for shell commands | Critical | Shell injection |
| Secrets in source/logs | Critical | Credential leak |
| `Math.random()` for tokens | High | Predictable, not secure |
| In-memory-only state | High | Lost on container restart |
| Missing SSRF check on outbound fetch | High | Private network access |
| `any` on auth/request types | Medium | Defeats type safety |
| Floating promises | Medium | Dropped results, swallowed errors |
| Hardcoded marketing numbers | Medium | Misleads users about platform state |
| Direct HTTP between agents | Medium | SSRF risk — use agent bus |
| `passThroughOnException` pattern | Low | Hides bugs |

## Review Workflow

1. **Read full files** — not just diffs; context matters for auth patterns
2. **Check auth gates** — every protected route must have bearer token validation
3. **Check state persistence** — all agent state must be DB-backed
4. **Check error paths** — fail-closed, no silent failures
5. **Check secrets** — `git diff --cached` for any leaked keys/tokens
6. **Validate types** — `npm run build` must pass with zero errors
7. **Run audit** — `npm audit` should show zero high-severity vulnerabilities

## Quick Validation Commands

```bash
# TypeScript check
cd web && npm run build
cd agentbot-backend && npm run build

# Security audit
npm audit

# Check for leaked secrets
git diff --cached | grep -iE '(api_key|secret|token|password|private_key).*='

# Check for exec() usage (should be spawn())
rg 'exec\(' --type ts -g '!node_modules'

# Check for Math.random in security contexts
rg 'Math\.random' --type ts -g '!node_modules'
```

_Adapted from [Kilo-Org/cloud](https://github.com/Kilo-Org/cloud/tree/main/.agents/skills/workers-best-practices) Workers review patterns for Agentbot's security model._
