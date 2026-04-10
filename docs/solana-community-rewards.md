# Solana Community Rewards

This document tracks the live Agentbot community rewards program for the Solana token:

- Token address: `9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump`
- Claim page: `/claim`
- Community dashboard: `/dashboard/community`

## Phase Status

### Phase 1 — Holder Verification

Live:
- Solana wallet signature verification
- Live token balance lookup
- Tier calculation (`Holder`, `Builder`, `Whale`)
- One claim per wallet via `credit_claims`

Key routes:
- `GET /api/claim?address=...`
- `POST /api/claim`

### Phase 2 — Free Agent Credits

Live:
- Claimed holders receive Agentbot credits
- Credits attach to the user account
- Wallet address is stored against the user

Tier mapping:
- `Holder` → `50` credits
- `Builder` → `250` credits
- `Whale` → `1000` credits

### Phase 3 — Token-Gated Product Utility

Live:
- `/dashboard/community` shows reward status, perks, and holder state
- Claimed `Builder` and `Whale` holders unlock a baseFM guest pass
- `POST /api/basefm/streams` accepts either:
  - qualifying `$RAVE` balance, or
  - qualifying Agentbot community pass

### Phase 4 — Ops / Airdrop Readiness

Live:
- Admin export endpoint for verified holder claims
- CSV or JSON export available from `GET /api/community/export`

Export includes:
- `user_id`
- `wallet_address`
- `tier`
- `credits`
- `claimed_at`
- founding badge title when present

### Phase 5 — Founding Community Badge

Live:
- Claimed holders receive a `Founding Community` badge in Agentbot
- Badge creation is backfilled for older claims when the community program is loaded

Storage:
- `community_badges`

### Phase 6 — Governance

Live:
- Community proposals stored in `community_governance_proposals`
- Votes stored in `community_governance_votes`
- Claimed holders can vote from `/dashboard/community`
- Admins can create proposals from the same dashboard surface

Voting power:
- `Holder` → `1x`
- `Builder` → `3x`
- `Whale` → `10x`

## Notes

- Revenue distribution is intentionally not automated yet.
- The export and verified-holder registry now provide the safe operational foundation for any future airdrop or treasury workflow.
- Solana RPC outages degrade gracefully instead of breaking dashboard bootstrap or claim status.
