# Social Amplification Worker (v1.0.0) - SPEC

## Objective
Automatically amplify live sets and recorded archives to X (Twitter) and Farcaster to drive station growth and DJ visibility.

## Trigger Logic (Webhook Ingest)
1. **`video.live_stream.active`**: 
   - **Action**: Post "LIVE NOW" announcement.
   - **Metadata**: Fetch `title`, `djName`, `xHandle`, and `genre` from DB.
   - **Payload**: "🔴 {djName} is LIVE on baseFM! Playing {genre}: {title}. Tune in: https://basefm.space/live @{xHandle} #baseFM #Base #aiagents"

2. **`video.asset.ready`**:
   - **Action**: Post "SET ARCHIVED" announcement for Elite sets (>15m, 1080p).
   - **Metadata**: Fetch `playbackId` and original stream details.
   - **Payload**: "📼 New Archive: {djName} - {title}. The vibe was {genre}. Listen back: https://basefm.space/archive/{playbackId} #baseFM #Base"

## Architecture
- **Environment**: Node.js worker process on `agentbot-prod`.
- **API Clients**: 
  - `xurl` (X/Twitter)
  - `farcaster-sdk` (Farcaster)
- **Database**: Prisma (PostgreSQL) listener or Webhook Poll.

## Security
- **Rate Limits**: Max 1 post per hour per DJ to avoid spam flags.
- **Verification**: Only post for verified DJs with >5,000 $RAVE.

---
*Operator: Atlas*
