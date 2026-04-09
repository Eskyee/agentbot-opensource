# Agentbot Platform — Stable v1.0 (April 7, 2026)

## Branch: `stable-v1`

**DO NOT REBASE OR FORCE PUSH THIS BRANCH.**

This branch captures the platform at a fully functional, stable state. All features below are tested and deployed to production.

---

## What's Working

### Core Infrastructure
- **OpenClaw 2026.4.1** — Concurrent tool orchestration, tiered permission system (SAFE/DANGEROUS/DESTRUCTIVE), encrypted per-user API keys, maintenance page
- **MiMo-V2-Pro** — Default model (Xiaomi 1T+, 1M context, #1 programming benchmarks)
- **Dashboard Performance** — INP reduced from 1568ms to under 200ms via lazy-loading
- **v1.0.0 Open Source** — MIT licensed, clean history, self-hostable

### Features Deployed
- **Jobs Board** (`/jobs`) — Hire talent, find roles, integrates with git-city API
- **GitHub Sponsors** (`/sponsor`) — Tier options $10-200/mo
- **Git City** (`/dashboard/git-city`) — Analyze any GitHub repo as 3D city
- **Skills Marketplace** — 11 music-specific skills
- **baseFM** — 24/7 AI radio, zero-human operation
- **x402 Payments** — USDC on Base, build paid APIs

### User Experience Fixes
- Gateway token copy button in dashboard
- Manual pairing instructions when auto-pair fails
- Clear error message when installing skills on offline agent
- Skills saved to DB and sync automatically if gateway unreachable

### Documentation
- Updated mintlify-docs with Jobs Board, Git City, GitHub Sponsors sections
- News page synced with latest updates
- Battle Tested blog post with metrics, testimonials, roadmap

---

## Known Issues (Tolerable)

1. **Dependabot vulnerability** — 1 high severity alert (not critical, doesn't affect runtime)
2. **Origin not allowed error** — Can occur on some browser configs, manual token paste fixes it

---

## How to Deploy

```bash
# Main repo
git checkout stable-v1
git log --oneline -5  # Verify state

# Deploy to Vercel
cd web && vercel --prod
```

---

## Submodule (mintlify-docs)

Commit: `2f36af2` — Jobs board, Git City docs added

```bash
cd mintlify-docs && git pull && cd ..
git add mintlify-docs && git commit -m "chore: sync submodule" && git push
```

---

## Don't Do

- ❌ `git rebase` on stable-v1
- ❌ `git push --force` to stable-v1
- ❌ Reset this branch
- ❌ Delete this branch

---

## If Something Breaks

1. Check if issue exists on `stable-v1`: `git checkout stable-v1 && git log --oneline -10`
2. If works on stable, bug is in main branch changes
3. Hotfix on main, then merge to stable: `git checkout stable-v1 && git merge main`