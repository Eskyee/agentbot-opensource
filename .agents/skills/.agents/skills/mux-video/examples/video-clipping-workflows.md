# Video Clipping Workflow Examples

Practical examples showing common clipping workflows: creating highlight clips from live streams, trimming pre/post-roll from recordings, and building a clip creation interface.

## Overview

Mux provides two distinct approaches to video clipping:

| Feature | Instant Clipping | Asset-Based Clipping |
|---------|------------------|---------------------|
| Availability | Immediate | Requires encoding time |
| Cost | No additional encoding cost | Standard encoding fees |
| Accuracy | Segment-level (may vary by seconds) | Frame-accurate |
| Output | Trimmed HLS manifest | New standalone asset |
| MP4 Support | No | Yes |
| Master Access | No | Yes |

## Instant Clipping Workflows

Instant clipping trims HLS manifests without re-encoding, making clips available immediately at no extra cost.

### Workflow 1: Creating Highlight Clips from Live Streams

Create short highlight clips from live events using Program Date Time (PDT) timestamps.

**Use case**: Extract a 60-second highlight (e.g., a goal, key moment) from an ongoing live stream.

```
# Basic format with epoch timestamps
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=${EPOCH_TIME}&program_end_time=${EPOCH_TIME}

# Example: 60-second clip starting at Feb 12, 2024 11:00:00 UTC
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?program_start_time=1707740400&program_end_time=1707740460
```

**Important timing considerations**:
- PDT timestamps are in UTC (not Pacific Daylight Time)
- There is a delay (up to 15 seconds depending on `latency_mode`) between wall-clock time and when a timestamp can be used
- Clips may be several seconds longer than requested due to segment-level accuracy

**Generate a thumbnail for the highlight**:

```
# Using program_time parameter with epoch timestamp
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/thumbnail.png?program_time=1707740430
```

**Generate a storyboard for the clip**:

```
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.png?program_start_time=1707740400&program_end_time=1707740460
```

### Workflow 2: Pre-Live Stream Trimming

Prevent viewers from seeking back into test content before your live stream officially starts.

**Use case**: You connected your encoder at 12:45 PM for testing, but want the stream to appear as if it started at 1:00 PM.

```
# Set the visible start time to 1:00 PM UTC (1707742800 epoch)
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=1707742800
```

When used on a live stream with DVR mode enabled, this prevents viewers from seeking back before the specified time.

### Workflow 3: Trimming Pre/Post-Roll from VOD Assets

For assets (whether uploaded or from live stream recordings), use relative time parameters.

**Use case**: Remove the first 30 seconds of pre-roll and last 45 seconds of post-roll from a recording.

```
# Assuming a 60-minute (3600 second) recording
# Start at 30 seconds, end at 3555 seconds (3600 - 45)
https://stream.mux.com/${PLAYBACK_ID}.m3u8?asset_start_time=30&asset_end_time=3555
```

**Create a specific segment clip**:

```
# Extract a 10-second clip from 0:00:10 to 0:00:20
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?asset_start_time=10&asset_end_time=20
```

**Supporting images**:

```
# Thumbnail at a specific time within the clip
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/thumbnail.png?time=15

# Storyboard for the clipped region
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.png?asset_start_time=10&asset_end_time=20
```

### Workflow 4: Multiple Events from Single Live Stream

Split a single live stream containing multiple events into separate on-demand clips.

**Use case**: A sports broadcast contains Game 1 (1:00 PM - 2:30 PM) and Game 2 (3:00 PM - 4:30 PM).

```
# Game 1 clip
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=1707742800&program_end_time=1707748200

# Game 2 clip
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=1707750000&program_end_time=1707755400
```

### Integrating Instant Clips with Mux Player

**Public Playback IDs with extra source params**:

```html
<!-- VOD asset instant clip -->
<mux-player
  playback-id="sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq"
  extra-source-params="asset_start_time=10&asset_end_time=20"
  metadata-video-title="Highlight Clip"
  storyboard-src="https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.vtt?format=webp&asset_start_time=10&asset_end_time=20"
></mux-player>

<!-- Live stream instant clip -->
<mux-player
  playback-id="sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq"
  extra-source-params="program_start_time=1707740400&program_end_time=1707740460"
  metadata-video-title="Live Highlight"
  storyboard-src="https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.vtt?format=webp&program_start_time=1707740400&program_end_time=1707740460"
></mux-player>
```

