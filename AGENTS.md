# Agentbot Context

Last updated: Feb 2026

## Quick Summary
Agentbot is a hosted OpenClaw platform where users sign up, choose a plan, and deploy their AI agent. Users bring their own AI API keys (OpenRouter, Groq, Anthropic, etc.).

## Pricing (5 Plans)
| Plan | Price | RAM | CPU | 
|------|-------|-----|-----|
| Starter | £19/mo | 2GB | 1 |
| Pro | £39/mo | 4GB | 2 |
| Scale | £79/mo | 8GB | 4 |
| Enterprise | £149/mo | 16GB | 4 |
| White Glove | £199/mo | 32GB | 8 |

## Key Tech
- **Frontend:** Next.js 16 (Vercel)
- **Backend:** Node.js Express
- **Database:** Neon (PostgreSQL)
- **Payments:** Stripe (subscription)
- **Auth:** NextAuth (GitHub, Google, Email)
- **AI Models:** OpenRouter default (Kimi K2.5)

## Important Files
- `web/app/pricing/page.tsx` - Pricing page
- `web/app/docs/page.tsx` - Docs
- `agentbot-backend/src/index.ts` - Backend (Docker provisioning)
- `web/app/api/stripe/checkout/route.ts` - Stripe checkout

## Stripe Setup
- Products are generally created manually in the Stripe dashboard so the team can control naming and descriptions.
- There are five plan prices at launch: £19, £39, £79, £149 and £199 per month.
- **Checkout behavior** – the code in `web/app/api/stripe/checkout/route.ts` drives how the system finds or creates what it needs:
  1. When a customer opens `/api/stripe/checkout?plan=<plan>`, the handler attempts to locate an existing price. Instead of a single-page fetch it now pages through all *active* GBP prices (`stripe.prices.list({ active: true, currency: 'gbp', limit: 100, starting_after })`) collecting every item until `has_more` is false. Only after assembling `allPrices` does the handler search for a match where:
     - `recurring.interval === 'month'`
     - `unit_amount` exactly equals the amount for the requested plan (e.g. 1900 for Starter)
     - the price is active
     - `currency === 'gbp'` (explicit filter on the API call guarantees this)
  2. If a matching price is found, its `id` is used for the checkout session and no creation occurs.
  3. If the lookup fails, the code performs a **paginated product search** similar to the price logic. It repeatedly calls `stripe.products.list({ active: true, limit: 100, starting_after })` until it finds a product whose `name` equals the plan's human‑readable name. If no existing product is discovered, the handler creates one.
     - Both `stripe.products.create` and `stripe.prices.create` calls now supply deterministic idempotency keys derived from stable plan identifiers (`product_<normalizedName>` for products, `price_<currency>_<amount>_<interval>` for prices). Providing a consistent key means concurrent checkout requests race through Stripe's idempotency mechanism rather than spinning up duplicates. The search steps remain as a fallback, but the keys ensure atomic check‑and‑create semantics without needing an external lock.
     - When creating a price the handler also specifies `currency: 'gbp'` so the new object is correct from the outset.
  4. The resolved or newly created price ID is used in the `stripe.checkout.sessions.create(...)` call. Metadata (`plan`, `source`) is still attached to the session for bookkeeping.

- **Idempotency & duplicate safeguards**: the code now actively leverages Stripe’s idempotency feature to make product/price creation repeatable. Keys are deterministic and collision-free, so simultaneous invocations referring to the same plan will return the same existing resource. The previous search‑only approach remains but is no longer the only defense.
  * Because the list calls paginate, there is no risk of missing a price or product due to pagination limits.
  * Currency filtering is explicitly applied on the API calls, eliminating confusion between GBP and potential future EUR prices.
  * The keys use normalized plan names and a combination of currency, amount, and interval to avoid accidental collisions.

- **Automatic creation scope**: checkout still only creates Price objects (and new Products when absolutely required). Customers, Subscriptions, etc. are unaffected.

- **Potential duplicate scenarios & recommended mitigations**
  - Manual edits in the Stripe dashboard (e.g. changing a product name) can still confuse the lookup; keep naming consistent and consider encoding a secret metadata field that the code can also match.
  - The new logic makes duplicates extremely unlikely, but audits of the Stripe dashboard remain a good practice.

By understanding and documenting this flow, maintainers can make deliberate changes and avoid inconsistent Stripe state.
## GitHub OAuth (for login)
- Client ID: Set in Vercel env vars (GITHUB_CLIENT_ID)

## Docker Resources
- Each plan gets tiered RAM/CPU limits
- Starter: 2GB RAM, 1 CPU
- Configured in `agentbot-backend/src/index.ts`

## No Credit System
Users bring their own API keys. No credits to manage.

## Known Issues
- GitHub OAuth callback needs correct Client ID in Vercel

## OpenClaw Versions

### 1. Personal OpenClaw (Mac mini local)
- NOT in Docker - runs directly on Mac mini via `openclaw` CLI
- NOT exposed publicly - local only, just for you
- Updated via: `openclaw update` CLI
- For: Your personal testing only
- Version: 2026.2.26 (latest)

### 2. Agentbot OpenClaw (Docker containers)
- Runs in Docker via agentbot-backend
- New deployments use: `ghcr.io/openclaw/openclaw:2026.2.26`
- Auto-updater checks GitHub releases daily
- For: Customer deployments only

## Multi-Agent Orchestration

Agentbot is designed to scale beyond single-agent deployments. Each user's Docker container runs an OpenClaw instance that can orchestrate multiple AI agents working together.

- **Per-Container Architecture:** Each customer gets their own Docker container with dedicated RAM/CPU
- **Agent Coordination:** OpenClaw handles multi-agent communication and task delegation
- **Scaling Strategy:** Higher-tier plans provide more resources for complex multi-agent workflows
- **Future Roadmap:** Multi-container deployments for enterprise customers requiring isolated agent pools
