# Agentbot Context

Last updated: Mar 14 2026

## Quick Summary
Agentbot is a hosted OpenClaw platform where users sign up, choose a plan, and deploy their AI agent. Users bring their own AI API keys (OpenRouter, Groq, Anthropic, etc.).

## Production URLs
- **Web:** https://agentbot-two.vercel.app
- **Custom Domain:** https://agentbot.raveculture.xyz
- **Agents Domain:** https://agents.raveculture.xyz

## Pricing (4 Plans)

SOLO
Creative agents only. Chat with fans, generate artwork. No business automation.
£29/mo
✓
1 Creative Agent thread
✓
Fan engagement (Telegram)
✓
BlockDB queries for A&R
✗
No OpenClaw business
SELECT
POPULAR
COLLECTIVE
Creative crew + 1 OpenClaw seat (digital tour manager).
£69/mo
✓
3 Creative Agent threads
✓
1 OpenClaw Business seat
✓
Email Triage (50/day)
✓
x402 USDC Invoicing
SELECT
LABEL
Full back office — 3 OpenClaw seats + 10 creative agents.
£149/mo
✓
10 Creative Agent threads
✓
3 OpenClaw Business seats
✓
Multi-inbox (A&R@, Booking@)
✓
White-label emails
SELECT
NETWORK
Agencies — resell the future. Unlimited everything.
£499/mo
✓
Unlimited Creative Agents
✓
Unlimited OpenClaw seats
✓
White-label (resell)
✓
99.9% SLA guarantee
SELECT


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

## x402 Payments (USDC on Base)

Agentbot supports x402 payment protocol for paid API endpoints - agents can pay for API access using USDC on Base.

### Setup

- **Packages installed:** `@x402/express`, `@x402/core`, `@x402/evm`, `@x402/extensions`
- **Payment address:** Bankr wallet `0xd8fd0e1dce89beaab924ac68098ddb17613db56f`
- **Config file:** `web/lib/x402.ts`

### Creating Paid Endpoints

Import the x402 config in your route:

```typescript
import { getX402Server, x402Config } from "@/lib/x402";
```

Example paid endpoint structure:

```typescript
export async function GET(req: NextRequest) {
  const server = getX402Server();
  
  const paymentRequirements = {
    accepts: {
      scheme: "exact",
      price: "$0.001",
      network: "eip155:8453",
      payTo: x402Config.payTo,
    },
    description: "Endpoint description",
    mimeType: "application/json",
  };

  // Check for payment header
  const authHeader = req.headers.get("x-payments");
  if (!authHeader) {
    return new NextResponse(JSON.stringify({ 
      error: "Payment required",
      payment: paymentRequirements 
    }), { status: 402 });
  }

  // Verify payment and return data
  // ...
}
```

### Environment Variables

```bash
X402_PAY_TO=0xd8fd0e1dce89beaab924ac68098ddb17613db56f
X402_FACILITATOR_URL=https://x402.org/facilitator
```

### Supported Networks

- Base mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`

## GitHub OAuth (for login)
- Client ID: Set in Vercel env vars (GITHUB_CLIENT_ID)

## Docker Resources
- Each plan gets tiered RAM/CPU limits
- Starter: 2GB RAM, 1 CPU
- Configured in `agentbot-backend/src/index.ts`

## No Credit System
Users bring their own API keys. No credits to manage.

## Token Info

### BASEFM (Primary Token)
- **Contract:** `0x9a4376bab717ac0a3901eeed8308a420c59c0ba3`
- **Profile:** https://bankr.bot/agents/basefm
- **Website:** https://basefm.space
- **Tx:** 0x9ef1cb05dd0b1aa5f9d2f11c2e5d44b66acde389e5602aa1870089981b163d3f

### AGENTBOT (Platform Token)
- **Contract:** `0x986b41c76ab8b7350079613340ee692773b34ba3`
- **Website:** /token

### clawdbotDJ
- **Contract:** `0x1b07b69a1219f217dd229b6b4d715ed116cb7b07

### Platform Wallets
- **Trading Wallet:** `0xd8fd0e1dce89beaab924ac68098ddb17613db56f`

### BASEFM on MoltX (Primary Profile)
- **Contract:** `0x7fc9b35b9375b95a6b2684a9676841267733dba3`
- **Profile:** https://moltx.io/baseFM

## Known Issues
- GitHub OAuth callback needs correct Client ID in Vercel

## OpenClaw Versions

### 1. Personal OpenClaw (Mac mini local) - "Atlas"
- NOT in Docker - runs directly on Mac mini via `openclaw` CLI
- NOT exposed publicly - local only, just for you
- Updated via: `openclaw update` CLI
- For: Your personal testing only
- Version: 2026.3.1 (latest)

### 2. Agentbot OpenClaw (Docker containers)
- Runs in Docker via agentbot-backend
- New deployments use: `ghcr.io/openclaw/openclaw:2026.3.1`
- Auto-updater checks GitHub releases daily
- For: Customer deployments only

### 3. Gordon - Production Docker
- Self-managing Docker production
- Handles web code
- Updates independently

## Multi-Agent Orchestration

Agentbot is designed to scale beyond single-agent deployments. Each user's Docker container runs an OpenClaw instance that can orchestrate multiple AI agents working together.

- **Per-Container Architecture:** Each customer gets their own Docker container with dedicated RAM/CPU
- **Agent Coordination:** OpenClaw handles multi-agent communication and task delegation
- **Scaling Strategy:** Higher-tier plans provide more resources for complex multi-agent workflows
- **Future Roadmap:** Multi-container deployments for enterprise customers requiring isolated agent pools

## Security Status

### Security Grade: A+ ✅

| Category | Grade |
|----------|-------|
| Authorization | A+ |
| Input Validation | A+ |
| Secrets Management | A+ |
| Production Hardening | A+ |
| Dependency Security | A+ |

### Security Fixes Applied (March 2026)

- ✅ Instance API authorization (session.user.id must match userId)
- ✅ Middleware → Proxy rename (Next.js 16 deprecation)
- ✅ Admin emails moved to ADMIN_EMAILS env var
- ✅ Dashboard error boundary added
- ✅ Deployments route protected
- ✅ Debug routes blocked in production

### Configuration Required

- `ADMIN_EMAILS` - Comma-separated admin emails (set in Vercel)

### Known Limitations

- **elliptic**: Used by ethers.js, no upstream fix available (documented in npm audit, 16 low severity)
- **Prisma**: Kept at 5.22.0 to avoid breaking changes
- **npm audit (Mar 2026)**: 16 low severity vulnerabilities - all acceptable risks, no action needed
