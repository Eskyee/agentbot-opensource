# Web Code Issues - Gordon Handles

## Current Build Errors

### 1. Stripe API Version
- **File:** `app/lib/stripe.ts`
- **Issue:** `apiVersion: '2023-10-16'` is outdated
- **Fix:** Update to `'2026-02-25.clover'`

### 2. Headers Async
- **Files:** 
  - `app/api/webhooks/stripe/route.ts`
  - `app/lib/privateMode.ts`
- **Issue:** `headers()` is now async in Next.js 16
- **Fix:** `const headersList = await headers()`

### 3. Stripe.subscriptions.del
- **File:** `app/lib/stripe.ts`
- **Issue:** Method `del()` doesn't exist on `SubscriptionsResource`
- **Fix:** Use `stripe.subscriptions.cancel()` or check latest SDK

## Root Cause

Next.js 16 has breaking changes. Stripe SDK also updated. Code needs updating.

## Who Fixes

**Gordon** - Web production code

## Timeline

Fix when Gordon has time. Not blocking core functionality.
