# Agentbot x402 + Soul Integration Status

**Date:** 2026-04-02  
**Status:** Current implementation audit  
**Priority:** High

## Live Service Map

- Borg / soul service: `https://borg-0-production.up.railway.app`
- x402 gateway: `https://x402-gateway-production.up.railway.app`
- Agentbot web root: `web/` on Vercel

## What Exists In Repo Today

### Implemented

- `web/app/dashboard/x402/page.tsx`
  - x402 dashboard surface exists.
- `web/app/api/x402/route.ts`
  - Proxies pricing, endpoint discovery, colony join, payment calls, and gateway health.
- `web/app/api/colony/status/route.ts`
  - Pulls live soul and colony state from Borg.
- `web/app/dashboard/colony/page.tsx`
  - Renders colony lineage, fitness, wallet balance, and soul indicators.
- `web/lib/x402-tempo.ts`
  - Contains Tempo/x402 client helpers and health checks.
- `web/.env.example`
  - Separates `X402_GATEWAY_URL` from `SOUL_SERVICE_URL`.

### Partially Implemented

- `web/app/api/agents/clone/route.ts`
  - Endpoint exists, but intentionally returns `501` so users are not charged for a non-functional clone flow.
- `web/lib/x402-tempo.ts`
  - Payment proof verification is structural only and does not perform full on-chain settlement verification.
- `web/app/api/x402/route.ts`
  - Has production fallbacks when gateway calls fail, which keeps UX alive but is not authoritative state.

### External Dependencies Already Live

- Borg / soul health is served by `borg-0-production`.
- x402 payment gateway health is served by `x402-gateway-production`.
- Agentbot already links these services in the dashboard and API layer.

## What Is Not Finished

### Clone Provisioning

- Real paid clone provisioning is still disabled.
- Missing pieces:
  - durable provisioning workflow after payment acceptance
  - authoritative wallet/payment settlement for clone creation
  - successful clone registration back into colony state

### Settlement Hardening

- `web/lib/x402-tempo.ts` still treats proof verification as a lightweight guard.
- End-to-end payment confirmation should move to gateway-verified or chain-verified settlement before clone creation is enabled.

### Operational Guarantees

- No explicit replay protection or persistence is documented for clone provisioning.
- No durable queue/workflow is wired here yet for long-running provisioning work.

## Current Backlog

### Next

- Keep clone API unavailable until the provisioning path is real.
- Replace fallback-only proof checks with authoritative payment verification.
- Define the clone lifecycle:
  - payment accepted
  - provisioning started
  - wallet/identity created
  - colony registration completed

### Later

- Dynamic pricing tied to live fitness once clone provisioning is real.
- Stronger gateway metrics and settlement reporting in Agentbot UI.

### Future / Research

- Local or federated planning models
- deeper soul/fitness economics
- autonomous pricing changes driven by colony outcomes

## Source Of Truth

Treat this file as the current status document, not a phase roadmap. The old "Phase 1 complete, Phase 2 next" framing is no longer accurate because parts of phases 2 and 3 already exist in production, while clone provisioning is still intentionally disabled.
