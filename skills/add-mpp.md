# Add MPP/Tempo to Agentbot

Add MPP (Micropayment Pipeline) support to enable agents to pay for external services using USDC on Base.

## What is MPP?

MPP (Micropayment Pipeline) is a protocol that lets AI agents pay for services autonomously. Agents can:
- Pay for API calls on demand using USDC on Base
- Use Tempo Wallet for managed payments
- Integrate with x402 payment protocol

## Multi-Wallet Support

Each agent/company can have their own Tempo wallet for agentic payments:
- Separate wallets per agent/company
- Isolated payment budgets
- Company can fund their agent's wallet independently

## Implementation

### Already Created

- `web/lib/mpp.ts` - MPP client with multi-wallet support
- `web/app/api/agent/mpp/route.ts` - API for wallet management

### 1. Install Dependencies

```bash
cd web
npm install mppx viem
```

### 2. Configure Environment

Add to `.env`:

```env
# Default wallet (fallback)
MPP_PRIVATE_KEY=0x...

# Multiple agent wallets (JSON array)
MPP_AGENT_WALLETS=[]
```

### 3. API Endpoints

#### Create Wallet for Agent

```bash
curl -X POST https://agentbot.raveculture.xyz/api/agent/mpp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-wallet",
    "agentId": "agent-123",
    "companyId": "label-abc"
  }'
```

Response:
```json
{
  "success": true,
  "agentId": "agent-123",
  "companyId": "label-abc",
  "address": "0x...",
  "privateKey": "0x...",
  "message": "Store this private key securely!"
}
```

#### Register Existing Wallet

```bash
curl -X POST https://agentbot.raveculture.xyz/api/agent/mpp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register-wallet",
    "agentId": "agent-456",
    "companyId": "company-xyz",
    "privateKey": "0x..."
  }'
```

#### Get Wallet Address

```bash
curl "https://agentbot.raveculture.xyz/api/agent/mpp?action=get-wallet&agentId=agent-123"
```

#### Get Balance

```bash
curl "https://agentbot.raveculture.xyz/api/agent/mpp?action=get-balance&agentId=agent-123"
```

#### List All Wallets

```bash
curl "https://agentbot.raveculture.xyz/api/agent/mpp?action=list-wallets"
```

#### Make Payment

```bash
curl -X POST https://agentbot.raveculture.xyz/api/agent/mpp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "make-payment",
    "agentId": "agent-123",
    "url": "https://mpp.dev/api/paid-service",
    "method": "POST",
    "body": { "data": "example" }
  }'
```

### 4. Use MPP in Code

```typescript
import { createAgentWallet, makeMPPRequest, getAgentWalletAddress } from '@/lib/mpp';

// Create new wallet for agent
const wallet = createAgentWallet();
console.log(`Address: ${wallet.address}, PrivateKey: ${wallet.privateKey}`);

// Make paid request using agent's wallet
const result = await makeMPPRequest('https://mpp.dev/api/paid-service', {
  agentId: 'agent-123',
});
```

## How It Works

1. **Create wallet**: Agent/company creates wallet via API
2. **Fund wallet**: Send USDC to the wallet address on Base
3. **Agent pays**: When agent calls paid service, uses company wallet
4. **Settlement**: Payment settled in USDC on Base automatically

## Flow Diagram

```
┌─────────────┐     create-wallet      ┌─────────────┐
│   Company   │ ──────────────────────▶│  Agentbot   │
└─────────────┘                        │    API      │
                                       └──────┬──────┘
                                              │
                                              │ Generate wallet
                                              ▼
                                       ┌─────────────┐
                                       │   Tempo     │
                                       │   Wallet    │
                                       │ 0x...addr   │
                                       └──────┬──────┘
                                              │
          ┌──────────────────────────────────┤
          │                                  │
          ▼                                  ▼
┌─────────────────┐               ┌─────────────────┐
│  Fund USDC to   │               │   Agent makes  │
│  wallet addr    │               │  paid API call │
└─────────────────┘               └────────┬────────┘
                                           │
                                           │ 402 → Pay
                                           ▼
                                    ┌─────────────┐
                                    │   MPP       │
                                    │  Service    │
                                    └─────────────┘
```

## Funding

1. Get wallet address from API
2. Send USDC to that address on Base network
3. Agent can now make payments

## Testing

```bash
# Test MPP connection
mppx account create
mppx https://mpp.dev/api/ping/paid
```

## References

- [MPP Documentation](https://mpp.dev)
- [Tempo Wallet](https://wallet.tempo.xyz)
- [mppx SDK](https://mpp.dev/sdk/typescript)
- [Viem Accounts](https://viem.sh/docs/accounts/local)
