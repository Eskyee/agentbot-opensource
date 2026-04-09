# 🚨 AUTH LOOP WARNING — READ BEFORE MODIFYING auth.ts, proxy.ts, or login/page.tsx

**Incident:** 2026-03-26 04:10 UTC — Infinite login redirect loop  
**Severity:** Users completely locked out of dashboard

## What Happened

Two independent NextAuth verification paths disagreed:

```
proxy.ts (edge middleware)
  └─ getToken() with NEXTAUTH_SECRET
     └─ NEXTAUTH_SECRET was broken during Vercel build
        └─ Always returned null → redirect to /login

/api/auth/session (NextAuth handler)
  └─ auth() → adapter → core API session endpoint
     └─ Core API's NEXTAUTH_SECRET was fine
        └─ Returned valid user data → login page auto-redirected to /dashboard
```

**Loop:** `/dashboard` → proxy rejects → `/login` → sees authenticated → redirects `/dashboard` → repeat forever.

## Why It Broked

`auth.ts` had a build-time throw:

```typescript
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required in production');
}
```

During Docker build on Vercel, `NODE_ENV=production` but `NEXTAUTH_SECRET` was only available at runtime (not during build). The throw caused the build to fail or produce a broken output. Even though we fixed the throw, the two verification paths were already using different secrets/verification methods.

## Rules to Prevent This

### 1. NEVER auto-redirect from login page
`login/page.tsx` must NEVER auto-redirect to `/dashboard` when session is detected.  
Only show a manual "Go to Dashboard" link. Auto-redirect is what caused the infinite loop.

### 2. getToken() ≠ auth() — They Can Disagree
- `getToken()` — local JWT decode + verify against NEXTAUTH_SECRET (edge middleware)
- `auth()` — goes through NextAuth adapter → calls core API session endpoint

These use DIFFERENT verification paths. If the secret is misaligned or the adapter points to a different API, they return different results. Never assume they agree.

### 3. NEVER throw during build for runtime-only env vars
If an env var is only available at runtime (set in Vercel dashboard, not in build image), don't throw during build. Use runtime checks:

```typescript
// ❌ BAD — throws during build when var is runtime-only
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required in production');
}

// ✅ GOOD — checks at request time, not build time
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-for-build-only',
  // ...rest of config
};
```

### 4. Loop breaker in proxy.ts is mandatory
`proxy.ts` has a loop-breaker cookie (`auth_redirect_attempt`) that prevents infinite redirects. If you refactor the proxy, keep this mechanism. It's the safety net.

### 5. Test login flow after ANY auth change
After modifying `auth.ts`, `proxy.ts`, or `login/page.tsx`:
1. Clear browser cookies for `agentbot.raveculture.xyz`
2. Navigate to `/dashboard` — should redirect to `/login`
3. Sign in — should land on `/dashboard`
4. Navigate to `/login` — should show "Go to Dashboard" link (NOT auto-redirect)
5. Check no redirect loop in browser devtools Network tab

## Files Involved
- `web/app/lib/auth.ts` — NextAuth config (web frontend)
- `web/app/lib/useCustomSession.ts` — session hook
- `web/proxy.ts` — edge middleware auth guard
- `web/app/login/page.tsx` — login page
- Core API: `NEXT_PUBLIC_KEYCHAIN_URL` endpoint

## Architecture Note
The web frontend has its own NextAuth instance that delegates sessions to the core API via a custom adapter. This is by design (allowing web frontend to have its own auth flow while sharing user data with core API). The cost is that two verification paths exist and must stay in sync.
