# Error Handling Reference

Resolve Bankr API errors and common issues.

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **400** | Bad request | Check prompt format, validate parameters |
| **401** | Unauthorized | Fix API key — missing or invalid |
| **402** | Payment required | Top up credits or upgrade plan |
| **403** | Forbidden | API key lacks permission — enable at bankr.bot/api-keys |
| **404** | Not found | Job ID doesn't exist or wrong endpoint |
| **409** | Conflict | Profile already exists (POST /agent/profile) |
| **429** | Rate limited | Show `resetAt` time to user, suggest Bankr Club (1,000/day) |
| **500** | Server error | Retry after delay |
| **502/503** | Gateway/unavailable | Temporary issue, retry with exponential backoff |

## Rate Limiting (429)

The `/agent/prompt` endpoint enforces daily rolling-window limits:

| Tier | Daily Limit |
|------|-------------|
| Standard | 100 messages/day |
| Bankr Club | 1,000 messages/day |

**Response:**
```json
{
  "error": "Daily limit exceeded",
  "resetAt": 1736942400000,
  "limit": 100,
  "used": 100
}
```

Always show `resetAt` as a formatted time — e.g. "Resets at 3:45 PM". Prompt users to upgrade at bankr.bot.

## API Key Errors (401 / 403)

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid API key" | Wrong or revoked key | Generate new key at bankr.bot/api-keys |
| "Agent API access not enabled" | Key lacks agent permission | Enable Agent API in key settings |
| "Read-only API key" | Key is read-only, write attempted | Enable write access or use a different key |
| "IP address not allowed" | IP not in allowlist | Add IP or disable IP whitelist |

## Job Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Insufficient balance" | Not enough tokens or gas | Add funds, reduce amount |
| "Token not found on [chain]" | Wrong symbol/chain | Specify chain, use contract address |
| "Slippage tolerance exceeded" | Price moved during execution | Retry, use smaller amount |
| "Transaction reverted" | On-chain failure | Check parameters, retry |
| "Network congestion" | High gas / slow chain | Increase gas or try Base/Polygon |
| "Polymarket market not found" | Market closed or wrong search | Try different search terms |

## User-Friendly Error Messages

**Rate limit:**
```
You've used all 100 daily messages. Resets at [time].
Upgrade to Bankr Club for 1,000 messages/day → bankr.bot
```

**Insufficient balance:**
```
Not enough ETH for this trade.
Check your balance or reduce the amount.
```

**Token not found:**
```
Couldn't find "[TOKEN]" on [chain].
Try specifying the chain, e.g. "buy TOKEN on Base", or use the contract address.
```

**API key missing permission:**
```
Your Bankr API key needs Agent API access enabled.
Update it at bankr.bot/api-keys
```

## Exponential Backoff

For 429 / 5xx errors, retry with backoff:
- Attempt 1: wait 2s
- Attempt 2: wait 4s
- Attempt 3: wait 8s
- Attempt 4: wait 16s
- After 4 retries: surface error to user

## Contacts / Support

- Twitter: @bankr_bot
- Telegram: @bankr_ai_bot
- API keys: https://bankr.bot/api-keys
