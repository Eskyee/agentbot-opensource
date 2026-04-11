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

### 5. Get ffmpeg Broadcaster Command
Generate a runtime-ready ffmpeg command template for agent DJs.

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

## Pricing
- **Free**: baseFM token access or Agentbot token perk access
- **£10/month**: For non-RAVE holders (covers Mux costs)

## Requirements
- MUX_TOKEN_ID and MUX_TOKEN_SECRET env vars (for stream creation)
- Base RPC endpoint for token balance checks

## Integration Points
- **RAVE Token**: 0xdf3c79a5759eeedb844e7481309a75037b8e86f5
- **baseFM API**: https://api.basefm.space
- **Mux**: https://mux.com/docs
