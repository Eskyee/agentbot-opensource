# Bankr API Workflow

Understanding the asynchronous job pattern for Bankr Agent API operations.

## Two APIs

- **Agent API** (`/agent/*`) — async, AI-powered natural language. Submit → Poll → Complete.
- **Wallet API** (`/wallet/*`) — synchronous direct operations (portfolio, transfer, sign, submit).

## Agent API: Submit-Poll-Complete

### POST /agent/prompt
```json
// Request
{ "prompt": "What is my ETH balance?", "threadId": "thr_ABC" }

// Response 202
{ "success": true, "jobId": "job_abc123", "threadId": "thr_XYZ", "status": "pending", "message": "Job submitted successfully" }
```

### GET /agent/job/{jobId}
```json
// Completed response
{
  "success": true,
  "jobId": "job_abc123",
  "threadId": "thr_XYZ",
  "status": "completed",
  "prompt": "What is my ETH balance?",
  "response": "You have 0.5 ETH worth approximately $1,825.",
  "richData": [],
  "statusUpdates": [
    { "message": "Checking balances...", "timestamp": "2025-01-26T10:00:00Z" },
    { "message": "Calculating USD values...", "timestamp": "2025-01-26T10:00:02Z" }
  ],
  "processingTime": 3000,
  "completedAt": "2025-01-26T10:00:03Z"
}

// Processing response (show statusUpdates progressively)
{
  "status": "processing",
  "statusUpdates": [{ "message": "Fetching price data...", "timestamp": "..." }],
  "cancellable": true
}

// Failed response
{
  "status": "failed",
  "error": "Insufficient balance for trade",
  "completedAt": "..."
}
```

### POST /agent/job/{jobId}/cancel
Cancel a pending or processing job. Idempotent — cancelling an already-cancelled job returns success.
```json
// Response 200
{ "success": true, "jobId": "job_abc123", "status": "cancelled", "cancelledAt": "..." }
```

## Job Statuses

| Status | Action |
|--------|--------|
| `pending` | Keep polling (2s interval) |
| `processing` | Keep polling, show latest `statusUpdates` message |
| `completed` | Read `response` and optionally `richData` |
| `failed` | Show `error` field, suggest fix |
| `cancelled` | Inform user, allow retry |

## Status Updates

Always show `statusUpdates` progressively during processing — users see real progress:
- "Checking balances..."
- "Finding best route..."
- "Executing swap..."

Track the last shown index and only display new entries on each poll.

## richData

Completed jobs may include `richData` — an array of structured objects (token info, price quotes, charts). The `response` field always contains a human-readable summary regardless.

## Polling Strategy

- Poll every **2 seconds**
- Typical duration: 30s–2min
- Maximum: 5 minutes (150 attempts), then offer cancel
- Show cancel button when `cancellable: true` on job status

## Rate Limits

| Tier | Daily Limit |
|------|-------------|
| Standard | 100 messages/day |
| Bankr Club | 1,000 messages/day |

**429 rate limit response:**
```json
{
  "error": "Daily limit exceeded",
  "message": "You have reached your daily API limit of 100 messages...",
  "resetAt": 1736942400000,
  "limit": 100,
  "used": 100
}
```

`resetAt` is a Unix timestamp (ms) for when the rolling 24h window resets. Show the reset time to users.

## Error Codes

| Status | Error | Resolution |
|--------|-------|------------|
| 400 | Invalid request / Prompt too long | Check input, max 10,000 chars |
| 401 | Authentication required | Check API key |
| 402 | Payment required | Add funds or upgrade plan |
| 403 | Agent API access not enabled | Enable at bankr.bot/api-keys |
| 429 | Rate limit exceeded | Show `resetAt` time, suggest Bankr Club upgrade |
| 500/502/503 | Server error | Retry with exponential backoff |

## Address Resolution

Resolve ENS names, social handles, and addresses — **no API key required**:
```
GET /addresses/resolve?value=vitalik.eth&type=ens
```

`type`: `address` | `ens` | `twitter` | `farcaster`

Response:
```json
{ "resolved": true, "address": "0x...", "displayName": "vitalik.eth" }
```

Useful before transfers to verify the recipient resolves correctly.
