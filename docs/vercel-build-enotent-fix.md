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

### Option A: Remove `web/vercel.json` (recommended only if Vercel builds from repo root)
Keep only the root `vercel.json` when your Vercel project builds from the repository root and the root config handles `cd web && ...`.

```bash
git rm web/vercel.json
git commit -m "fix: consolidate Vercel config at repo root"
```

### Option B: Remove root `vercel.json`, keep `web/vercel.json`
If `web/` is the app root, keep `web/vercel.json` and make sure Root Directory is set to `web` in the Vercel dashboard.

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

- **Match the config location to the actual Vercel Root Directory**
- If both must exist, their `installCommand` and `buildCommand` must be identical
- After any `vercel.json` change, verify the next deploy succeeds before merging

## Context

This error appeared during the INP optimization commits (2026-03-30). The `web/vercel.json` was likely created for header/rewrite config but ended up conflicting with the root config's install command.
