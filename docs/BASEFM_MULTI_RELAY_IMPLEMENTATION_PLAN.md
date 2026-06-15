# baseFM Multi-Relay Implementation Plan

## Goal

Support BaseFM as a first-party streaming product with:

- canonical playback on `agentbot.sh/basefm/live`
- reliable relay to `basefm.space`
- future multi-destination output
- YouTube-ready downstream publishing

This plan assumes:

- **Agentbot/baseFM first**
- all third-party destinations are downstream relays
- first-party state remains the source of truth

## Product Rules

1. `agentbot.sh/basefm/live` is the canonical playback surface.
2. `basefm.space` is a required downstream relay, not the source of truth.
3. YouTube and future destinations are optional downstream outputs.
4. Origin health and relay health must be modeled separately.
5. A stream is only fully healthy when:
   - origin ingest is healthy
   - first-party playback is healthy
   - required relays are healthy

## Current State

Current APIs cover:

- live-origin state via `GET /api/basefm/live`
- stream creation via `POST /api/basefm/streams`
- Mux-origin ingest and playback state
- naming fallback from `dj_sessions`

Current gap:

- no destination relay model
- no per-destination health
- no relay control surface
- no YouTube-specific output handling

## Target Model

### Streaming Layers

```text
origin ingest
  -> canonical live asset
  -> first-party playback (agentbot.sh/basefm/live)
  -> downstream relays
       -> basefm.space
       -> YouTube
       -> future RTMP / HLS consumers
```

### Health Layers

Track these separately:

1. **Origin health**
- ingest connected
- live asset active
- playback manifest healthy

2. **First-party playback health**
- HLS available
- player path healthy
- metadata/title present

3. **Relay health**
- destination connected
- destination receiving media
- last successful heartbeat
- failure reason if degraded

## Relay Health Model

Recommended per-destination states:

- `pending`
- `starting`
- `healthy`
- `degraded`
- `failed`
- `stopped`

Recommended tracked fields:

- `destinationKey`
- `destinationType`
- `required`
- `status`
- `lastHealthyAt`
- `lastErrorAt`
- `lastErrorCode`
- `lastErrorMessage`
- `viewerUrl`
- `ingestUrl`
- `streamKeyRef`

Recommended aggregate fields:

- `originStatus`
- `firstPartyPlaybackStatus`
- `requiredRelayStatus`
- `overallStatus`

Rules:

- if origin is down, overall is down
- if first-party playback is down, overall is down
- if a required relay is down, overall is degraded
- if an optional relay is down, overall can remain healthy with warning

## API Shape

### 1. Extend Live API

Current:

- `GET /api/basefm/live`

Add response shape:

```json
{
  "availability": "live",
  "origin": {
    "status": "active",
    "playbackId": "abc123",
    "hlsUrl": "https://stream.mux.com/abc123.m3u8"
  },
  "firstParty": {
    "status": "healthy",
    "pageUrl": "https://agentbot.sh/basefm/live"
  },
  "relays": [
    {
      "key": "basefm-space",
      "type": "hls-consumer",
      "required": true,
      "status": "healthy",
      "viewerUrl": "https://basefm.space"
    },
    {
      "key": "youtube-main",
      "type": "rtmp",
      "required": false,
      "status": "stopped",
      "viewerUrl": null
    }
  ],
  "overallStatus": "healthy"
}
```

### 2. Add Relay Status API

Add:

- `GET /api/basefm/relays`
- `GET /api/basefm/relays/[relayKey]`

Purpose:

- inspect per-destination status
- support dashboard polling
- provide debugging detail

### 3. Add Relay Control API

Add:

- `POST /api/basefm/relays`
- `PATCH /api/basefm/relays/[relayKey]`
- `POST /api/basefm/relays/[relayKey]/start`
- `POST /api/basefm/relays/[relayKey]/stop`
- `POST /api/basefm/relays/[relayKey]/probe`

Purpose:

- register destinations
- toggle required vs optional
- manually start/stop relays
- probe downstream health

### 4. Add Stream Distribution API

Add:

- `GET /api/basefm/distribution`

Purpose:

- return one view for origin + first-party + relay state
- drive dashboards and support tooling

## Suggested Data Model

Add a table such as:

### `basefm_relay_destinations`

Fields:

- `id`
- `key`
- `name`
- `type` (`hls-consumer`, `rtmp`, `youtube`, `custom`)
- `required`
- `enabled`
- `viewer_url`
- `ingest_url`
- `stream_key_encrypted`
- `created_at`
- `updated_at`

### `basefm_relay_status`

Fields:

- `id`
- `destination_id`
- `mux_stream_id`
- `status`
- `last_healthy_at`
- `last_error_at`
- `last_error_code`
- `last_error_message`
- `last_probe_at`
- `meta_json`

## Dashboard UI

Add a relay operations panel under:

- `/dashboard/dj-stream`
- optionally `/dashboard/streaming`

### Sections

1. **Origin**
- ingest status
- playback status
- playback ID
- HLS health

2. **First-Party Playback**
- `agentbot.sh/basefm/live`
- healthy / degraded / failed
- open page

3. **Relay Destinations**
- destination name
- type
- required/optional
- status
- last healthy
- last error
- action buttons

4. **Distribution Summary**
- overall stream health
- required relay health
- warning banner when first-party works but relay is failing

### Status UX

Use:

- green dot for healthy
- yellow dot for degraded
- red dot for failed
- zinc dot for stopped

## YouTube-Ready Stream Pipeline

### Principle

Do not redesign the whole pipeline around YouTube.
Add YouTube as a downstream relay destination.

### Expected Flow

```text
dj / ffmpeg ingest
  -> Mux origin
  -> canonical BaseFM playback
  -> optional RTMP relay worker
       -> YouTube RTMP endpoint
```

### Requirements

- store YouTube stream key securely
- allow per-destination enable/disable
- allow YouTube relay without affecting origin stream creation
- expose relay status separately from origin status

### Operational Rules

- YouTube relay failure must not kill first-party playback
- first-party playback health remains canonical
- YouTube should be optional by default
- YouTube health should be visible in the dashboard

### Implementation Notes

Likely path:

- use a relay worker or ffmpeg relay process from the canonical stream/output
- support RTMP destination config
- add restart / probe logic per destination

## Verification Plan

### Origin

1. create stream
2. connect ingest
3. verify Mux stream `active`
4. verify HLS manifest
5. verify `agentbot.sh/basefm/live`

### basefm.space Relay

1. verify relay destination is configured
2. verify destination status turns `healthy`
3. verify page/audio on `basefm.space`
4. verify failure mode appears if relay breaks

### YouTube Relay

1. add destination config
2. start relay
3. verify YouTube receives ingest
4. stop relay
5. confirm origin remains healthy throughout

## Suggested Delivery Order

### Phase 1

- write relay data model
- extend `GET /api/basefm/live`
- add `GET /api/basefm/distribution`
- add dashboard read-only relay panel

### Phase 2

- add relay destination CRUD
- add `basefm.space` as first required destination
- add health probes and last-error storage

### Phase 3

- add RTMP relay worker support
- add YouTube destination type
- add start/stop/probe controls

### Phase 4

- add alerts and support diagnostics
- add historical relay health tracking
- add auto-restart / fallback logic

## Anti-Slop Constraint

Do not implement this as:

- a pile of booleans with no status model
- a UI-only mock without backend truth
- a YouTube-specific hardcoded branch that bypasses first-party streaming

Implement it as:

- canonical first-party streaming
- explicit destination objects
- explicit per-destination health
- optional downstream expansion
