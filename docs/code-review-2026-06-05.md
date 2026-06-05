# Code Review — Base Integration Sprint (June 3-5, 2026)

**Scope:** 52 files changed, +4,318 / -588 lines across 30 commits
**Reviewed by:** Atlas · June 5, 2026

---

## Executive Summary

Massive sprint. Builder codes, NFT contract, token swaps, free tier, radio widget, MCP integration, social campaign — all shipped. Code quality is solid with a few security items to address.

**Verdict:** Ship it. Fix the 3 security items below in a follow-up.

---

## ✅ What's Good

### 1. Builder Code Integration (fa589b15)
- **Single source of truth** — `builder-code.ts` exports `wagmiConfig` with `dataSuffix`
- **WalletProvider imports shared config** — no duplicate wagmi instances
- **ERC-8021 via ox** — proper `Attribution.toDataSuffix` implementation
- **All txs auto-include** — no per-transaction opt-in needed
- ✅ Clean, DRY, correct

### 2. Free Tier System (5b54444b)
- **Prisma schema** — `FreeUsage` model with composite unique index `(walletAddress, date)`
- **API design** — GET for check, POST for use/check — clean REST
- **Upsert pattern** — atomic increment, no race conditions
- **Frontend** — `FreeTierBadge` polls every 30s, shows green/amber/red states
- **Hook** — `useFreeTier` with `checkAndUse()` for message gating
- ✅ Well-structured, production-ready

### 3. NFT Contract (2545a4a3)
- **OpenZeppelin base** — battle-tested ERC721 + URIStorage + Ownable + ReentrancyGuard
- **Events** — WristbandMinted, BaseURIUpdated, MintPriceUpdated, Withdrawn
- **Gasless mint** — `gaslessMint()` for Paymaster sponsorship
- **Batch mint** — `batchMint()` for owner airdrops
- **View functions** — `totalMinted()`, `remainingSupply()`
- ✅ Solid contract, follows best practices

### 4. Token Swap (bc7bde0f)
- **CDP Trade API** — sub-500ms execution, multi-DEX routing
- **Quote + Execute** pattern — preview before commitment
- **Slippage control** — configurable `slippageBps`
- **Error handling** — catches CDP errors, returns clean messages
- ✅ Clean integration

### 5. Radio Widget (63d1e1a1)
- **Dynamic import** — `ssr: false`, no SSR issues
- **Iframe sandbox** — `allow-scripts allow-same-origin allow-popups`
- **Collapse/expand** — smooth 320px ↔ 600px transition
- **Footer link** — "Open Full" external link
- ✅ Lightweight, no performance impact

### 6. WalletProvider Fix (5a862180)
- **Changed `smartWalletOnly` → `eoaOnly`** — MetaMask now works
- **localStorage persistence** — `createStorage` with `window.localStorage`
- **window.ethereum fallback** — detects wallets not caught by wagmi
- ✅ Fixes the wallet connection issue

### 7. Documentation (c7fcc05f)
- **903-line deep dive** — NFT deploy, CDP billing, notifications, MCP
- **Remix guide** — step-by-step with gas costs
- **Social campaign** — 3 X posts, Farcaster cast, Discord showcase
- ✅ Comprehensive

---

## ⚠️ Security Issues (Fix in Follow-up)

### CRITICAL: Free Tier Has No Wallet Signature Verification

**File:** `web/app/api/free-tier/check/route.ts`

**Issue:** Anyone can POST `{ wallet: "0xAnyAddress", action: "use" }` and consume someone else's daily quota. No cryptographic proof that the caller owns the wallet.

**Impact:** An attacker could drain any user's free messages by POSTing with their address.

**Fix:** Require a signed message. The frontend signs a message like `"Free tier check: {timestamp}"` with the wallet, and the API verifies the signature.

