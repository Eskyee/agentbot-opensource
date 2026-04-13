# Agentbot DevOps Learnings — Self-Learning Log

> Append new entries as we discover what works and what doesn't.
> Goal: build a feedback loop so the platform gets smarter about its own operations over time.

---

## Workflow Patterns That Work

### Git Branching
- **Worktree isolation** — Claude Code worktrees give each session its own isolated file system, preventing conflicts between parallel work sessions. Use `EnterWorktree` for anything non-trivial.
- **Feature branch → PR → merge to main** — every change goes through a PR even if it's a one-liner. Provides a clean audit trail and forces Vercel preview deploy.
- **Conflict resolution strategy** — when merging feature branches back to main, prefer `git checkout --ours` for UI files (Navbar, Footer) that were intentionally redesigned. The feature branch is usually more current.
- **`git pull --rebase` before push** — avoids merge bubbles when remote has moved ahead. Cleaner history.

### Database Migrations (Prisma + Neon)
- **`prisma db push --accept-data-loss`** — safe for additive changes (new columns, new tables). Never run on destructive changes without reading the diff first.
- **Always use the Neon DATABASE_URL explicitly** — worktree environments don't inherit `.env` automatically. Pass `DATABASE_URL=...` inline or the push hits localhost.
- **Prisma binary path in worktrees** — worktrees have no `node_modules`. Use `npx prisma` from the main repo root with `--schema` pointing to the worktree schema file.
- **Column additions are zero-downtime** — Postgres adds nullable columns instantly. Safe to push and deploy simultaneously.

### Vercel Deployments
- **Project ID: `prj_QiczofbfSBhjq5bbcFtcPprLdB8w`** — always verify against this before any Vercel CLI operation. The `web` project is a ghost — ignore it.
- **Auto-deploy on push to main** — every `git push origin main` (or merged PR) triggers production deploy automatically. No manual step needed.
- **Preview URLs are password-protected** — `curl -sI preview-url` returns 401. Test against `agentbot.raveculture.xyz` (200) to confirm production is live.
- **`vercel env add` via stdin pipe** — correct pattern: `echo "VALUE" | vercel env add VAR_NAME production`. The `--force` flag is not needed.
- **Env vars need adding to all environments** — production, preview, and development are separate. Add to all three for consistency unless the var is intentionally environment-specific.

### Stripe Integration
- **Use `price_data` for dynamic amounts** — pre-configured Stripe Price IDs have fixed amounts. For subscriber discounts or variable pricing, use `price_data` in the checkout session instead of `price`.
- **Webhook metadata is the handshake** — pass `type` and resource IDs in Stripe session metadata. The webhook uses these to update the correct DB record. Without them, fulfilled payments can't be matched.
- **Fail-closed on missing env vars** — check `STRIPE_SECRET_KEY` at request time and return 500 immediately. Don't let requests proceed with undefined keys.

### Mux (Audio/Video)
- **Direct upload pattern** — create a Mux upload via the API, return the `uploadUrl` to the client, have the client PUT directly to Mux. Never proxy the file through Next.js — it will OOM on large files.
- **XHR for upload progress** — `fetch()` doesn't expose upload progress. Use `XMLHttpRequest` with `xhr.upload.onprogress` for the progress bar.
- **Playback ID is the broadcast key** — Mux assets don't have playback IDs until processing completes. The broadcast cron must check `playback_id IS NOT NULL` before attempting to stream.

### Cron Jobs (Vercel)
- **`Authorization: Bearer ${CRON_SECRET}`** — Vercel passes this header automatically. Check it first, fail-closed.
- **5-minute window look-ahead** — cron runs every 5 minutes, so find jobs where `scheduled_at <= now + 5min`. Prevents drift and missed broadcasts.
- **Prisma can't compare two columns in WHERE** — `broadcasts_done < scheduled_slots` is invalid Prisma syntax. Fetch all candidates and filter in JS.
- **Always roll back status on error** — if FFmpeg/OpenClaw fails mid-broadcast, decrement `broadcasts_done` and restore `status` to its prior state. Prevents phantom "in progress" records.

