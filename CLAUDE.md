# Memory

## Me
raveculture — founder/developer, building agentbot platform.
Email: YOUR_ADMIN_EMAIL_5

## Projects
| Name | What |
|------|------|
| **agentbot** | SaaS platform that provisions & manages AI agent containers (OpenClaw runtime) for music/culture industry users |
| **web** | Next.js frontend — agentbot.raveculture.xyz |
| **agentbot-backend** | Express/TypeScript API server — manages Docker containers, webhooks, payments |
| **OpenClaw** | The AI agent runtime that runs inside each Docker container |

## Stack
| Term | Meaning |
|------|---------|
| **agentbot-backend** | Express + TypeScript backend API |
| **web** | Next.js 14 frontend |
| **Neon / pg** | PostgreSQL database (@neondatabase/serverless) |
| **Caddy** | Reverse proxy — routes agent subdomains |
| **OpenRouter** | AI model routing layer (Gemini, GPT-4o, DeepSeek, etc.) |
| **Mux** | Video streaming platform (webhooks) |
| **CDP / Coinbase** | Coinbase Developer Platform — agent wallets (USDC) |

## Plans (Pricing Tiers)
| Plan | Price | Memory | CPUs |
|------|-------|--------|------|
| solo | £29/mo | 2g | 1 |
| collective | £69/mo | 4g | 2 |
| label | £149/mo | 8g | 4 |
| network | £499/mo | 16g | 4 |

## Key Services (agentbot-backend/src/services/)
| Service | What it does |
|---------|-------------|
| **underground** | Culture/music vertical — wallets, agent bus, amplification, negotiation |
| **bus** | Agent-to-agent messaging (SSRF-protected webhook delivery) |
| **wallet** | USDC wallets per agent (Coinbase CDP) |
| **amplification** | Agent content amplification (ownership-checked) |
| **negotiation** | Agent-to-agent deal negotiation |
| **ai-provider** | OpenRouter integration + per-user token quota tracking |
| **caddy** | Programmatic Caddy config for agent subdomain routing |
| **db-init** | PostgreSQL schema init (invite_codes, api_keys, model_metrics, etc.) |

## Security (completed audit)
- Bearer token auth gate (timingSafeEqual, fail-closed) on all protected routes
- SHA-256 hashed API keys in api_keys table — raw keys never stored
- Atomic invite code consumption (UPDATE…RETURNING)
- Ed25519 Discord interactions (not SHA256)
- Fail-closed webhooks (WhatsApp, Mux, Stripe, Discord)
- SSRF blocklist covering IPv4 private + IPv6 ULA + IPv6-mapped IPv4 + CGN
- spawn() not exec() — no shell injection

## Preferences
- TypeScript strict, no `any` where avoidable
- Spawn over exec for all shell commands
- DB-backed state (no in-memory stores — survives restarts)
- Fail-closed security patterns everywhere
- Tests: Jest + supertest on backend, Playwright on web
