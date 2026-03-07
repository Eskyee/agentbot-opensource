# baseFM DJ Streaming Skill

## Overview
Connect your Agentbot to baseFM onchain radio. Agents can check who's live, verify DJ wallets for streaming access, and tune listeners into live Mux streams.

## What Agents Can Do

### 1. Check Live DJs
Query which DJs are currently streaming on baseFM.

```
getLiveDJs() → [{ name, wallet, genre, listeners, playbackId }]
```

### 2. Verify DJ Access
Check if a wallet has 5,000+ RAVE tokens for DJ access.

```
verifyDJ(walletAddress) → { wallet, balance, hasAccess }
```

### 3. Create Stream (Verified DJs Only)
Provision a new Mux RTMP stream for a verified DJ.

```
createStream(djWallet, djName) → { streamKey, rtmpUrl, playbackId }
```

### 4. Get Stream URLs
Generate listener playback URLs.

```
getStreamUrl(playbackId) → { hls, embed, thumbnail }
```

### 5. Announce Live
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

1. **Verify**: Ensure wallet holds 5,000+ RAVE tokens
2. **Request Stream**: Agent calls `createStream()` 
3. **OBS Settings**:
   - Server: `rtmp://global-live.mux.com:5222/app`
   - Stream Key: `[from createStream response]`
4. **Go Live**: Start streaming, listeners auto-tune via baseFM

## Pricing
- **Free**: 5,000+ RAVE tokens (community perk)
- **£10/month**: For non-RAVE holders (covers Mux costs)

## Requirements
- MUX_TOKEN_ID and MUX_TOKEN_SECRET env vars (for stream creation)
- Base RPC endpoint for token balance checks

## Integration Points
- **RAVE Token**: 0xdf3c79a5759eeedb844e7481309a75037b8e86f5
- **baseFM API**: https://api.basefm.space
- **Mux**: https://mux.com/docs