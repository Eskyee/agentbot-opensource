# Load Test Results — Day 4 (March 16, 2026)

## Baseline (30 sequential requests per endpoint)

| Endpoint          | Avg     | P50     | P95      | Min    | Max      | Status | Errors |
|-------------------|---------|---------|----------|--------|----------|--------|--------|
| Landing Page      | 1142ms  | 1129ms  | 1465ms   | 492ms  | 1477ms   | 200    | 0      |
| Demo Page         | 126ms   | 96ms    | 219ms    | 65ms   | 305ms    | 200    | 0      |
| Why Page          | 155ms   | 141ms   | 227ms    | 75ms   | 291ms    | 200    | 0      |
| Basename API      | 883ms   | 974ms   | 1011ms   | 262ms  | 1011ms   | 200    | 0      |
| Stripe Checkout   | 1080ms  | 1015ms  | 1610ms   | 893ms  | 1753ms   | 303    | 0      |

## Burst Test — Landing Page (concurrent requests)

| Concurrent | OK  | Errors | Avg     | P95      | Max      |
|------------|-----|--------|---------|----------|----------|
| 20         | 20  | 0      | 342ms   | 505ms    | 505ms    |
| 50         | 50  | 0      | 958ms   | 1537ms   | 1582ms   |
| 100        | 100 | 0      | 1382ms  | 3343ms   | 3353ms   |

## Burst Test — API (50 concurrent)

| Endpoint        | OK  | Errors | Avg     | P95      |
|-----------------|-----|--------|---------|----------|
| Basename API    | 50  | 0      | 1251ms  | 2957ms   |
| Settings (401)  | 50  | 0      | 1077ms  | 2267ms   |

## Verdict

- **Zero errors** across all tests — no 5xx, no timeouts, no dropped connections
- Landing page is the slowest at ~1.1s baseline (SSR + hydration). Acceptable for launch
- Demo and Why pages are fast (<200ms) — likely statically cached
- Basename API averages ~900ms — involves on-chain lookup, expected
- Stripe checkout redirect is ~1s — Stripe's side, nothing to optimize
- At 100 concurrent users, P95 hits 3.3s — still no errors, just slower
- **No rate limiting triggered** on the API burst tests

## Recommendations
- Landing page could benefit from ISR (Incremental Static Regeneration) to cache SSR output
- Consider adding a CDN cache header for static pages
- 100 concurrent users with zero errors is solid for launch — unlikely to see that volume on day 1
