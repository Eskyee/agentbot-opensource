# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Open a [GitHub Security Advisory](https://github.com/Eskyee/agentbot-opensource/security/advisories/new) instead. We will respond within 48 hours.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

## Security Architecture

### Authentication & Authorization

- **Bearer token auth** on all protected API routes using `timingSafeEqual` (constant-time comparison)
- **SHA-256 hashed API keys** stored in `api_keys` table — raw keys are never stored
- **Atomic invite code consumption** via `UPDATE…RETURNING` to prevent race conditions
- **Fail-closed default** — auth checks deny access on any ambiguity

### Data Isolation

- **Row-Level Security (RLS)** enforced at the PostgreSQL level for all user data
- Users can only read/write their own agents, tasks, memories, and files
- Admin bypass requires explicit role assignment — not just email matching

### Webhook Verification

Webhooks are verified using platform-provided secrets before processing:
- **Stripe:** `HMAC-SHA256` signature verification via `stripe.webhooks.constructEvent()`
- **Discord:** `Ed25519` signature verification
- **WhatsApp / Mux:** Fail-closed — unverified events are dropped

### SSRF Protection

The agent bus (`bus` service) includes a blocklist covering:
- IPv4 private ranges (10.x, 172.16–31.x, 192.168.x)
- IPv6 ULA (`fc00::/7`)
- IPv6-mapped IPv4 addresses
- Carrier-grade NAT (`100.64.0.0/10`)

### Shell Safety

All shell commands use `spawn()` not `exec()` — no shell injection is possible.

### Secret Scanning

Every push runs GitLeaks + TruffleHog via GitHub Actions. Pre-push scanning is also available:

```bash
bash scripts/check-secrets.sh .
```

## Agent Sandbox

Each agent runs in an isolated Docker container:
- No persistent network access to the host
- Limited file system permissions
- CPU and memory resource limits enforced
- No access to the host system or other containers

## AI Provider Keys

Users provide their own AI API keys (BYOK). Agentbot does not store or access these keys beyond the agent's runtime container. Keys are injected as environment variables and never logged.

## Dependency Management

- Run `npm audit` regularly in both `web/` and `agentbot-backend/`
- Critical vulnerabilities should be patched immediately
- Dependencies are pinned — avoid floating versions in production

## Best Practices for Deployers

1. **Never commit secrets** — use environment variables via Render/Vercel dashboards
2. **Rotate keys regularly** — especially after team member offboarding
3. **Enable 2FA** on all service accounts (GitHub, Render, Vercel, Stripe)
4. **Review RLS policies** after every schema migration
5. **Monitor access logs** for unusual patterns
6. **Keep ADMIN_EMAILS minimal** — grant admin access only to those who need it
