# Agentbot vs baseFM Stream Architecture

## Goal

Compare the current streaming responsibilities across:

- `agentbot`
- `baseFM`

Then decide what should:

- stay separate
- be ported
- be centralized

## Current Reality

### Agentbot currently owns

- managed DJ stream control
- token-gated stream creation flow
- Mux live stream creation for the managed DJ path
- `basefm/live` station surface inside Agentbot
- relay/distribution model
- relay health tracking
- Mux fallback pickup and stop-broadcast flow
- operator-focused diagnostics

Key files:

- `web/app/api/basefm/live/route.ts`
- `web/app/api/basefm/streams/route.ts`
- `web/app/api/basefm/streams/status/route.ts`
- `web/app/api/basefm/distribution/route.ts`
- `web/app/api/basefm/relays/*`
- `web/app/dashboard/dj-stream/page.tsx`
- `web/app/components/basefm/*`

### baseFM currently owns

- dedicated stream-domain model
- dedicated stream lifecycle APIs
- Mux setup/status patterns for stream records
- public station/player product
- Mux webhook handling in its own domain
- stream admin cleanup routes

Key files:

- `app/api/streams/live/route.ts`
- `app/api/streams/[id]/check-status/route.ts`
- `app/api/streams/[id]/setup-mux/route.ts`
- `app/api/admin/clear-streams/route.ts`
- `app/api/webhooks/mux/route.ts`
- `components/GlobalPlayer.tsx`

## Where Agentbot Is Stronger

Agentbot currently has the stronger:

- operator runtime diagnostics
- relay/distribution modeling
- station correctness protections
- stream pickup fallback
- managed runtime / DJ dashboard control path
- first-party vs downstream relay distinction

This is good for:

- managed cloud control
- DJ operations
- “ours first” station architecture

## Where baseFM Is Stronger

baseFM currently has the stronger:

- dedicated stream-domain separation
- stream-specific CRUD/status endpoints
- stream-native public player/product surface
- admin cleanup conventions
- public-consumer-facing radio-site focus

This is good for:

- listener product
- station-native UX
- public radio identity

## Recommendation

### Do not duplicate forever

Right now both repos contain stream logic.

That is workable short term, but it will drift.

### Best split

#### Agentbot should own

- DJ/operator control
- stream creation requests from managed agents/DJs
- token-gated access and wallet-aware stream launch
- runtime/relay diagnostics
- first-party control plane
- “managed cloud” streaming operations

#### baseFM should own

- public station/listener product
- station-native player experience
- public stream listings
- public stream pages and discovery
- public radio branding

### Source of truth recommendation

Pick one source of truth for each concern:

#### Stream creation / control source of truth

Recommended:

- `agentbot`

Why:

- it already owns the DJ managed control path
- it already has wallet + claim + relay + runtime context

#### Public station playback source of truth

Recommended:

- `baseFM`

Why:

- it is the dedicated public listener product
- it already has richer player/station domain primitives

#### Mux live status source of truth

Recommended:

- shared conceptual truth: Mux
- app-level operational truth should be normalized in one service layer

## What To Port From baseFM Into Agentbot

Port or emulate:

- stream check-status pattern
- clearer stream-domain CRUD/status separation
- explicit admin cleanup tooling
- stronger public-player state distinctions

## What To Port From Agentbot Into baseFM

Port or emulate:

- relay/distribution modeling
- required vs optional relay logic
- first-party canonical playback rule
- Mux fallback pickup
- stale-live reconciliation
- richer operator diagnostics

## Best Medium-Term Architecture

### Option A: Shared service layer

Create one shared stream service library used by both repos.

Good for:

- consistency
- less drift

Costs:

- more coordination
- packaging/shared versioning

### Option B: Agentbot as control plane, baseFM as presentation layer

Recommended near-term.

Pattern:

- Agentbot creates and manages streams
- Agentbot exposes normalized station/distribution state
- baseFM consumes that normalized state for public playback and discovery

Good for:

- clear product boundaries
- less duplication
- keeps “ours first” control in Agentbot
- keeps listener-facing radio UX in baseFM

## Concrete Next Steps

### Phase 1

- keep Agentbot as stream-control source of truth
- keep baseFM as public listener surface
- document normalized stream payload shape

### Phase 2

- make baseFM consume Agentbot’s normalized station/distribution status
- or expose a dedicated shared endpoint for station consumption

### Phase 3

- remove duplicate stale-stream cleanup logic from whichever repo becomes secondary
- centralize Mux lifecycle normalization

## Proposed Normalized Stream Payload

Both repos should agree on a shape like:

```json
{
  "primaryStream": {
    "id": "mux-stream-id",
    "name": "DJ Escaba",
    "playbackId": "playback-id",
    "hlsUrl": "https://stream.mux.com/abc.m3u8",
    "status": "active"
  },
  "distribution": {
    "firstParty": { "status": "healthy" },
    "relays": [
      { "key": "basefm-space", "status": "healthy", "required": true },
      { "key": "youtube-main", "status": "pending", "required": false }
    ]
  }
}
```

## Decision

Recommended decision:

- **Agentbot = stream control plane**
- **baseFM = listener-facing station**

That is the cleanest current split.
