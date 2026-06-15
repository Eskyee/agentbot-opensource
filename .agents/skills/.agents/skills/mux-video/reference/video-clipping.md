# Video Clipping

Comprehensive guide to creating video clips with Mux. Mux provides two approaches for creating clips from your video content: **Instant Clipping** and **Asset-Based Clipping**. Each method is designed for different use cases, offering flexibility depending on your needs for speed, accuracy, and workflow.

## Overview: Choosing the Right Approach

| Feature | Instant Clipping | Asset-Based Clipping |
|---------|-----------------|---------------------|
| Availability | Immediate | Requires processing |
| Frame Accuracy | Segment-level only | Frame-accurate |
| Additional Encoding Cost | No | Yes |
| Additional Storage Cost | No | Yes |
| Watermark Support | No | Yes |
| Text Track Support | No | Yes |
| Downloadable MP4s | No | Yes |
| Live Stream Support | Yes | Yes (recordings) |
| Unique Playback ID | No | Yes |

### When to Use Instant Clipping

- You need clips to be available immediately
- You want to avoid extra encoding costs
- Segment-level accuracy is sufficient for your use case (e.g., live highlights, quick previews)
- You want to limit playback to a specific range without creating a new asset
- You need to pre-emptively limit content availability for pre-live workflows

### When to Use Asset-Based Clipping

- You require frame-accurate clips
- You need a new asset for distribution, download, or further processing
- You want to add watermarks or preserve text tracks in the clip
- You require trimmed MP4s or masters
- You are willing to wait for processing and incur encoding/storage costs

---

## Instant Clipping

Instant clipping allows you to set the start and end times of the streaming URL to make clips that are instantly available without the wait time or expense of a new asset being created. This is controlled by passing playback modifiers (query string arguments or JWT claims) to the playback URL.

### How Instant Clipping Works

Instant clipping works by trimming the HLS manifests without re-encoding any segments. This means that instant clipping operates at the segment level of accuracy, so clips may be several seconds longer than requested. The content always includes the timestamps you request, but may start a few seconds earlier and end a few seconds later. The exact accuracy depends on the latency settings of the live stream.

### Use Cases

#### Pre-live Workflows

When you have DVR mode turned on for your stream, you can use instant clipping to specify a start time that prevents viewers from seeking back into pre-broadcast content (e.g., "testing, testing, 1... 2... 3..."). You can also specify an end time to trim extra content at the end of live events.

#### Post-live Trimming Without Re-encoding

For any asset generated from a live stream, you can specify the start and end times of the content directly during playback without time-consuming and costly re-processing. For example, if you broadcast multiple sports events back-to-back on a single live stream, you can use instant clipping to generate instant on-demand streams of each match as it ends for no extra cost.

#### Highlight Clips

Pull out short clips from a currently active asset for promoting on your homepage or embedding into news articles. For example, instantly show just the 90th-minute equalizer goal on your home page while having extra time and penalties to watch live.

### Creating Instant Clip URLs

#### Live Stream Instant Clips

For live streams, clips use Program Date Time (PDT) timestamps - epoch times that represent when Mux received the source video from the contribution encoder.

**Note:** PDT has nothing to do with the Pacific Daylight time zone; all times are represented in UTC or with unix timestamps.

##### Using `program_start_time`

