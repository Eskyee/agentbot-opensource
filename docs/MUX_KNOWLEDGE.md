# Mux API Knowledge for Atlas

This guide is the canonical reference for Atlas (Operator) when writing code or managing the Mux infrastructure for baseFM and RaveCulture.

## Core Credentials (Vaulted)
- **MUX_TOKEN_ID**: `69db8085-949e-4387-8e3e-cfa7d98d98f0`
- **MUX_TOKEN_SECRET**: `ITiEk7BVjPfZzEGa9Z3DkFV7z4pwffeTQ/OqmbK01gsrOeDcgRsQOBqd9dIWLkL3jbBlbM0Tkci`
- **Primary Live Stream ID**: `94f8c2d0-07eb-a785-26d5-cd14cca0dbd6` (Stream Key)

## CLI Quick Ref (`mux` via MCP or local)
| Task | Command |
| :--- | :--- |
| Create Asset | `mux assets create --input-url URL --wait --agent` |
| List Live Streams | `mux live-streams list --agent` |
| Create Live Stream | `mux live-streams create --agent` |
| Check Stream Health | `mux live-streams get {LIVE_STREAM_ID} --agent` |

## Resource Mapping
- **Asset ID**: For API ops (get/delete) via `api.mux.com`.
- **Playback ID**: For public streaming via `stream.mux.com`.
- **Stream Key**: For OBS/FFmpeg ingest (keep secret).

## Key Properties & Statuses
### Live Streams
- **Status**: `active` (broadcasting), `idle` (not broadcasting), `disabled`.
- **active_asset_id**: The ID of the asset currently being recorded.
- **recent_asset_ids**: Array of previous recording IDs.
- **reconnect_window**: Time (0-1800s) to wait before closing an asset after disconnect.

### Assets
- **Status**: `preparing`, `ready`, `errored`.
- **resolution_tier**: `720p`, `1080p`, `1440p`, `2160p`.
- **video_quality**: `basic`, `plus`, `premium`.

## Advanced Operations
- **Reset Stream Key**: `POST /video/v1/live-streams/{ID}/reset-stream-key`
- **Signal Complete**: `PUT /video/v1/live-streams/{ID}/complete`
- **AI Set Analysis**:
  ```typescript
  import { generateChapters, generateVideoEmbeddings } from "@mux/ai/workflows";
  // Chapters
  const result = await generateChapters(assetId, "en", { provider: "google" });
  // Embeddings (Semantic Search)
  const vibes = await generateVideoEmbeddings(assetId, { provider: "google" });
  // vibes.averagedEmbedding ready for vector DB
  ```

## Tactical Roadmap (Agentbot x Mux)
1. **Autonomous Archive**: Implement `video.asset.live_stream_completed` webhook.
2. **AI Set Analyst**: Use `@mux/ai` to generate Chapters and Summaries for recorded sets.
3. **Semantic Discovery**: Generate vibe-embeddings for semantic set search.
4. **Simulated Live**: Loop archives for 24/7 station uptime.
5. **Digital Wristbands**: Secure streams via Signed JWTs.
6. **Agent-DJ Controller**: Full skill for agents to manage their own keys.

## Frontend Cost Levers (Next Sprint)
- **Resolution Capping**: Default player to `max_resolution=720p` via query param.
- **Viewport Pause**: Implement `visibilitychange` listener to pause player when tab is inactive.
- **Idle Timeout**: Add "Are you still watching?" popup after 30 mins of no interaction.
- **Lazy Loading**: Use `@mux/mux-player-react` with lazy loading for all archive embeds.

## API Constraints & Limits
- **Rate Limits (Video API)**: 
  - `POST` requests: 1 per second sustained.
  - `GET/PUT/PATCH/DELETE`: 5 per second sustained.
- **Pagination**: 
  - Standard: `page` and `limit` (max 100).
  - Advanced: Use `next_cursor` for large collections (e.g., listing 1000+ assets).
- **Security**: 
  - NO CORS: Mux API rejects browser-side calls. All calls MUST be made via `muxClient` in server-side routes.

## Ingest Configuration (RTMP/RTMPS)
| Server URL | Use Case |
| :--- | :--- |
| `rtmps://global-live.mux.com:443/app` | Secure (Recommended for OBS/Agents) |
| `rtmp://global-live.mux.com:5222/app` | Standard (Compatible with most tools) |

## Latency Modes
- **`latency_mode: "low"`**: ~5s glass-to-glass. Best for interactive sets.
- **`latency_mode: "reduced"`**: ~10-15s glass-to-glass. Good balance.
- **Standard**: ~30s. Most stable for high-load.

## Webhook Events (Monitor in Dashboard)
- `video.live_stream.connected`: Handshake successful.
- `video.live_stream.active`: Stream is playable.
- `video.live_stream.disconnected`: Ingest dropped.
- `video.live_stream.recording`: VOD is being created.

## Implementation Standards (Architecture Locked)
1. **Library**: Use `@mux/mux-node` in `web/lib/mux.ts`.
2. **Defaults**: `playback_policy: ["public"]`, `video_quality: "basic"`.
3. **Validation**: Always check `status === "ready"` before providing playback URLs.
4. **Security**: NEVER expose Token Secret or Stream Keys in frontend code. Use server-side proxy/API routes.

## The "Agent-DJ" Protocol
To allow an agent to stream:
1. Create a temporary Live Stream ID via `mux live-streams create`.
2. Hand off the `stream_key` to the agent's environment.
3. Monitor `status` via `mux live-streams get`.
4. Once `disconnected`, fetch the `recent_asset_ids` to archive the set.

---
*Last Updated: 2026-03-12 | Operator: Atlas*
