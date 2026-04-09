# Agentbot x402 Gateway v4 — Sessions, Anti-Scam Guard, MPP Standard

**March 23, 2026** · 5 min read

---

Last night we shipped the biggest update to Agentbot's payment infrastructure since launch. In 6 hours, we went from a custom x402 gateway to a fully MPP-compliant payment platform with sessions, anti-fraud protection, and standard 402 flow.

## What We Built

### 🛡️ Anti-Scam Guard
Every payment endpoint is now protected by a multi-layer guard system:
- **Rate limiting**: 60 requests/min per IP
- **Payment caps**: 10 pathUSD max per transaction, 100 per agent per day, 1000 global daily
- **Cooldowns**: 5 seconds between payments from the same agent
- **Blacklist/Whitelist**: Pre-approved trusted agents, instant scammer blocking

No one can drain our operator wallet. Maximum loss per day: 1000 pathUSD. Maximum per scammer: 10 pathUSD per transaction with 5-second cooldowns.

### 🔄 MPP Standard Compliance
We refactored from custom Tempo signing to `mppx` — the official Machine Payments Protocol middleware co-authored by Stripe and Tempo. This means:
- **Standard 402 flow** — compatible with every x402 client
- **Express 5** — upgraded from Express 4 for native ESM support
- **`www-authenticate: Payment` headers** — proper MPP challenge/response

### 💸 Sessions (Pay-Per-Use Without Per-TX Signing)
The killer feature. Instead of signing every transaction, agents can:
1. **Deposit once** into an on-chain escrow (payment channel)
2. **Sign off-chain vouchers** for each subsequent request (sub-millisecond, no blockchain)
3. **Top up** without closing the channel
4. **Close** and get unused funds refunded

This means agents can make 100+ API calls per second without waiting for blockchain confirmations. The session endpoints:
- `/api/sessions/inference` — AI inference at £0.05/call
- `/api/sessions/blockdb` — Music queries at £0.001/query
- `/api/sessions/premium` — Premium API at £0.01/request
- `/api/sessions/stream` — SSE streaming at £0.001/token

### 🖥️ CI Pipeline
GitHub Actions pipeline now runs:
- Build verification
- Health endpoint tests
- Guard status checks
- Session endpoint validation
- Auto-deploy to Railway on push to main

### 🔐 Wallet Authentication
Rewrote Base wallet auth to use EIP-712 typed data signing — the standard that Coinbase Smart Wallet supports. No more SIWE parser issues with smart contract wallets.

## The Numbers

| Metric | Before | After |
|---|---|---|
| Payment latency | ~500ms (on-chain) | <1ms (off-chain voucher) |
| Endpoints | 8 | 22 |
| Guard protection | None | Multi-layer |
| Standards | Custom | MPP compliant |
| CI/CD | None | Auto-deploy |

## What's Next

- **Tempo mainnet** — flipping from testnet before March 31 launch
- **402 Index registration** — listing our endpoints on 402index.io
- **Passkey wallets** — embedded WebAuthn wallets for users (no MetaMask needed)
- **Hetzner node** — dedicated RPC node for guaranteed uptime
- **Sessions dashboard** — UI for managing payment channels

## 7 Days to Launch

We're building the payment infrastructure for AI agents on Base. x402 Gateway v4 is live, sessions are working, guard is protecting, and the CI pipeline keeps us shipping.

The future of agent payments is here. And it settles in sub-seconds.

---

**Try it**: [agentbot.raveculture.xyz/demo](https://agentbot.raveculture.xyz/demo)
**Gateway**: [x402-gateway-production.up.railway.app/health](https://x402-gateway-production.up.railway.app/health)
**Code**: [github.com/Eskyee/agentbot-x402-gateway](https://github.com/Eskyee/agentbot-x402-gateway)
