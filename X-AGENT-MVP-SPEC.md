# X Agent MVP — Build Spec

**Goal:** A user signs up, connects their X account, and within 10 minutes sees AI-drafted replies to their mentions. They approve/reject, and approved drafts get posted automatically.

**Revenue trigger:** Stripe checkout is required before X connection activates.

---

## Architecture (what exists vs what's new)

```
EXISTING (do not rebuild):
  /api/x/oauth/start        → X OAuth 2.0 flow
  /api/x/oauth/callback     → stores tokens in UserSetting
  /api/x/status             → check if X is connected
  /api/x/mentions           → fetch mentions from X API
  /api/x/drafts             → CRUD draft queue
  /api/x/drafts/[id]/publish → post approved draft to X
  /api/cron/x-publish       → auto-publish scheduled drafts
  /lib/xApi.ts              → all X API functions
  /lib/xDrafts.ts           → draft queue storage
  /lib/xDraftGenerator.ts   → AI draft generation (OpenRouter)

NEW (build these):
  1. /api/cron/x-monitor     → cron: fetch mentions → auto-generate drafts
  2. /dashboard/x            → unified UI: mentions + drafts + approve/reject
  3. /onboard flow           → signup → Stripe → connect X → see first drafts
```

---

## 1. Cron: `/api/cron/x-monitor` (THE KEY MISSING PIECE)

**Schedule:** Every 15 minutes
**What it does:**
1. Find all users with `x_api_account` setting (X connected)
2. For each user, call `fetchUserMentionsFromX(userId)`
3. Check which mention IDs already have drafts (dedupe by mentionId)
4. For new mentions, call `generateXDraft(mention.text, 'direct')`
5. Append new drafts to the queue via `appendXDraft()`

**Auth:** Bearer token (same as x-publish cron)

**Pseudocode:**
```typescript
// GET /api/cron/x-monitor
export async function GET(request: Request) {
  // Auth check (same pattern as x-publish)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all users with X connected
  const xAccounts = await prisma.userSetting.findMany({
    where: { key: 'x_api_account' },
    select: { userId: true },
  })

  const results = []

  for (const { userId } of xAccounts) {
    // Fetch mentions
    const mentions = await fetchUserMentionsFromX(userId)

    // Get existing drafts to dedupe
    const existingDrafts = await getXDraftQueue(userId)
    const existingMentionIds = new Set(
      existingDrafts.filter(d => d.mentionId).map(d => d.mentionId)
    )

    // Generate drafts for new mentions only
    let newDrafts = 0
    for (const mention of mentions) {
      if (existingMentionIds.has(mention.id)) continue

      try {
        await appendXDraft(userId, {
          sourceText: mention.text,
          tone: 'direct',
          mentionId: mention.id,
        })
        newDrafts++
      } catch (e) {
        console.error(`Draft failed for mention ${mention.id}:`, e)
      }
    }

    results.push({ userId, mentions: mentions.length, newDrafts })
  }

  return NextResponse.json({ processed: results.length, results })
}
```

**Add to `vercel.json` crons:**
```json
{
  "path": "/api/cron/x-monitor",
  "schedule": "*/15 * * * *"
}
```

---

## 2. Dashboard Page: `/dashboard/x`

**File:** `web/app/dashboard/x/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  X Agent                                    [⟳] │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─── Mentions ────────────────────────────────┐ │
│  │ @someone: "Great work on the project!"      │ │
│  │ [Draft Reply] [Skip]                        │ │
│  │                                              │ │
│  │ @another: "What do you think about X?"      │ │
│  │ [Draft Reply] [Skip]                        │ │
│  └──────────────────────────────────────────────┘ │
│                                                  │
│  ┌─── Draft Queue ────────────────────────────┐  │
│  │ → "Thanks! Been grinding on it for months" │  │
│  │   [Approve ✅] [Edit ✏️] [Reject ❌]       │  │
│  │                                              │  │
│  │ → "Great question. Here's my take..."       │  │
│  │   [Approve ✅] [Edit ✏️] [Reject ❌]       │  │
│  └──────────────────────────────────────────────┘ │
│                                                  │
│  ┌─── Published ──────────────────────────────┐  │
│  │ ✓ "Shipped the new feature today" — 2h ago │  │
│  │ ✓ "Jungle never dies" — 5h ago             │  │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Data fetching:**
- `GET /api/x/mentions` — feed the Mentions column
- `GET /api/x/drafts` — feed the Draft Queue and Published columns
- `POST /api/x/drafts` with `{ sourceText, tone, mentionId }` — "Draft Reply" button
- `PATCH /api/x/drafts/[id]` with `{ status: 'approved' }` — Approve button
- `DELETE /api/x/drafts/[id]` — Reject button

**Key behaviors:**
- "Draft Reply" on a mention → calls generateXDraft → shows draft in queue
- "Approve" → sets status to 'approved' + sets scheduledFor to now+2min
- x-publish cron picks it up within 15 min and posts it
- "Edit" → inline textarea, save updates draft text
- Auto-refresh every 30 seconds (or use SWR/react-query)

---

## 3. Onboarding Flow: `/onboard`

**Current state:** `/onboard` exists but is tied to plan selection. Needs to become the post-checkout flow.

**Flow:**
```
/signup → create account
  ↓
/api/stripe/checkout?plan=solo → Stripe payment
  ↓
/onboard → "Connect your X account" button
  ↓
/api/x/oauth/start → X OAuth
  ↓
/api/x/oauth/callback → redirects to /dashboard/x
  ↓
/dashboard/x → "Scanning your mentions..." → first drafts appear
```

**The /onboard page should:**
1. Check if user has active subscription (stripeSubscriptionId)
2. If no → redirect to /pricing
3. If yes but X not connected → show "Connect X" button
4. If yes and X connected → redirect to /dashboard/x

---

## Vercel.json Changes

Add one cron entry:
```json
{
  "path": "/api/cron/x-monitor",
  "schedule": "*/15 * * * *"
}
```

---

## Environment Variables Required

All should already exist:
- `OPENROUTER_API_KEY` — for draft generation
- `X_API_BEARER_TOKEN` — for mention fetching
- `X_API_CLIENT_ID` + `X_API_CLIENT_SECRET` — for OAuth
- `CRON_SECRET` — for cron auth
- `STRIPE_SECRET_KEY` — for checkout

---

## Navbar Update

The dashboard navbar needs an "X" tab. Check if `/dashboard` has a sidebar or tabs component and add:
```typescript
{ href: '/dashboard/x', label: 'X Agent', icon: '𝕏' }
```

---

## What This Enables (the marketing moment)

Once this works, Eskyee can post:

> "My AI agent monitors my X mentions. It drafts replies. I approve them. It posts.
>
> Built it on Agentbot. £29/mo if you want one too.
>
> Here's what it drafted this week: [screenshot of dashboard]"

That's the thread. That's the launch. That's the revenue.

---

## Build Order (for Codex)

1. `/api/cron/x-monitor` — the automation loop (30 min)
2. `/dashboard/x/page.tsx` — the UI (2 hours)
3. `/onboard` flow update — connect X after checkout (1 hour)
4. Navbar update — add X tab (10 min)
5. `vercel.json` — add cron (2 min)

**Total: ~4 hours of focused Codex work.**

---

## Done Criteria

- [ ] New mention on X → draft appears in /dashboard/x within 15 min
- [ ] Approve draft → post goes live on X within 15 min
- [ ] User can sign up, pay, connect X, see drafts in one session
- [ ] No Railway required — runs entirely on Vercel
