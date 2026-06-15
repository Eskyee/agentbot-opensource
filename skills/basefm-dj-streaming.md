# baseFM DJ Streaming Skill

## Overview
Connect your Agentbot to baseFM onchain radio. Agents can check who's live, create streams, generate ffmpeg broadcaster commands, and tune listeners into the live BaseFM player.

## What Agents Can Do

### 1. Check Live DJs
Query which DJs are currently streaming on baseFM.

```
getLiveDJs() → [{ name, wallet, genre, listeners, playbackId }]
```

### 2. Verify DJ Access
Check if a wallet has DJ access. That can come from the baseFM token on Base or the Agentbot token perks flow.

```
verifyDJ(walletAddress) → { wallet, balance, hasAccess }
```

### 3. Create Stream (Verified DJs Only)
Provision a new Mux RTMP stream for a verified DJ and receive RTMP plus ffmpeg broadcaster details.

```
createStream(djWallet, djName) → { streamKey, rtmpUrl, playbackId, ffmpeg }
```

### 4. Get Stream URLs
Generate listener playback URLs.

```
getStreamUrl(playbackId) → { hls, embed, thumbnail }
```

### 4b. Manage Replay Assets
Use the Mux Assets API when you need to inspect, keep, or delete replay assets after a set ends.

```
https://www.mux.com/docs/api-reference/video/assets
```

### 5. Get ffmpeg Broadcaster Command
Generate a runtime-ready ffmpeg command template for agent DJs using the default baseFM artwork image and a silent audio bed.

```
getFfmpegCommand(fullRtmpUrl) → "ffmpeg ..."
```

### 6. Announce Live
Format a live announcement for the agent to post.

```
formatLiveAnnouncement(djName, genre, listeners) → { title, message, actions }
```

## Usage Examples

**"Who's playing on baseFM right now?"**
```javascript
const djs = await getLiveDJs();
// Returns: [{ name: "DJ X", genre: "Techno", listeners: 42, ... }]
```

**"Can wallet 0x123... become a DJ?"**
```javascript
const verification = await verifyDJ("0x123...");
// Returns: { hasAccess: true, balance: "7500000000000000000000" }
```

**"DJ wallet 0xabc is going live as DJ Snake"**
```javascript
const stream = await createStream("0xabc", "DJ Snake");
// Returns: { streamKey: "abc123", rtmpUrl: "rtmp://global-live.mux.com:5222/app/abc123" }
```

## DJ Setup Instructions

1. **Verify**: Ensure the wallet is eligible through the baseFM token or Agentbot token perks
2. **Request Stream**: Agent calls `createStream()` 
3. **Broadcast**:
   - Use the returned `ffmpeg` command in the runtime, or
   - Use OBS manually with the returned RTMP target
4. **OBS Settings**:
   - Server: `rtmp://global-live.mux.com:5222/app`
   - Stream Key: `[from createStream response]`
5. **Go Live**: Start streaming, listeners auto-tune via the BaseFM live player

Default visual:
- `https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje`

## Operational Lessons

### Treat HLS as the real playback source

When verifying playback, prefer the HLS URL:

```
https://stream.mux.com/<playbackId>.m3u8
```

Do not rely on the Mux hosted `.html` page as the only proof of playback. The hosted wrapper can fail or lag while the HLS stream itself is healthy.

### `created` is not `live`

A successful stream-creation response only means:
- stream object exists
- stream key exists
- playback ID exists

It does not mean the stream is already on air.

To count as live, verify:
- Mux live stream `status: active`
- `connected: true`
- an active asset exists

### If ingest keeps dropping, normalize the source media first

For long DJ sets and archived MP3s, clean the source before trying to stream it live.

Observed working pattern:
1. Convert the source to clean AAC audio
2. Feed the cleaned file into ffmpeg
3. Use the BaseFM app-created RTMP key, not an ad hoc raw Mux test stream

This matters because messy source containers can create short-lived assets or broken-pipe failures even when the RTMP target is correct.

### Use fresh app-created streams when an older key gets weird

If repeated reconnects on an older stream key stay `idle`, mint a fresh stream through:

```
POST /api/basefm/streams
```

That is usually faster and safer than repeatedly trying to resurrect a poisoned live stream endpoint.

### Agentbot token path is first-class

The community pass path should not be treated as a side note.

If the user is eligible through the Agentbot Builder/Whale claim flow:
- the claimed wallet is the actual stream wallet
- the UI should show that clearly
- stream creation should post that wallet back to `/api/basefm/streams`

### Naming fallback

If Mux live metadata is thin, the current set title should come from the session row (`dj_sessions`) using `mux_stream_id` as the join key.

That prevents active streams from falling back to `Anonymous DJ` when the session already has the right title.

## Pricing
- **Free**: baseFM token access or Agentbot token perk access
- **£10/month**: For non-RAVE holders (covers Mux costs)
- **Replay retention**: Paid archive storage, not a free default

## Requirements
- MUX_TOKEN_ID and MUX_TOKEN_SECRET env vars (for stream creation)
- Base RPC endpoint for token balance checks

## Integration Points
- **RAVE Token**: 0xdf3c79a5759eeedb844e7481309a75037b8e86f5
- **baseFM API**: https://api.basefm.space
- **Mux**: https://mux.com/docs
- **Mux Assets API**: https://www.mux.com/docs/api-reference/video/assets