---

## Patterns That Caused Problems (and the Fix)

### Navbar Transparency Bug
- **Problem**: `bg-zinc-950/98` + `backdrop-blur-sm` made the dropdown see-through — page content visible underneath.
- **Fix**: `bg-zinc-950` (solid) + removed backdrop-blur. Lesson: never use opacity < 100% on overlapping UI elements unless intentional glassmorphism.

### FFmpeg "Missing" False Alarm
- **Problem**: Dashboard showed "Missing" when `/api/status` returned 404 (runtime partially reachable). Users panicked.
- **Fix**: Check if the status probe itself succeeded. Only show "Not Installed" when the runtime responded but reported no FFmpeg. Show "Unknown" when the probe failed entirely.
- **Lesson**: UI labels should reflect what the system actually knows, not infer the worst case.

### Worktree Missing node_modules
- **Problem**: Running `npx prisma` inside a worktree fails — no `node_modules` in the worktree.
- **Fix**: Run `npx prisma` from the main repo root (`/Users/raveculture/Documents/GitHub/agentbot`) with `--schema` pointing to the worktree schema file.

### Prisma Column Comparison in WHERE
- **Problem**: `where: { broadcasts_done: { lt: prisma.ad_campaigns.fields.scheduled_slots } }` is not valid Prisma v5 syntax.
- **Fix**: Fetch all candidates with a broad WHERE, then filter in JavaScript: `results.filter(r => r.broadcasts_done < r.scheduled_slots)`.

### Wrong Vercel Project
- **Problem**: Checking `web` Vercel project instead of `agentbot` caused false "deploy broken" alarms.
- **Fix**: Always use project ID `prj_QiczofbfSBhjq5bbcFtcPprLdB8w`. The `web` project is unused.

---

## Architecture Decisions (and Why)

| Decision | Reasoning |
|---|---|
| Prisma + Neon over raw SQL | Type safety + schema-as-code. Migrations are reviewable in PRs. |
| Next.js API routes over separate Express | Co-location. Auth session available server-side without extra network hop. |
| Mux for audio/video | Handles transcoding, HLS delivery, and live RTMP. We pay per minute, not per seat. |
| PLATFORM_OPENCLAW_URL for FFmpeg | Vercel serverless functions have no FFmpeg. Delegate to the Railway runtime that does. |
| Stripe `price_data` for dynamic pricing | Avoids needing to create a new Price object in Stripe for every discount combination. |
| DB-backed cron state | Survives restarts. No in-memory scheduler means no lost jobs on redeploy. |
| Fail-closed auth everywhere | `timingSafeEqual` token comparison. Unknown → deny. Prevents timing attacks. |

---

## Integration Map (Current)

```
agentbot.raveculture.xyz (Next.js on Vercel)
  ├── Neon PostgreSQL         — all persistent state
  ├── Stripe                  — subscriptions + ad campaign payments
  ├── Mux                     — audio/video upload, transcoding, live streams
  ├── OpenClaw (Railway)      — agent runtime, FFmpeg broadcaster
  ├── baseFM (basefm.space)   — live radio, DJ profiles, community
  │     └── fetchAgentbotLiveStreams() — baseFM polls agentbot for live DJs
  ├── Coinbase CDP            — agent USDC wallets
  ├── OpenRouter              — LLM routing (Gemini, GPT-4o, DeepSeek)
  └── Caddy                   — agent subdomain routing
```

---

## What to Build Next (Backlog)

- [ ] RAVE token balance check on login → unlock baseFM tier automatically
- [ ] MCP marketplace — community-published skills with 80/20 revenue share
- [ ] Usage overage billing — Stripe metered billing when token quota exceeded
- [ ] Agent → baseFM community chat posting (Supabase Realtime)
- [ ] Outcome-based pricing hooks — charge per negotiation completed, deal closed
- [ ] BYOC (Bring Your Own Cloud) tier — deploy OpenClaw to user's own Railway org
