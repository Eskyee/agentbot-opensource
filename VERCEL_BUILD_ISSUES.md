# Vercel Build Issues & Fixes

Last updated: March 2026

## Issues That Broke Builds

### 1. vercel.json Schema Errors
- **Problem:** Invalid properties in `vercel.json`
- **Fixes:**
  - `$schema` URL was wrong: `https://openapi.vercel.sh/vercel.json` → `https://openapi.vercel.com/vercel.json`
  - Removed invalid properties: `protection`, `preview`, `github`
  - Removed `outputDirectory` (Next.js defaults to `.next`)

### 2. Missing Dependencies
- **Problem:** `@coinbase/cdp-sdk` was used but not in `package.json`
- **Fix:** Added `"@coinbase/cdp-sdk": "^1.44.1"` to web/package.json dependencies

### 3. CDP SDK Import Errors
- **Problem:** Wrong imports from `@coinbase/cdp-sdk` - exports don't exist (`Coinbase`, `Wallet`)
- **Fix:** Removed CDP SDK entirely and rewrote wallet route with simple address generation

### 4. Prisma Query Errors
- **Problem:** Wallet model uses `id` as unique identifier, but code used `userId` with `findUnique`
- **Fixes:**
  - Changed `findUnique` → `findFirst` for user wallet queries
  - Fixed `created_at` → `createdAt` (Prisma uses camelCase)

### 5. Middleware Runtime Error
- **Problem:** Next.js 16 requires `experimental-edge` instead of `edge`
- **Fix:** Changed `runtime: 'edge'` → `runtime: 'experimental-edge'` in middleware.ts

### 6. useSearchParams Suspense Error
- **Problem:** `/pricing` page uses `useSearchParams` without Suspense boundary
- **Fix:** Wrapped component in `<Suspense>` boundary

### 7. Pricing Page Checkout Not Working
- **Problem:** Pricing page used JavaScript fetch to call Stripe checkout, which couldn't handle redirects properly
- **Fix:** Use direct `<a href="/api/stripe/checkout?plan=...">` links instead of fetch + window.location redirect (same as home page)

## Valid vercel.json Configuration

```json
{
  "$schema": "https://openapi.vercel.com/vercel.json",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["lhr1"],
  "headers": [...],
  "crons": [...]
}
```

## Key Takeaways

1. Always use `https://openapi.vercel.com/vercel.json` for schema
2. Don't add properties that aren't in Vercel's schema
3. Remove `outputDirectory` - Next.js handles this automatically
4. When adding new packages, ensure they're in `package.json`
5. When using Prisma, verify field names match schema (camelCase)
6. Use `findFirst` instead of `findUnique` unless querying by unique fields (id, address)
7. Wrap `useSearchParams` in Suspense for static generation
8. Use `experimental-edge` for middleware runtime in Next.js 16
9. For Stripe checkout, use direct `<a href>` links not fetch + redirect (Stripe redirects don't work with client-side fetch)