Sets the start time of content within the live stream or asset:

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=${EPOCH_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?program_start_time=1707740400
```

When used on a live stream, this causes the live stream to behave as if it is idle prior to this time.

##### Using `program_end_time`

Sets the end time of content within the live stream or asset:

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_end_time=${EPOCH_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?program_end_time=1707740460
```

When used on a live stream, this causes the live stream to behave as if it is idle after this time.

##### Combining Both Parameters

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?program_start_time=${EPOCH_TIME}&program_end_time=${EPOCH_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?program_start_time=1707740400&program_end_time=1707740460
```

**Important:** There is a delay from wall-clock time to when you can use a given timestamp as a `program_start_time`. If a "Go Live" button is pressed at 13:00 UTC, expect requests for the manifest to respond with HTTP 412 for up to 15 seconds after (depending on the `latency_mode`).

#### VOD Instant Clips

For VOD assets (whether from live streams or uploaded), use relative time markers based on the beginning of the asset.

##### Using `asset_start_time`

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?asset_start_time=${RELATIVE_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?asset_start_time=10
```

##### Using `asset_end_time`

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?asset_end_time=${RELATIVE_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?asset_end_time=20
```

##### Combining Both Parameters

Specifying a range of `10` - `20` results in a 10 second clip between `0:00:10` and `0:00:20`:

```
# Format
https://stream.mux.com/${PLAYBACK_ID}.m3u8?asset_start_time=${RELATIVE_TIME}&asset_end_time=${RELATIVE_TIME}

# Example
https://stream.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq.m3u8?asset_start_time=10&asset_end_time=20
```

### Thumbnail and Storyboard Support

#### Images for VOD Assets

Use the `time` query parameter to retrieve an image:

```
# Format
https://image.mux.com/${PLAYBACK_ID}/thumbnail.png?time=${RELATIVE_TIME}

# Example
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/thumbnail.png?time=15
```

Storyboards support the clipping parameters:

```
# Format
https://image.mux.com/${PLAYBACK_ID}/storyboard.png?asset_start_time=${RELATIVE_TIME}&asset_end_time=${RELATIVE_TIME}

# Example
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.png?asset_start_time=10&asset_end_time=20
```

#### Images for Live Streams

Use `program_time` for thumbnails:

```
# Format
https://image.mux.com/${PLAYBACK_ID}/thumbnail.png?program_time=${EPOCH_TIME}

# Example
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/thumbnail.png?program_time=1707740460
```

For storyboards, use the same playback modifiers:

```
# Format
https://image.mux.com/${PLAYBACK_ID}/storyboard.png?program_start_time=${EPOCH_TIME}&program_end_time=${EPOCH_TIME}

# Example
https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.png?program_start_time=1707740400&program_end_time=1707740460
```

### Using Instant Clipping with Mux Player

#### With Public Playback IDs (via extra source params)

For VOD assets:

```html
<mux-player
  playback-id="sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq"
  extra-source-params="asset_start_time=10&asset_end_time=20"
  metadata-video-title="Instant clipping demo (Public)"
  storyboard-src="https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.vtt?format=webp&asset_start_time=10&asset_end_time=20"
></mux-player>
```

For live streams:

```html
<mux-player
  playback-id="sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq"
  extra-source-params="program_start_time=1707740400&program_end_time=1707740460"
  metadata-video-title="Instant clipping demo (Public)"
  storyboard-src="https://image.mux.com/sp9WNcgcktsmlvFLKgNm3jjSGRD00RPlq/storyboard.vtt?format=webp&program_start_time=1707740400&program_end_time=1707740460"
></mux-player>
```

**Note:** This feature requires mux-player 2.3.0 or later.

#### With Signed URLs

Include the clipping parameters as claims inside the respective JWTs:

- For playback and storyboard tokens: `asset_start_time`, `asset_end_time`, `program_start_time`, `program_end_time`
- For thumbnail token: `program_time`

```html
<mux-player
  playback-id="s6oiUXJ6W1JH02D9ThJZQtyg74ubYTiT7"
  playback-token="${PLAYBACK_TOKEN}"
  storyboard-token="${STORYBOARD_TOKEN}"
  thumbnail-token="${THUMBNAIL_TOKEN}"
  metadata-video-title="Instant clipping demo (Signed)"
></mux-player>
```

### Security Considerations

We strongly recommend using instant clipping alongside signed URLs. When using this feature without signed URLs, users can manipulate the manifest playback URL to expose parts of the media you want to keep hidden.

---

## Asset-Based Clipping

Asset-based clipping creates a new, standalone asset from a portion of an existing video or live stream recording. This involves a re-encoding process, resulting in a new asset with its own playback ID.

### Creating an Asset-Based Clip

Create a clip by making a POST request to the `/video/v1/assets` endpoint with clipping parameters:

- `url`: Use the format `mux://assets/{asset_id}` where `asset_id` is the source Asset Identifier
- `start_time`: Time offset in seconds from the beginning of the video (defaults to 0)
- `end_time`: Time offset in seconds from the beginning of the video (defaults to asset duration)

#### Example Request

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
        "inputs": [
          {
            "url": "mux://assets/01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6",
            "start_time": 10.0,
            "end_time": 51.10
          }
        ],
        "playback_policies": [
          "public"
        ],
        "video_quality" : "basic"
      }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

#### Example Response

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
    "video_quality" : "basic",
    "source_asset_id": "01itgOBvgjAbES7Inwvu4kEBtsQ44HFL6"
  }
}
```

**Response fields:**
- **Asset ID** (`id`): Used to manage assets via `api.mux.com` (read or delete)
- **Playback ID** (`playback_ids[].id`): Used to stream the asset through `stream.mux.com`
- **source_asset_id**: The source video or live stream recording asset; useful for associating clips with the source video in your CMS

### Waiting for the "Ready" Event

When the clip is ready for playback, the asset status changes to "ready".

**Recommended approach:** Use webhooks. Mux sends a webhook notification as soon as the asset is ready.

**Alternative:** Poll the asset API to check status (only works at low volume, do not poll more than once per second).

### Playing the Clip

Create a playback URL using the Playback ID:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

---

## Asset-Based Clipping FAQs

### How many clips can be created from a single source asset?

Unlimited. Mux creates a new asset for each clip, so there is no limit to how many clips you can create.

### Is there a cost to create clips?

Yes. Each clip is a new asset and is considered an on-demand video. On-Demand video pricing applies, including Encoding, Storage, and Delivery usage.

### Can I use basic video quality on clips?

Yes. Clips can be created as either `basic` or `plus`.

### Can I create clips when adding new video files?

No. Mux only allows creating clips from existing videos in your account. The clipping parameters (`start_time` and `end_time`) are only applicable when `input.url` uses the `mux://assets/{asset_id}` format.

### Can I create clips from live streams?

Yes. Mux supports creating clips from the active asset being generated by a live stream while broadcasting. When clipping during an active broadcast:

- The active asset is still growing
- If you do not provide `end_time`, it defaults to the end of the asset at the time of creation
- For best results, always provide an `end_time` when clipping during an active broadcast

### Will clips include subtitles/captions from the source?

Yes. Mux copies all text tracks from the source asset to the clip and trims them to match the clip's start and end markers.

### What other data is copied from the source asset?

Mux copies:
- Captions
- Watermark image

If your source asset does not have a watermark and you want the clip to have one, pass it through in `overlay_settings`.

**Not copied:** `passthrough` and other fields.

### What is the minimum duration for a clip?

Clips must have a duration of at least **500 milliseconds**.
