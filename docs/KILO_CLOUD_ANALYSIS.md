# Kilo-Org/cloud — Deep Scan Report for Agentbot

**Source:** https://github.com/Kilo-Org/cloud  
**Scanned:** 2026-04-09  
**Purpose:** Extract best UX/deployment/dashboard patterns for Agentbot to learn from.

---

## 1. Architecture Overview

### Monorepo Structure
```
apps/
  web/              Next.js 16 web app (Vercel) — the main dashboard
  mobile/           React Native mobile app
  storybook/        Component playground (Storybook 9)
services/           19 Cloudflare Worker microservices
  kiloclaw/         Machine lifecycle controller
  kiloclaw-billing/ Billing & subscription engine
  cloud-agent/      AI agent runtime (Cloudflare Containers)
  cloud-agent-next/ Next-gen cloud agent
  app-builder/      App builder service
  deploy-infra/     Deployment infrastructure (builder + dispatcher)
  session-ingest/   Session telemetry pipeline
  o11y/             Observability pipeline
  ...
packages/
  db/               Drizzle ORM schema + migrations (PostgreSQL)
  trpc/             Shared tRPC types & client
  worker-utils/     Shared Cloudflare Worker utilities
  encryption/       AES-256-GCM encryption helpers
  kiloclaw-secret-catalog/  Secret management
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS 4, shadcn/ui |
| **API** | tRPC v11 (type-safe RPC, not REST) |
| **Data** | Drizzle ORM + PostgreSQL (local Docker), Zod v4 validation |
| **State** | TanStack React Query v5 |
| **Auth** | WorkOS, Google OAuth, Fake Login (dev) |
| **Payments** | Stripe + Credits hybrid billing system |
| **Workers** | Cloudflare Workers (Hono framework) |
| **Machines** | Fly.io (KiloClaw instances run on Fly machines) |
| **Infra** | Vercel (web), Cloudflare (workers), Fly.io (machines) |
| **Tooling** | pnpm workspaces, oxfmt, oxlint, Husky, tmux dev dashboard |

### Key Difference vs Agentbot
- **Kilo** uses tRPC for all API calls → full end-to-end type safety, no manual REST route definitions
- **Kilo** uses Drizzle ORM (not Prisma) → lighter, faster, schema-as-code in TypeScript
- **Kilo** uses Cloudflare Workers for microservices, not a single Express backend
- **Kilo** separates "controller" (machine lifecycle) from "billing" as distinct workers

---

## 2. Dashboard UX Patterns (What Makes It User-Friendly)

### 2.1 Tabbed Detail Dialogs
**File:** `apps/web/src/components/deployments/DeploymentDetails.tsx`

The deployment detail view uses a **dialog with tabs** pattern (Overview / Environment / Password), not separate pages. This keeps the user in context:

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList><TabsTrigger value="overview">Overview</TabsTrigger>...</TabsList>
      <TabsContent value="overview">...</TabsContent>
      <TabsContent value="environment"><EnvironmentSettings /></TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

**Agentbot takeaway:** Replace full-page agent detail views with modal dialogs that have tabs for Overview / Config / Logs / Wallet.

### 2.2 Color-Coded Status Badges
**File:** `apps/web/src/components/deployments/StatusBadge.tsx`

Clean status badge system with icon + color per state:

| Status | Color | Icon |
|--------|-------|------|
| queued | blue | Clock |
| building | yellow | Clock |
| deploying | orange | Clock |
| deployed | green | CheckCircle |
| failed | red | XCircle |
| cancelled | gray | Ban |

Each uses Tailwind classes like `bg-green-600/20 text-green-400 border-green-600/30` for a subtle, readable look on dark backgrounds.

**Agentbot takeaway:** Adopt this exact pattern for agent container status (`provisioning`, `running`, `stopped`, `error`, `destroying`).

### 2.3 Deployment Cards with Live URLs
**File:** `apps/web/src/components/deployments/DeploymentCard.tsx`

Cards show:
- Deployment slug (clickable name)
- Live URL (clickable only when deployed, grayed when building)
- Repository source + branch
- Status badge in top-right corner

The card is keyboard-accessible (`role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space).

**Agentbot takeaway:** Our agent cards should show: agent name, subdomain URL, plan badge, status badge, and last deployed time. Make cards keyboard-accessible.

### 2.4 Confirmation Dialogs for Destructive Actions
**File:** `apps/web/src/components/subscriptions/kiloclaw/KiloClawDetail.tsx`

Uses `AlertDialog` with a state machine for subscription actions:

```tsx
type SubscriptionConfirmationAction =
  | 'cancelPlanSwitch'
  | 'switchPlan'
  | 'switchToCredits'
  | 'reactivate'
  | 'cancelSubscription';
```

Each action maps to `{ title, description, confirmLabel, pendingLabel, action, successMessage }`. The dialog shows current → new state with an arrow transition:

```
[Current: Standard $9/mo] → [New: Commit $48/6mo]
```

**Agentbot takeaway:** Implement the same pattern for agent lifecycle actions (upgrade plan, stop, destroy) with clear before/after comparison.

