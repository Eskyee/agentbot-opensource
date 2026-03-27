# Tempo Wallet GUI — Agentbot Integration Spec

## Overview
Integrate Agentbot with Tempo Wallet (wallet.tempo.xyz) for seamless agent payments. Users authenticate with passkeys, get a USD-denominated wallet, and pay for agent calls via MPP payment sessions. We sponsor gas. No crypto UX friction.

## Current State
- ✅ MPP client (`lib/mpp/client.ts`) — 402 payment flow with Tempo signing
- ✅ MPP verification (`lib/mpp/config.ts`) — chain verification, pathUSD config
- ✅ Tempo chain config (`lib/mpp/tempo.ts`) — mainnet (4217) + testnet (42431)
- ✅ x402 Gateway — agent-to-agent payments on Tempo
- ✅ viem/tempo in dependencies
- ❌ No Tempo Wallet integration for end users
- ❌ No MPP service registration
- ❌ No fee payer handler
- ❌ No payment sessions

## Architecture

### Integration Model
Agentbot integrates WITH Tempo Wallet. We don't build a custom wallet. Users authenticate via wallet.tempo.xyz passkey flow. We register as an MPP service and handle payments server-side.

### User Flow
```
Sign up → "Connect Tempo Wallet" → Passkey (Face ID/Touch ID) → Wallet created
→ Top up (card or crypto) → Agent calls → Auto-deduct via MPP → Receipt
```

### Components

#### 1. MPP Service Registration
Register Agentbot endpoints in Tempo's service directory so users can discover us via `tempo wallet services`.

**Service Definition:**
```json
{
  "name": "Agentbot",
  "description": "AI agent platform — provision, run, and manage agents",
  "endpoints": [
    {
      "url": "https://agentbot.raveculture.xyz/api/v1/gateway",
      "methods": ["POST"],
      "pricing": {
        "agent": "0.05",
        "generate-text": "0.01",
        "tts": "0.03",
        "stt": "0.02"
      }
    }
  ]
}
```

#### 2. Fee Payer Handler
Drop-in `Handler.feePayer` for Next.js API routes. We sponsor gas for all users.

**File:** `web/app/api/fee-payer/route.ts`
```ts
import { Handler } from 'tempo.ts/server'
import { tempo } from 'viem/chains'
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const handler = Handler.feePayer({
  account: privateKeyToAccount(process.env.TEMPO_FEE_PAYER_KEY as `0x${string}`),
  chain: tempo,
  transport: http(),
})

export const POST = handler.fetch
```

#### 3. Wallet Connect Button
Wagmi passkey connector for "Connect Tempo Wallet" on signup.

**File:** `web/components/TempoWalletConnect.tsx`
```ts
import { useConnect, useConnectors } from 'wagmi'

export function TempoWalletConnect() {
  const connect = useConnect()
  const [connector] = useConnectors()

  return (
    <button onClick={() => connect.connect({ connector, capabilities: { type: 'sign-up' } })}>
      Connect Tempo Wallet
    </button>
  )
}
```

#### 4. Payment Sessions
MPP sessions for per-call billing. Off-chain vouchers, sub-100ms, near-zero fees.

**Flow:**
1. User connects wallet → session opened
2. Agent call → signed voucher deducts from deposit
3. Session settles on-chain periodically
4. User can close session to reclaim unused funds

#### 5. Balance Display
Pull balance from Tempo RPC, show in dashboard.

**File:** `web/app/api/wallet/route.ts`
```ts
import { createPublicClient, http } from 'viem'
import { tempo } from 'viem/chains'

const client = createPublicClient({ chain: tempo, transport: http() })

export async function GET(req: Request) {
  const { address } = await req.json()
  const userFeeToken = await client.fee.getUserToken({ account: address })
  const balance = await client.token.getBalance({ account: address, token: userFeeToken.address })
  return Response.json({ balance, feeToken: userFeeToken })
}
```

#### 6. Wallet Dashboard
**File:** `web/app/dashboard/wallet/page.tsx`

```
┌─────────────────────────────────────────┐
│  WALLET                                 │
│  ═════════════════════════════════════  │
│                                         │
│  Balance          $12.47 pathUSD        │
│  Address          0xd8fd...db56f        │
│  Network          Tempo Mainnet         │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  TOP UP  │  │  SEND    │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ─── RECENT ACTIVITY ──────────────     │
│  -2.00   Agent call (generate-text)     │
│  +10.00  Top-up (card → pathUSD)       │
│  -0.05   Agent call (tts)              │
│                                         │
└─────────────────────────────────────────┘
```

## File Structure
```
agentbot/
├── web/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── wallet/
│   │   │       └── page.tsx          # Wallet dashboard
│   │   └── api/
│   │       ├── wallet/
│   │       │   └── route.ts          # Balance + history API
│   │       └── fee-payer/
│   │           └── route.ts          # Handler.feePayer
│   ├── components/
│   │   ├── TempoWalletConnect.tsx     # Passkey connect button
│   │   ├── WalletBalance.tsx          # Balance display
│   │   └── TransactionHistory.tsx     # Activity feed
│   └── lib/
│   │   ├── tempo-wallet.ts            # Tempo Wallet client config
│   │   └── mpp/                       # Existing MPP code ✅
│   └── wagmi.config.ts                # Add webAuthn connector
├── docs/
│   └── WALLET_GUI_SPEC.md             # This file
```

## Implementation Phases

### Phase 1: Fee Payer + Wallet Connect (Day 1)
- [ ] Add `Handler.feePayer` to API routes
- [ ] Add webAuthn connector to wagmi config
- [ ] Create TempoWalletConnect component
- [ ] Wire into signup flow

### Phase 2: Balance + History API (Day 2)
- [ ] Wallet balance endpoint (Tempo RPC)
- [ ] Transaction history from chain
- [ ] Connect to dashboard

### Phase 3: Payment Sessions (Day 3)
- [ ] MPP session management
- [ ] Off-chain voucher signing
- [ ] Auto-settle on interval

### Phase 4: Dashboard + Top-Up (Day 4)
- [ ] Wallet dashboard page
- [ ] Stripe → pathUSD top-up
- [ ] Transaction history UI

## Dependencies
- viem/tempo ✅ (already installed)
- wagmi/tempo (add webAuthn connector)
- tempo.ts/server (for Handler.feePayer)
- Stripe (already integrated)

## Security
- Passkey auth (WebAuthn/P256) — keys in device secure enclave
- Fee payer key stored server-side, encrypted
- Rate limiting on fee-payer endpoint
- Max sponsorship per user per day
- Payment session deposit limits

## Notes
- No native token — everything is USD-denominated
- pathUSD has 6 decimals (not 18)
- Tempo supports gas sponsorship at protocol level
- MPP sessions are off-chain (sub-100ms billing)
- Service discovery via `tempo wallet services`
- CLI available: `tempo wallet login/balance/transfer/sessions`