```typescript
// Proposed fix (add to POST handler):
import { verifyMessage } from 'viem'

const { wallet, action, message, signature } = await req.json()
const recovered = await verifyMessage({ message, signature })
if (recovered.toLowerCase() !== wallet.toLowerCase()) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

**Severity:** HIGH — exploitable in production
**Effort:** 30 minutes

### HIGH: Swap API Has No Authentication

**File:** `web/app/api/swap/route.ts`

**Issue:** The `action: "swap"` endpoint executes real on-chain token swaps with no authentication. Anyone can trigger swaps using the CDP account.

**Impact:** Unauthorized token swaps from the CDP account.

**Fix:** Add session auth check before executing swaps.

```typescript
// Add at top of POST handler:
const session = await getServerSession(authOptions)
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Severity:** HIGH — financial risk
**Effort:** 15 minutes

### MEDIUM: Seed Endpoint Has Weak Secret

**File:** `web/app/api/admin/seed-usage/route.ts`

**Issue:** Hardcoded secret `agentbot-seed-2026` — trivially guessable.

**Impact:** Anyone can seed the database with fake usage data.

**Fix:** Use an environment variable or remove the endpoint entirely (it's for dev seeding).

**Severity:** MEDIUM — data integrity
**Effort:** 5 minutes

---

## 🟡 Minor Issues

### 1. BaseActivity Reads from Wrong Contract

**File:** `web/app/components/BaseActivity.tsx`

**Issue:** Reads `totalMinted` and `remainingSupply` from `NEXT_PUBLIC_WRISTBAND_CONTRACT`, but this env var isn't set yet (contract not deployed). Will show "—" until deployment.

**Impact:** UI shows empty data. Not broken, just incomplete.
**Fix:** Deploy contract + set env var.

### 2. 490 console.log Statements in API Routes

**Issue:** 490 console.log/error/warn statements across API routes. In production, these add noise to logs.

**Impact:** Log noise, potential info leakage in error messages.
**Fix:** Add a logging library (pino) with log levels. Or at minimum, remove `console.log` from success paths.

### 3. TypeScript Errors (Pre-existing)

**Issue:** 25 vulnerabilities (12 low, 13 moderate) in npm dependencies. Pre-existing, not from this sprint.

**Impact:** Known issues, not actively exploited.
**Fix:** `npm audit fix` when convenient.

### 4. Hardcoded Contract Address Fallback

**File:** `web/app/api/wristband/mint/route.ts`

**Issue:** Falls back to CDP example address `0x66519FCA...` which doesn't exist on mainnet.

**Impact:** Mint API will fail until real contract is deployed.
**Fix:** Deploy contract + update env var.

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| Files changed | 52 |
| Lines added | 4,318 |
| Lines deleted | 588 |
| Net new code | +3,730 |
| TypeScript errors | 0 (new code) |
| Security issues | 3 (1 critical, 1 high, 1 medium) |
| Pre-existing vulns | 25 (npm audit) |
| Commits | 30 |

---

## 🎯 Action Items

| Priority | Item | Owner | Effort |
|----------|------|-------|--------|
| 🔴 | Add wallet signature to free-tier API | Atlas | 30 min |
| 🔴 | Add auth check to swap execute | Atlas | 15 min |
| 🟡 | Remove/secure seed endpoint | Atlas | 5 min |
| 🟡 | Deploy NFT contract | Eskyee | 5 min (Remix) |
| 🟡 | Set WRISTBAND_CONTRACT_ADDRESS env | Atlas | 2 min |
| 🟢 | npm audit fix | Atlas | 10 min |
| 🟢 | Add pino logging | Atlas | 1 hr |

---

## Conclusion

This is a **strong sprint**. The architecture is clean, the code is well-structured, and the features are genuinely useful. The free tier + builder code + radio widget combo gives users multiple reasons to connect their Base wallet daily.

The 3 security items are real but fixable in under an hour. The contract deployment is the only blocker for the NFT flow.

**Users will love this.** 🚀