### 2.5 Toast Notifications for All Mutations
Every tRPC mutation uses `sonner` toast:
```tsx
toast.success('Deployment queued for redeployment');
toast.error(`Failed to redeploy: ${error.message}`);
```

**Agentbot takeaway:** Add toast feedback for all container operations.

---

## 3. Deployment Flow (Machine Lifecycle)

### 3.1 KiloClaw Controller — The Machine Process
**File:** `.specs/kiloclaw-controller.md`

Each machine runs a **controller process** (`kiloclaw-controller.js`) as the Docker CMD entrypoint. The controller owns the ENTIRE lifecycle:

1. **HTTP server first** — Starts health endpoint on port 18789 before any other work
2. **Phased bootstrap** — Decryption → Directories → Feature flags → GitHub config → Onboard/Doctor → Gateway start
3. **Health states:** `bootstrapping` → `starting` → `ready` → `degraded`
4. **Gateway supervision** — Automatic respawn with exponential backoff (1s → 5min cap)
5. **Graceful shutdown** — SIGTERM → forward to gateway → 10s timeout → SIGKILL

Key insight: The **health endpoint is ALWAYS available** even during bootstrap failures. The machine never becomes a black box.

**Agentbot takeaway:** Our OpenClaw containers should expose a `/health` endpoint that's available from boot, with phased states like `bootstrapping`/`ready`/`degraded`. The health endpoint should be unauthenticated so monitoring can always reach it.

### 3.2 Deployment Card Operations
**File:** `apps/web/src/components/deployments/DeploymentDetails.tsx`

The deployment detail view offers these actions contextually:
- **During build:** Show "Cancel Build" button
- **After completed build:** Show "Redeploy" + "Delete Deployment" (danger zone)
- Build logs shown inline via `<BuildLogViewer>`

### 3.3 Environment Variables Management
**File:** `apps/web/src/components/deployments/EnvironmentSettings.tsx`

Env vars can be managed per-deployment with key-value editing UI. This is a separate tab in the deployment detail dialog.

**Agentbot takeaway:** Add env var management to agent containers — users should be able to set API keys, tokens etc. without SSH.

### 3.4 Slug/URL Editing
**File:** `apps/web/src/components/deployments/SlugEditor.tsx`

Users can rename their deployment slug (which changes the public URL like `my-app.d.kiloapps.io`).

**Agentbot takeaway:** Let users customize their agent subdomain.

---

## 4. Status/Monitoring Patterns

### 4.1 Controller Health API
```
GET /health           → Always 200 {status: "ok"}  (for Fly probes)
GET /_kilo/health     → 200 {status: "ok", state: "ready|bootstrapping|degraded"}
GET /_kilo/version    → Controller version, openclaw version, gateway stats
GET /_kilo/gateway/status → {state, pid, uptime, restarts, lastExit}
```

Gateway supervisor states: `stopped → starting → running → stopping → crashed → shutting_down`

### 4.2 Build Log Viewer
**File:** `apps/web/src/components/deployments/BuildLogViewer.tsx`

Inline build logs in the deployment detail dialog with auto-scrolling during active builds.

### 4.3 Session Tracking
Cloud agent sessions are tracked with full message history (`CloudSessionsPage.tsx`, `SessionsList.tsx`). Each session has:
- Message bubbles with tool execution cards
- Save/load profiles for agent configurations
- Resume config modal for resuming interrupted sessions

**Agentbot takeaway:** Track agent sessions/conversations and show them in a sessions list. This is more useful than just showing container status.

---

## 5. Resource Management & Pricing

### 5.1 Pricing Model
**File:** `.specs/kiloclaw-billing.md`

| Plan | Price | Billing |
|------|-------|---------|
| **Trial** | Free | 7 days, auto-created on first provision |
| **Standard** | $9/mo ($4 first month) | Monthly, cancel anytime |
| **Commit** | $48/6 months ($8/mo effective) | 6-month commit, auto-renews |

Key design: **Credits-first billing** — All subscriptions are credit deductions. Stripe payments flow through a credit ledger as balanced deposit+deduction. Users can pay via:
1. **Kilo Pass** (recommended) — Credit subscription that funds both hosting + AI inference
2. **Standalone Stripe** — Direct Stripe subscription for hosting only
3. **Pure credits** — Deduction from existing credit balance

### 5.2 Machine Infrastructure
Machines run on **Fly.io** with:
- AES-256-GCM encrypted env vars (decrypted at boot)
- Per-user encryption key as Fly app secret
- Feature flags via `KILOCLAW_*` env vars
- Automatic gateway respawn with exponential backoff

### 5.3 Subscription per Instance
Each KiloClaw instance has its own subscription record. A user can have multiple instances. Subscriptions are scoped to specific instances, not users.

**Agentbot takeaway:** Our plan→agent model (solo/collective/label/network) should also support per-agent subscriptions, not just per-user plans. This lets users have agents at different tiers.

---

## 6. Specific Code Patterns Worth Adopting

### 6.1 tRPC Router Pattern (Type-Safe API)
**File:** `apps/web/src/routers/` (50+ router files)

