# Agentbot Pricing

## Live Stripe plans (source of truth)
These are the actual Stripe product IDs in production:

| Plan        | Product ID           | Price   |
|-------------|----------------------|---------|
| Underground | prod_U9B91PN8c9puXP  | £29/mo  |
| Collective  | prod_U98tpiNSfUlIlP  | £69/mo  |
| Label       | prod_U9CBhMyxK2fr2z  | £199/mo |

Checkout: `GET /api/stripe/checkout?plan=<underground|collective|label>` → Stripe hosted checkout, monthly recurring, GBP.

All pitch materials, social posts, and fundraising docs have been updated to match these 3 plans (Mar 15, 2026).
