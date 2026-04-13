# Co-DJ / B2B Live Show Feature

> Two DJs. Two locations. One seamless session.

## Overview

The Co-DJ feature enables two DJs to share a single live stream — each playing their own audio tracks, coordinating handoffs, monitoring each other in real-time.

First implementation of this pattern for underground radio. Designed specifically for the rave, sound system, and DJ culture.

## How It Works

### The Mux Handoff (Core Mechanism)

Each Co-DJ show creates ONE Mux live stream with a 120-second reconnect window:

```
DJ1 streams RTMP → Mux → HLS → Listeners
         ↓
DJ1 fades out, stops encoder
         ↓
[120 second window — Mux holds stream open]
         ↓
DJ2 connects with SAME RTMP credentials
         ↓
Mux reconnects → stream continues → no interruption
```

Both DJs share the same RTMP URL + stream key. The 120s window gives DJ2 time to connect.

### WebRTC Audio Monitoring

While streaming, each DJ can hear the other through a browser-based audio feed:

- Supabase Realtime Broadcast handles WebRTC signaling (SDP offer/answer, ICE candidates)
- Audio-only peer connection (no video)
- Remote audio plays through browser `<audio>` element
- Used for coordination: DJ2 hears DJ1's last track, knows when to press play

### Chat

Three chat surfaces in one window:
- **DJ private** — host to co-DJ coordination (hidden from listeners)
- **Public listener** — standard chat, both DJs and listeners
- All via Supabase Realtime Broadcast (real-time, no polling)

## Flow

### Host DJ
1. Creates stream normally
2. Clicks "Start Co-Show" on stream control page
3. Gets invite URL → shares with co-DJ (DM, WhatsApp, whatever)
4. Sees both RTMP credentials, WebRTC monitoring, chat

### Co-DJ
1. Receives invite link: `https://basefm.space/co-show/{8-char-code}`
2. Connects wallet
3. Enters DJ name
4. Gets RTMP credentials → opens OBS/mixer → ready to take over

### Listeners
- See one stream, both DJ names shown
- Normal HLS playback (Mux)
- Public chat visible

## Tech Stack

- **Mux** — RTMP ingest, HLS delivery, reconnect_window: 120s
- **Supabase Realtime** — WebRTC signaling + chat broadcast
- **WebRTC** — browser audio monitoring (STUN: stun.l.google.com:19302)
- **Next.js** — studio UI pages
- **Wagmi** — wallet auth

## Database

Two tables in Supabase:

```sql
co_shows (
  id, stream_id, host_wallet, host_name,
  co_dj_wallet, co_dj_name,
  invite_code,  -- 8-char UUID prefix, unique
  status,       -- pending | active | ended
  mux_stream_key, mux_rtmp_url, mux_playback_id,
  created_at, updated_at, expires_at  -- 24h invite window
)

co_show_messages (
  id, co_show_id, sender_wallet, sender_name,
  content, message_type,  -- dj | listener
  created_at
)
```

## No New Dependencies

Built entirely on the existing stack. Zero new packages. Zero new paid services. Uses Mux and Supabase you already have.