**Signed URLs** (recommended for production):

Include clipping parameters as JWT claims when generating tokens:

```html
<mux-player
  playback-id="s6oiUXJ6W1JH02D9ThJZQtyg74ubYTiT7"
  playback-token="${PLAYBACK_TOKEN}"
  storyboard-token="${STORYBOARD_TOKEN}"
  thumbnail-token="${THUMBNAIL_TOKEN}"
  metadata-video-title="Instant clipping demo (Signed)"
></mux-player>
```

JWT claims for tokens should include:
- Playback token: `asset_start_time`, `asset_end_time` (or `program_start_time`, `program_end_time`)
- Storyboard token: Same as playback token
- Thumbnail token: `program_time` for live streams, `time` for VOD

## Asset-Based Clipping Workflows

Asset-based clipping creates a new, independent asset with frame-accurate trimming.

### Workflow 5: Creating a Polished VOD from Live Recording

Create a trimmed version of a live stream recording for on-demand replay.

**Use case**: Remove pre-show setup (first 5 minutes) and post-show idle time (last 3 minutes) from a live event recording.

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
        "inputs": [
          {
            "url": "mux://assets/01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6",
            "start_time": 300.0,
            "end_time": 3420.0
          }
        ],
        "playback_policies": [
          "public"
        ]
      }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

### Workflow 6: Creating Preview Clips

Generate short preview clips to promote your content.

**Use case**: Create a 30-second teaser from the best moment of a video.

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
        "inputs": [
          {
            "url": "mux://assets/01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6",
            "start_time": 125.5,
            "end_time": 155.5
          }
        ],
        "playback_policies": [
          "public"
        ],
        "video_quality": "basic"
      }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Response**:

```json
{
  "data": {
    "status": "preparing",
    "playback_ids": [
      {
        "policy": "public",
        "id": "TXjw00EgPBPS6acv7gBUEJ14PEr5XNWOe"
      }
    ],
    "mp4_support": "none",
    "master_access": "none",
    "id": "kcP3wS3pKcEPywS5zjJk7Q1Clu99SS1O",
    "created_at": "1607876845",
    "video_quality": "basic",
    "source_asset_id": "01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6"
  }
}
```

### Workflow 7: Clipping from Active Live Stream

Create clips from an ongoing broadcast.

**Use case**: Clip a highlight while the live stream is still active.

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
        "inputs": [
          {
            "url": "mux://assets/${ACTIVE_ASSET_ID}",
            "start_time": 1800.0,
            "end_time": 1830.0
          }
        ],
        "playback_policies": [
          "public"
        ]
      }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Important**: Always provide an `end_time` when clipping from active assets, as the default is the current end of the asset (which is still growing).

### Workflow 8: Handling Clip Ready Status

Wait for the clip to be ready before playback.

**Using webhooks** (recommended):

Listen for the `video.asset.ready` webhook event.

**Using polling** (low volume only):

```bash
# Poll the asset status (no more than once per second)
curl https://api.mux.com/video/v1/assets/${ASSET_ID} \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Play the clip once ready**:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

## Choosing the Right Approach

### Use Instant Clipping When:

- Clips must be available immediately
- You want to avoid additional encoding costs
- You need to limit content availability for pre-live workflows
- Segment-level accuracy is acceptable

### Use Asset-Based Clipping When:

- Frame-accurate trimming is required
- You need downloadable MP4 files
- You need access to the clipped master for offline editing
- The clip will be a permanent part of your content library

## Security Considerations

For instant clipping, strongly consider using signed URLs. Without signed URLs, users can manipulate the manifest playback URL to expose content outside your intended clip boundaries.

## Quick Reference

### Instant Clipping Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `program_start_time` | Epoch (seconds) | Start time for live streams |
| `program_end_time` | Epoch (seconds) | End time for live streams |
| `asset_start_time` | Relative (seconds) | Start time for VOD assets |
| `asset_end_time` | Relative (seconds) | End time for VOD assets |

### Asset Clipping Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | String | `mux://assets/{asset_id}` format |
| `start_time` | Float (seconds) | Offset from beginning (default: 0) |
| `end_time` | Float (seconds) | Offset from beginning (default: duration) |

### Constraints

- Minimum clip duration: 500 milliseconds
- Unlimited clips can be created from a single source asset
- Text tracks (captions/subtitles) are automatically trimmed to match clip boundaries
- Watermarks are copied from source asset to clips
