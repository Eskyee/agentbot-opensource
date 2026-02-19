# Token Pricing Matrix (GBP)

This is a launch-ready pricing model for earning margin on AI token resale.

## 1) Commercial Model

- Keep core subscription plans:
  - Starter: £19/month
  - Pro: £49/month
- Offer two usage modes:
  - BYOK (customer provides API key)
  - Managed Tokens (you provide tokens + bill usage)

## 2) Recommended Launch Pricing

### Managed Tokens Add-on

- Starter Managed Tokens Add-on: £9/month
  - Includes 6 million token credits
- Pro Managed Tokens Add-on: £19/month
  - Includes 16 million token credits

### Overage

- Overage rate: £2.50 per 1 million token credits
- Auto top-up block: £10 for 4 million token credits

## 3) Gross Margin Targets

Use this target rule:

- Keep blended token cost at or below £1.25 per 1 million token credits
- Charge customers £2.50 per 1 million token credits

Expected gross margin on overage:

- Revenue: £2.50 / 1M
- Cost: ~£1.25 / 1M
- Gross profit: ~£1.25 / 1M
- Gross margin: ~50%

## 4) Plan Economics (Example)

### Starter + Managed Tokens

- Subscription revenue: £19
- Managed add-on revenue: £9
- Total: £28/month
- Typical infra + ops: £2–£4
- Token cost at included allowance (6M @ £1.25/1M): ~£7.50
- Estimated gross profit: ~£16.50–£18.50

### Pro + Managed Tokens

- Subscription revenue: £49
- Managed add-on revenue: £19
- Total: £68/month
- Typical infra + ops: £3–£6
- Token cost at included allowance (16M @ £1.25/1M): ~£20
- Estimated gross profit: ~£42–£45

## 5) Guardrails (Important)

- Show usage meter (included, used, remaining)
- Enforce soft limit at 85% + warning message
- Hard stop or require top-up at 100%
- Enable auto top-up toggle (off by default)
- Add per-user monthly max spend cap

## 6) Product UX Copy (Suggested)

- "Managed Tokens: we handle model billing for you"
- "Includes X million credits/month"
- "Overage billed at £2.50 per 1M credits"
- "Bring your own key (BYOK) available"

## 7) Stripe Setup Mapping

Create these Stripe prices:

- `price_starter_gbp_monthly` → £19/month
- `price_pro_gbp_monthly` → £49/month
- `price_tokens_starter_addon_gbp_monthly` → £9/month
- `price_tokens_pro_addon_gbp_monthly` → £19/month
- `price_tokens_topup_10_gbp` → one-time £10

## 8) Rollout Recommendation

Phase 1 (now):

- Launch BYOK + Managed Tokens add-on (manual enable)
- Track actual blended token cost per active user

Phase 2 (after 2–4 weeks):

- Tune included allowances and overage rate from observed cost
- Add annual discount plans for retention
