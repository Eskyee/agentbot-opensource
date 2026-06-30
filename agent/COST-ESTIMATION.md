# Eve Multi-Tenancy Cost Estimation

## Architecture Summary

Agentbot uses **Option 1**: You bill users through Stripe, Vercel costs are your infrastructure cost.

```
Agentbot (your app)
├── Auth (per-user sessions via Better Auth)
├── Eve (single deployment on Vercel)
│   ├── Sessions: one per user, durable (Vercel Workflows)
│   ├── Tools: check ctx.session.auth.sub, scope to user's data
│   ├── Connections: per-user OAuth (stored in UserConnection table)
│   └── Sandbox: isolated microVM per request (Vercel Sandbox)
└── Billing: Stripe subscriptions (Solo £29, Collective £69, Label £149)
```

## Cost Breakdown

### Vercel Infrastructure (Your Cost)

| Resource             | Pricing                      | Notes                   |
| -------------------- | ---------------------------- | ----------------------- |
| **Vercel Functions** | $0.18 per 1M invocations     | Eve runs on Functions   |
| **Vercel Workflows** | $0.18 per 1M invocations     | Durable sessions        |
| **Vercel Sandbox**   | $0.12 per 1K compute minutes | Isolated microVMs       |
| **Edge Runtime**     | $0.65 per 1M invocations     | If using Edge functions |
| **Bandwidth**        | $0.15 per GB                 | After 1TB free          |
| **Build minutes**    | $0.01 per minute             | After 6,000 free        |

### AI Gateway (Your Cost — Pass-through)

| Model            | Input          | Output          | Notes            |
| ---------------- | -------------- | --------------- | ---------------- |
| Claude Sonnet 4  | $3.00/M tokens | $15.00/M tokens | Default model    |
| Claude Haiku 4.5 | $0.80/M tokens | $4.00/M tokens  | Demo/light tasks |
| GPT-4o-mini      | $0.15/M tokens | $0.60/M tokens  | Budget option    |

**Zero markup** — you pay provider rates. No additional Vercel fee.

### OpenClaw Deployment (Your Cost)

| Resource             | Pricing                            | Notes                    |
| -------------------- | ---------------------------------- | ------------------------ |
| **Fly.io VM**        | $1.94/mo per 256MB VM              | Production agent runtime |
| **Fly.io CPU**       | $0.0000125/GB-s                    | Pay-per-use              |
| **Fly.io Memory**    | $0.000200/GB-s                     | Pay-per-use              |
| **Fly.io Storage**   | $0.15/GB/mo                        | Persistent volumes       |
| **Fly.io Bandwidth** | Free first 100GB/mo, then $0.02/GB | Outbound                 |

**Per OpenClaw deployment**: ~$2-5/mo depending on usage

### Per-User Cost Estimation

Assuming moderate usage (10 messages/day, ~2K tokens per exchange):

| Metric                   | Per User/Month            | Notes                         |
| ------------------------ | ------------------------- | ----------------------------- |
| **Function invocations** | ~3,000                    | 10 msgs × 30 days × 10 calls  |
| **Workflow invocations** | ~300                      | Session durable state         |
| **Sandbox compute**      | ~30 min                   | Tool execution                |
| **OpenClaw deployment**  | ~$2-5                     | Production agent runtime      |
| **AI tokens**            | ~1.8M input + 600K output | 10 msgs × 30 days × 2K tokens |
| **Bandwidth**            | ~50 MB                    | Responses + metadata          |

### Cost Per User Tier (Including OpenClaw)

| Tier                    | Your Cost  | Revenue | Margin |
| ----------------------- | ---------- | ------- | ------ |
| **Solo (£29/mo)**       | ~£3.45/mo  | £29/mo  | 88.1%  |
| **Collective (£69/mo)** | ~£8.20/mo  | £69/mo  | 88.1%  |
| **Label (£149/mo)**     | ~£17.50/mo | £149/mo | 88.3%  |

_Estimates based on Claude Sonnet 4 at 10 messages/day + 1 OpenClaw deployment_

### Heavy Usage (50 messages/day)

| Tier                    | Your Cost  | Revenue | Margin |
| ----------------------- | ---------- | ------- | ------ |
| **Solo (£29/mo)**       | ~£5.25/mo  | £29/mo  | 81.9%  |
| **Collective (£69/mo)** | ~£13.00/mo | £69/mo  | 81.2%  |
| **Label (£149/mo)**     | ~£27.50/mo | £149/mo | 81.5%  |

### Enterprise/Network Tier

| Tier                  | Your Cost  | Revenue | Margin |
| --------------------- | ---------- | ------- | ------ |
| **Network (£499/mo)** | ~£35-50/mo | £499/mo | 90-93% |

## What Users Get

### Solo (£29/mo)

- 1 agent
- **1 OpenClaw deployment** (production, always-on)
- 100 messages/day
- 5 tools (get_status, query_metrics, manage_schedules, list_connections, get_weather)
- Basic analytics
- Email support

### Collective (£69/mo)

- 5 agents
- **5 OpenClaw deployments** (production, always-on)
- 500 messages/day
- All tools + subagents
- Slack/Telegram channels
- GitHub/Linear connections
- Priority support

### Label (£149/mo)

- 20 agents
- **20 OpenClaw deployments** (production, always-on)
- 2,000 messages/day
- All features
- Custom connections
- API access
- Dedicated support

### Network (£499/mo)

- Unlimited agents
- **Unlimited OpenClaw deployments** (production, always-on)
- Unlimited messages
- White-label options
- Custom integrations
- SLA guarantee
- Dedicated account manager

## Key Insight

The AI tokens and OpenClaw deployments are your biggest costs, but even at heavy usage, the margin is 81%+. The real value is in the platform, not the infrastructure. Users pay for:

- **Production agent deployment** (OpenClaw on Fly.io — always-on, 24/7)
- Isolated, durable agent sessions (Eve on Vercel)
- Pre-built tools and integrations
- Managed infrastructure (Vercel + Fly.io)
- Support and reliability

**Conversion funnel**: Preview (free) → Sandbox (paid) → OpenClaw (production deployment)

## Cost Optimization Tips

1. **Use Claude Haiku for simple tasks** — 4x cheaper than Sonnet
2. **Cache common responses** — reduce token usage
3. **Set message limits per tier** — prevent abuse
4. **Monitor usage via AI Gateway observability** — track per-user costs
5. **Use API Key Budgets** — cap per-user spending
