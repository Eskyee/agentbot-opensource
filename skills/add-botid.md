# Add BotID Protection

## Overview
Add Vercel BotID to protect critical endpoints from bot attacks.

## Prerequisites
- Vercel account with BotID enabled
- `botid` package installed: `npm install botid`

## Setup

### 1. Install Package
```bash
cd web && npm install botid
```

### 2. Configure Next.js
Update `next.config.js`:
```javascript
const withBotId = require('botid/next/config')
const nextConfig = { /* your config */ }
module.exports = withBotId(nextConfig)
```

### 3. Protect API Routes
Add bot protection to sensitive endpoints:

```typescript
// app/api/register/route.ts
import { checkBotId } from 'botid/server'

export async function POST(req: Request) {
  const { isBot } = await checkBotId()
  
  if (isBot) {
    return new Response('Access denied', { status: 403 })
  }
  
  // Your existing logic...
}
```

### 4. Protect Login
```typescript
// app/api/auth/[...nextauth]/route.ts
import { checkBotId } from 'botid/server'

export async function POST(req: Request) {
  const { isBot } = await checkBotId()
  
  if (isBot) {
    return new Response('Access denied', { status: 403 })
  }
  
  // Your existing logic...
}
```

## Routes to Protect

| Route | Purpose |
|-------|---------|
| `/api/register` | Prevent fake account creation |
| `/api/auth/*` | Block brute force attacks |
| `/api/stripe/*` | Protect payment endpoints |
| `/api/agents/provision` | Stop resource abuse |

## Environment Variables
BotID automatically works with Vercel deployment - no extra env vars needed for basic use.

## Testing
1. Deploy to Vercel
2. Test from browser - should work
3. Test from script/curl - should be blocked
