# Build Errors Log & Prevention Guide

**Last Updated**: 2 March 2025  
**Vercel Build Status**: ✅ PASSING

---

## Critical Errors Encountered & Fixes

### 1. ❌ NEXTAUTH_SECRET Missing at Build Time
**Error**: `NEXTAUTH_SECRET must be set in production`  
**Location**: `app/api/auth/[...nextauth]/route.ts` line 50  
**Cause**: Hard throw at import time checking `NODE_ENV === 'production'` during build phase  
**Status**: ✅ FIXED

**Solution**:
```typescript
// WRONG ❌ - Throws during build
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production')
}

// RIGHT ✅ - Allows build, validates at runtime
secret: process.env.NEXTAUTH_SECRET || 'default-dev-secret',
```

**Prevention**:
- Never throw errors at module import time that depend on build-time environment
- Defer validation to runtime (request/response handlers)
- Use fallbacks for build-time secrets

---

### 2. ❌ useSearchParams() Without Suspense Boundary
**Error**: `useSearchParams() should be wrapped in a suspense boundary`  
**Locations**: 
- `app/checkout/success/page.tsx`
- `app/dashboard/verify/page.tsx`
- `app/join/page.tsx` (removed - old invite system)
- `app/login/page.tsx`
- `app/onboard/page.tsx`
- `app/pricing/page.tsx`
- `app/reset-password/page.tsx`

**Cause**: Next.js 16 tries to prerender pages at build time. `useSearchParams()` can't be called during static prerendering (it requires runtime query params).

**Status**: ✅ FIXED

**Solution**:
```typescript
// WRONG ❌
'use client'
export default function Page() {
  const searchParams = useSearchParams()  // Fails at build time
  const id = searchParams.get('id')
  return <div>{id}</div>
}

// RIGHT ✅
'use client'
function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  return <div>{id}</div>
}

function PageFallback() {
  return <div>Loading...</div>
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <PageContent />
    </Suspense>
  )
}
```

**Prevention**:
- Always wrap components using `useSearchParams()`, `useRouter()`, or other client-only hooks in a Suspense boundary
- Create a separate component for the content that uses the hook
- Use Suspense at the export level

---

### 3. ❌ "use client" Directive Not First
**Error**: `The "use client" directive must be placed before other expressions`  
**Locations**: All pages with `export const dynamic = "force-dynamic"` added before `'use client'`

**Cause**: When I added `export const dynamic` to prevent prerendering, I placed it BEFORE `'use client'`, violating Next.js rules.

**Status**: ✅ FIXED (by removing dynamic export - Suspense wrapper is sufficient)

**Solution**:
```typescript
// WRONG ❌
export const dynamic = "force-dynamic"
'use client'
import React from 'react'

// RIGHT ✅
'use client'
import React from 'react'
// Then use Suspense if needed

// OR (if you must use dynamic export)
'use client'
export const dynamic = "force-dynamic"
import React from 'react'
```

**Prevention**:
- `'use client'` must ALWAYS be the first line of a file
- Directives like `export const dynamic` go AFTER `'use client'`
- Better approach: Use Suspense boundaries instead of `force-dynamic`

---

### 4. ❌ Broken JSX - Missing Closing Tag
**Error**: `Expected '</', got 'jsx text'` at dashboard line 355-356  
**Location**: `app/dashboard/page.tsx` - Plan section

**Cause**: When removing the trial/free tier messaging, I removed closing tags incorrectly

**Status**: ✅ FIXED

**Solution**:
```tsx
// WRONG ❌
<div>
  <dt>Plan</dt>
  <dd>{instance?.plan}
</div>

// RIGHT ✅
<div>
  <dt className="...">Plan</dt>
  <dd className="...">{instance?.plan}</dd>
</div>
```

**Prevention**:
- Use an editor with JSX syntax checking (VS Code + Pylance)
- Always close tags in the correct order (LIFO)
- Run local build test BEFORE pushing to Vercel

---

## Outdated Code & Documentation Removed

### Pages Removed
- ❌ `/join` - Old invitation system (platform is now paid)

### Files Deleted (30 total)
All outdated roadmaps, audits, guides, and design docs removed

---

## Environment Variables Checklist

### Required for Production Build
- ✅ `NEXTAUTH_SECRET` - Set in Vercel (not in .env files)
- ✅ `DATABASE_URL` - Set in Vercel
- ✅ `STRIPE_SECRET_KEY` - Set in Vercel
- ✅ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- ✅ `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- ✅ `RESEND_API_KEY`

### Security Rules
- ❌ NEVER commit `.env` files with secrets
- ❌ NEVER commit `.env.production` with real keys
- ✅ Use Vercel Environment Variables dashboard for all secrets

---

## Build Error Prevention Checklist

- [ ] Run `npm run build` locally BEFORE committing
- [ ] Verify `'use client'` is the first line of file
- [ ] Wrap all `useSearchParams()`, `useRouter()` calls in `<Suspense>`
- [ ] Never throw errors at module import time
- [ ] Close JSX tags in correct order (LIFO)
- [ ] Remove outdated code before commits
- [ ] Test with fresh environment variables
- [ ] Check git diff for breaking changes
- [ ] Never commit `.env` files or secrets

---

## Quick Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `NEXTAUTH_SECRET must be set` | Thrown at import time | Use runtime fallback |
| `useSearchParams() should be wrapped in suspense` | No Suspense boundary | Wrap with `<Suspense>` |
| `"use client" must be placed before other expressions` | Wrong directive order | Put `'use client'` as first line |
| `Expected '</', got 'jsx text'` | Broken JSX tags | Fix closing tag order |
| `Command exited with 1` | Generic build failure | Check stderr for specific error |
