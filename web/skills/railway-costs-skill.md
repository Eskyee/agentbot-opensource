---
name: railway-costs
description: |
  Monitor Railway Pro Plan costs and usage. Use when checking Railway billing, service costs, downgrading plans, or optimizing spending. Triggers on keywords such as railway cost, railway bill, usage, pro plan, estimated bill, downgrade, starter plan, standard plan.
---

# Railway Costs Skill

Monitor and optimize Railway spending on the Pro Plan ($20/mo included usage).

## Current Projects

| Project | Purpose | Typical Monthly |
|---------|---------|-----------------|
| OpenClaw-Agentbot | Gateway + agent infra | $5-15 |
| x402-gw-v2 | x402 payment gateway | $5-40 (Standard plan) |
| x402-gateway | x402 proxy | < $1 |

## Budget Rules

- **Pro Plan:** $20/mo included usage
- **Target:** Stay under $20/mo total
- **Alert threshold:** Estimated > $25/mo

## Service Plan Tiers

| Plan | RAM | vCPU | Disk | Cost |
|------|-----|------|------|------|
| Hobby | 512MB | 0.5 | 1GB | Free |
| Starter | 1-2GB | 1-2 | 5-10GB | $5-10 |
| Standard | 2-8GB | 2-8 | 10-50GB | $20-40 |

## Cost Check Command

```bash
# Via Railway dashboard or:
railway usage 2>&1
```

## Optimization Steps

1. Check if services can run on Starter instead of Standard
2. Check if services are idle (0 CPU, low memory)
3. Suspend unused services
4. Reduce instance count from 3 to 1 for non-critical services

## Rules

1. **Never upgrade a service without checking costs first**
2. **Standard plan = ~$20-40/mo per service** — only use if Starter is insufficient
3. **Check costs every 12 hours** via HEARTBEAT.md
