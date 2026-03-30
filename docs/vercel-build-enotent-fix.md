# Vercel Build: `package.json` ENOENT Error

**Symptom:** Build fails with:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path1/package.json'
```

**Root Cause:** Two conflicting `vercel.json` files in the monorepo:

| File | Purpose |
|------|---------|
| `/vercel.json` (root) | Has `installCommand: "cd web && npm install"` — navigates into `web/` before installing |
| `/web/vercel.json` | Has `installCommand: "npm install --include=dev"` — runs from Vercel's working dir |

When Vercel's **Root Directory** is set to `web/`, it reads `web/vercel.json` as the project config. This overrides the root `vercel.json`. The install command `npm install` then runs from `/vercel/path1` (root level) where there is no `package.json` — it's in `/vercel/path1/web/`.

**Conflict detail:**
- Root `vercel.json` expects to run `cd web && ...` from the repo root
- `web/vercel.json` expects to run `npm install` from the `web/` directory (already there after root dir is applied)
- When both exist, Vercel uses `web/vercel.json` but the working directory context can get confused, especially with build cache

## How to Fix

### Option A: Remove `web/vercel.json` (recommended)
Keep only the root `vercel.json`. It already handles the `cd web &&` navigation.

```bash
git rm web/vercel.json
git commit -m "fix: remove web/vercel.json — root vercel.json handles everything"
```

### Option B: Remove root `vercel.json`, keep `web/vercel.json`
If you want `web/` to be self-contained, delete the root one and make sure Root Directory is set to `web` in Vercel dashboard.

```bash
git rm vercel.json
# Then verify Root Directory = "web" in Vercel project settings
```

## How to Verify

After fixing:
1. `npx tsc --noEmit` in `web/` — must pass
2. `curl -s -o /dev/null -w "%{http_code}" https://agentbot.raveculture.xyz` — must return 200
3. Check Vercel deployment log — install should succeed without ENOENT

## Prevention

- **Never create `web/vercel.json` if root `vercel.json` already handles `cd web && ...` commands**
- If both must exist, their `installCommand` and `buildCommand` must be identical
- After any `vercel.json` change, verify the next deploy succeeds before merging

## Context

This error appeared during the INP optimization commits (2026-03-30). The `web/vercel.json` was likely created for header/rewrite config but ended up conflicting with the root config's install command.
