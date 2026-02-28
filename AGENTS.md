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
  1. When a customer opens `/api/stripe/checkout?plan=<plan>`, the handler looks up an *active* price by calling `stripe.prices.list({ active: true, limit: 100 })` and then searches the returned array for a price where:
     - `recurring.interval === 'month'`
     - `unit_amount` exactly equals the amount for the requested plan (e.g. 1900 for Starter)
     - the price is active
     (currency is assumed to be GBP since all created prices use `currency: 'gbp'` but is **not** explicitly filtered during the search.)
  2. If such a price exists, its `id` is used for the checkout session. No further creation is performed.
  3. If the lookup fails, the code will search active products (`stripe.products.list({ active: true, limit: 10 })`) for one with a matching `name`.
     - If **no product** is found, a new one is created using `stripe.products.create({ name: planName, active: true })`.
     - A new Price object is then created via `stripe.prices.create(...)` with the correct `unit_amount`, `currency: 'gbp'`, `recurring: { interval: 'month' }` and the product ID returned above.
  4. The newly created price ID is used in the `stripe.checkout.sessions.create(...)` call. Metadata (`plan`, `source`) is attached to the session for bookkeeping.

- **Idempotency & duplicate safeguards**: the flow itself prevents obvious duplicates by performing the search before creating a price. Since the product lookup only uses `name` and the price lookup only uses amount/interval/active, prices can still be duplicated if:
  * there are more than 100 active prices and the desired one is paged out of the list (the `limit: 100` cutoff);
  * the currency changes or a plan needs an alternate currency (not currently handled in search);
  * someone manually creates a price with the same amount but the interval is not `month` (will be skipped and a new price created);
  * a product’s name is changed, leading to another product being created in checkout.

  To mitigate these scenarios maintainers should:
  - manage products manually where possible and **disable the auto-create logic** if duplicate products/prices are unacceptable (comment out or remove the creation blocks in `route.ts`).
  - keep consistent metadata or use the `nickname` field on prices to add unique identifiers that can be included in the search logic.
  - periodically audit the Stripe dashboard for unintended duplicates and deactivate any extras.

- **Automatic creation scope**: checkout will **only create a new Price object** and, if absolutely necessary, a corresponding Product. It does **not** create Customers, Subscriptions, or other resources. There is no idempotency key passed to Stripe calls; the search before create is the only safeguard.

- **Potential duplicate scenarios & recommended mitigations**
  - If team members create products/prices manually with slightly different names or amounts, the lookup may fail and checkout will spin up another product/price. Keep naming consistent and consider adding a shared constant or metadata to detect existing ones.
  - Because the lookup ignores currency in its filter, creating a GBP price and then a EUR price with the same unit amount would confuse the system; avoid mixing currencies on a given plan or extend the filter accordingly.
  - For high-volume production, remove or refactor the `limit: 100` retrieve to paginate through all active resources.

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
