# x402 Payments - Monetize Your API

Agentbot supports x402 payment protocol for creating paid API endpoints. Agents and users can pay for API access using USDC on Base.

## Payment Address

- **Wallet:** `0xYOUR_WALLET_ADDRESS_HERE` (Bankr)
- **Network:** Base (eip155:8453)

## How It Works

1. Client requests endpoint without payment → returns 402 with payment requirements
2. Client pays in USDC and retries with `x-payments` header
3. Server verifies payment and returns data

## Creating Paid Endpoints

Import the x402 config:

```typescript
import { getX402Server, x402Config } from "@/lib/x402";
```

Example endpoint:

```typescript
export async function GET(req: NextRequest) {
  const server = getX402Server();
  
  const paymentRequirements = {
    accepts: {
      scheme: "exact",
      price: "$0.001",
      network: "eip155:8453",
      payTo: x402Config.payTo,
    },
    description: "Your endpoint description",
    mimeType: "application/json",
  };

  const authHeader = req.headers.get("x-payments");
  if (!authHeader) {
    return new NextResponse(JSON.stringify({ 
      error: "Payment required",
      payment: paymentRequirements 
    }), { status: 402 });
  }

  // Verify and return data
  // ...
}
```

## Pricing Guide

| Use Case | Suggested Price |
|----------|---------------|
| Simple data lookup | $0.001 - $0.01 |
| API proxy/enrichment | $0.01 - $0.10 |
| Compute-heavy query | $0.10 - $0.50 |
| AI inference | $0.05 - $1.00 |

## Testing

```bash
# Should return 402 without payment
curl https://agentbot.raveculture.xyz/api/your-endpoint

# Pay and retry with x-payments header
npx awal x402 pay https://agentbot.raveculture.xyz/api/your-endpoint
```

## Environment Variables

```bash
X402_PAY_TO=0xYOUR_WALLET_ADDRESS_HERE
X402_FACILITATOR_URL=https://x402.org/facilitator
```

## Supported Networks

- Base mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`