Instead of REST routes, everything goes through tRPC:
```tsx
// Server: define procedures
export const kiloClawRouter = router({
  getSubscriptionDetail: protectedProcedure.input(z.object({ instanceId: z.string() })).query(...),
  switchPlanAtInstance: protectedProcedure.input(...).mutation(...),
});

// Client: use with React Query
const detailQuery = useQuery(trpc.kiloclaw.getSubscriptionDetail.queryOptions({ instanceId }));
```

**Agentbot takeaway:** Consider migrating agentbot-backend Express routes to tRPC for end-to-end type safety.

### 6.2 Deployment Context Provider
**File:** `apps/web/src/components/deployments/DeploymentContext.tsx`

Wraps deployment queries and mutations in a context so any child component can access them:
```tsx
const { queries, mutations, organizationId } = useDeploymentQueries();
```

Separate providers for org vs personal: `OrgDeploymentProvider.tsx` and `UserDeploymentProvider.tsx`.

### 6.3 Cursor-Based Pagination Hook
**File:** `apps/web/src/components/subscriptions/useCursorPagination.ts`

Generic cursor pagination hook used for billing history tables. Clean load-more pattern.

### 6.4 Plan Comparison Cards
**File:** `apps/web/src/components/subscriptions/kiloclaw/KiloClawSubscribeCard.tsx`

Side-by-side plan comparison with:
- Price + price detail
- Feature checklist with green checkmarks
- "Best value" badge on recommended plan
- CTA button styled as a pill

### 6.5 Alert Dialog Pattern for Mutations
All dangerous mutations (cancel, switch plan, delete) go through `AlertDialog` with:
- Clear title + description
- Disabled state during pending
- Loading label change ("Reactivate" → "Reactivating subscription")

---

## 7. Key Differences vs Agentbot's Current Approach

| Aspect | Kilo Cloud | Agentbot |
|--------|-----------|----------|
| **API Layer** | tRPC (type-safe end-to-end) | Express REST routes |
| **ORM** | Drizzle (schema.ts → migrations) | Prisma |
| **Frontend Framework** | Next.js 16 + React 19 | Next.js 14 |
| **State Management** | TanStack React Query + tRPC | Mixed (fetch + useState) |
| **Machine Runtime** | Fly.io with controller process | Docker with direct management |
| **Billing** | Credits-first with Stripe hybrid | Stripe direct |
| **Health Monitoring** | Phased health endpoint on every machine | No standardized health API |
| **UI Components** | shadcn/ui + Lucide icons | Custom components |
| **Worker Services** | 19 Cloudflare Workers (Hono) | Single Express backend |
| **Auth** | WorkOS + Google OAuth | NextAuth multi-provider |
| **Subscriptions** | Per-instance, credit-based | Per-user, plan-based |
| **Status Display** | Color-coded badges with icons | Varies per page |

---

## 8. Priority Implementation Recommendations for Agentbot

### Quick Wins (1-2 days each)
1. **Adopt StatusBadge pattern** — Copy the exact color scheme and icon mapping for agent states
2. **Add toast notifications** — Use `sonner` for all container operations
3. **Add health endpoint** — Add `/_health` to OpenClaw containers with phased states
4. **Keyboard-accessible cards** — Add `role="button"` and key handlers to agent cards

### Medium Effort (3-5 days each)
5. **Tabbed detail dialogs** — Replace full-page agent views with modal dialogs (Overview/Config/Logs/Wallet tabs)
6. **Confirmation dialogs** — AlertDialog pattern for all destructive actions (stop/destroy/downgrade)
7. **Env var management UI** — Let users manage env vars per container without SSH
8. **Plan comparison cards** — Side-by-side plan comparison in the upgrade flow

### Larger Initiatives (1-2 weeks each)
9. **tRPC migration** — Move from Express REST to tRPC for type-safe API
10. **Per-agent subscriptions** — Allow different plans per agent, not just per user
11. **Session tracking UI** — Show agent conversation/session history in the dashboard
12. **Build log viewer** — Show real-time container provisioning logs

---

## Key Files Reference

| What | File Path |
|------|-----------|
| Status badges | `apps/web/src/components/deployments/StatusBadge.tsx` |
| Deployment detail dialog | `apps/web/src/components/deployments/DeploymentDetails.tsx` |
| Deployment card | `apps/web/src/components/deployments/DeploymentCard.tsx` |
| Build log viewer | `apps/web/src/components/deployments/BuildLogViewer.tsx` |
| Env var management | `apps/web/src/components/deployments/EnvironmentSettings.tsx` |
| Subscription detail | `apps/web/src/components/subscriptions/kiloclaw/KiloClawDetail.tsx` |
| Plan subscribe cards | `apps/web/src/components/subscriptions/kiloclaw/KiloClawSubscribeCard.tsx` |
| Cloud agent sessions | `apps/web/src/components/cloud-agent/CloudSessionsPage.tsx` |
| Controller spec | `.specs/kiloclaw-controller.md` |
| Billing spec | `.specs/kiloclaw-billing.md` |
| DB schema | `packages/db/src/schema.ts` |
| tRPC routers | `apps/web/src/routers/` |
