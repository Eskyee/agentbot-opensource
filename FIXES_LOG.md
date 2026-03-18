# Agentbot Fixes Log - March 18, 2026

## Issues Fixed

### 1. Prisma Build Failure on Vercel
**Problem:** Vercel build failed with Prisma 7.x error
```
Error: The datasource property `url` is no longer supported in schema files
Prisma CLI Version : 7.5.0
```

**Root Cause:** `npx prisma` was installing Prisma 7.x instead of using the locked 5.22.0

**Solution:** 
- Changed build script in `web/package.json` from `npx prisma generate` to `./node_modules/.bin/prisma generate`
- Added overrides to lock Prisma version

**Files Changed:** `web/package.json`

---

### 2. Demo Chat - OpenRouter API Key Disabled
**Problem:** Demo chat returned 402 error
**Solution:** Updated API key to:
```
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
```

**Files Changed:** `.env.local`, `.env`

---

### 3. Hydration Error in Navbar
**Problem:** Hydration failed - server/client mismatch
**Solution:** Added mounted state check:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
{!mounted || status === "loading" ? null : session ? (...) : (...)}
```

**Files Changed:** `web/app/components/Navbar.tsx`

---

### 4. Wagmi Import Error
**Problem:** Module not found: wagmi/chains
**Solution:** Changed to viem/chains:
```tsx
import { base, baseSepolia } from 'viem/chains'
```

**Files Changed:** `web/app/providers.tsx`

---

### 5. Worker Container Crash
**Problem:** sh: ts-node-dev: not found
**Solution:** Updated Dockerfile to install ts-node-dev

**Files Changed:** `agentbot-worker/Dockerfile`

---

### 6. Package Name: 2openclaw-web
**Solution:** Renamed to agentbot-web, agentbot-api

---

## Quick Commands

```bash
# Rebuild Docker
docker compose build --no-cache && docker compose up -d

# Check logs
docker logs agentbot-api --tail 50
docker logs agentbot-worker --tail 50

# Status
docker ps
```

## Admin Login
Use: rbasefm@icloud.com or raveculture@icloud.com via Google OAuth

## Production
- NEVER force push to main (deletes env vars)
- After env changes, manually redeploy in Vercel Dashboard
