# Live Stream Configuration

Reference for configuring live stream parameters including latency modes, reconnect windows, slate images, DVR mode, and recording settings.

## Latency Modes

Mux live streams support three latency modes that control the glass-to-glass latency (the time lag between when a camera captures an action and when that action reaches a viewer's device).

| Latency Mode | Glass-to-Glass Latency | HLS Type |
|--------------|------------------------|----------|
| `standard` | 20-30 seconds | Standard HLS |
| `reduced` | 12-20 seconds | Standard HLS |
| `low` | As low as 5 seconds | Apple LL-HLS |

### Standard Latency (Default)

Standard latency provides the most reliable playback experience with 20-30 seconds of glass-to-glass latency. This mode is recommended when:

- You do not have control over the encoder software, hardware, or network
- Viewers are on unstable connections
- Maximum reliability is more important than minimal delay

### Reduced Latency

Reduced latency brings glass-to-glass latency down to 12-20 seconds while still using standard HLS delivery.

**Create a live stream with reduced latency:**

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "reduced",
    "reconnect_window": 60,
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"]
    }
}
```

### Low Latency

Low latency mode uses Apple's Low-Latency HLS (LL-HLS) specification to achieve glass-to-glass latency as low as 5 seconds.

**Create a live stream with low latency:**

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "low",
    "reconnect_window": 60,
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"]
    }
}
```

### Input Requirements for Reduced/Low Latency

You should only use `reduced` or `low` latency modes if you have control over:

- The encoder software
- The hardware the encoder software is running on
- The network the encoder software is connected to

Home networks in cities and mobile connections are typically not stable enough to reliably use reduced or low latency options.

### Updating Latency Mode

You can change an existing live stream's latency mode using the PATCH endpoint, but only when the live stream status is `idle`:

```json
// PATCH https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}

{
    "latency_mode": "low"
}
```

After updating, your webhook endpoint receives a `video.live_stream.updated` event.

### Low Latency Player Support

| Player | Minimum Version | Notes |
|--------|-----------------|-------|
| HLS.js | >= 1.1.5 | |
| JW Player | >= 8.20.5 | Do not set `liveSyncDuration` for low-latency playback |
| THEOplayer | >= 6.0.0 | LL-HLS enabled by default |
| THEOplayer | >= 2.84.1 | Requires enabling LL-HLS add-on and `lowlatency: true` |
| VideoJS | >= 8.0.0 | LL-HLS enabled by default |
| VideoJS | >= 7.16.0 | Requires `experimentalLLHLS` flag |
| Mux Player | >= 1.0 | |
| Mux Video.js Kit | >= 0.4 | Uses HLS.js |
| Apple iOS (AVPlayer) | 15.* | Recommended version |
| Android ExoPlayer | >= 2.14 | |
| Agnoplay | >= 1.0.33 | |

**Enabling LL-HLS on VideoJS prior to 8.0.0:**

```javascript
var player = videojs(video, {
  html5: {
    vhs: {
      experimentalLLHLS: true
    }
  }
});
```

### Disabling Low Latency for Playback

If your video player has issues with low-latency streams, add `low_latency=false` to the playback URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?low_latency=false
```

For signed playback IDs, add `low_latency` to the claims body instead of as a query parameter.

## Reconnect Window

The reconnect window is the time in seconds that Mux waits for a disconnected encoder to reconnect before considering the live stream finished.

### Configuration

| Parameter | Default | Range |
|-----------|---------|-------|
| `reconnect_window` | 60 seconds (standard latency) | 0-1800 seconds |
| `reconnect_window` | 0 seconds (reduced/low latency) | 0-1800 seconds |

Set the reconnect window when creating or updating a live stream:

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "standard",
    "reconnect_window": 300,
    "playback_policies": ["public"]
}
```

### Reconnect Window Behavior

1. When an encoder disconnects unexpectedly, Mux keeps the live stream "active" for the reconnect window duration
2. If the encoder reconnects within the window, the HLS playlist resumes appending new video segments
3. If the reconnect window expires without reconnection:
   - Mux writes the `#EXT-X-ENDLIST` tag to the HLS manifest
   - The live stream transitions from `active` to `idle`
   - The asset is finalized with the `active_asset_id`

## Slate Images

Slate images display to viewers when the encoder disconnects or stops sending media, improving the viewer experience during reconnect windows.

### Enabling Slates

**For standard latency streams:**
- Set `use_slate_for_standard_latency` to `true`
- Set `reconnect_window` to greater than 0 seconds

**For reduced and low latency streams:**
- Set `reconnect_window` to greater than 0 seconds (slates are enabled automatically)

### Custom Slate Image

Set a custom slate image URL using the `reconnect_slate_url` parameter:

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "standard",
    "reconnect_window": 60,
    "reconnect_slate_url": "https://example.com/slate-image.png",
    "use_slate_for_standard_latency": true,
    "playback_policies": ["public"]
}
```

Mux downloads the slate image at the start of the live stream recording. Ensure the image is always downloadable from the URL.

### Default Slate Images

If no custom slate URL is provided, Mux uses default slate images based on the live stream's aspect ratio (horizontal or vertical laptop illustrations).

### Slate Insertion Behavior

Mux handles imperfect streams as follows:

- **Audio only**: The most recent video frame is duplicated
- **Video only**: Silent audio is output
- **No audio or video**:
  1. Silent audio and the most recent video frame are output
  2. After 0.5 seconds, switches to the slate image with silent audio
  3. If encoder is still connected but not sending media, disconnects after 5 minutes
  4. Continues inserting slates up to the `reconnect_window` duration

### Slate Warning Webhook

If Mux cannot download the custom slate image, a warning webhook is fired:

```json
{
    "type": "video.live_stream.warning",
    "object": {
      "type": "live",
      "id": "CiinCsHA2EbsU00XwzherzjWAek3VmtUz8"
    },
    "data": {
      "warning": {
        "type": "custom_slate_unavailable",
        "message": "Unable to download custom reconnect slate image from URL 'http://example.com/bad_url.png' -- using black frames for slate if needed."
      },
      "stream_key": "5203dc64-074a-5914-0dfc-ce007f5db53a",
      "status": "idle",
      "id": "CiinCsHA2EbsU00XwzherzjWAek3VmtUz8"
    }
}
```

## DVR Mode

Mux offers two playback modes for live streams:

### Non-DVR Mode (Recommended)

- Viewers are kept "live" with access to approximately the most recent 30 seconds of content
- Use the playback ID associated with the live stream
- Recommended for most live streaming use cases

### DVR Mode

- Viewers can scrub back to the beginning of the live stream
- Use the playback ID associated with the live stream's `active_asset_id`
- Not recommended for live streams longer than 4 hours

## Recording Settings

Every live stream on Mux is automatically recorded as an asset.

### Asset Creation Lifecycle

| Step | Event | Description |
|------|-------|-------------|
| 1 | Initial State | Live stream begins in status `idle` |
| 2 | `video.live_stream.connected` | Encoder connects; live stream receives new `active_asset_id` |
| 3 | `video.asset.created` | Asset corresponding to `active_asset_id` is created with `live_stream_id` pointing back to the live stream |
| 4 | `video.live_stream.recording` | Mux starts recording incoming content (live stream status still `idle`) |
| 5 | `video.live_stream.active` | Live stream transitions to `active`; playback URL can be used for non-DVR mode |
| 6 | `video.asset.ready` | Asset is ready with initial content (~10 seconds); DVR mode playback URL can now be used |
| 7 | `video.live_stream.disconnected` | Encoder disconnects; live stream status remains `active` during reconnect window |
| 8 | `video.live_stream.idle` | After reconnect window expires, live stream transitions to `idle` |
| 9 | `video.asset.live_stream_completed` | Asset is finalized with full duration; recording can be played back |

### Recording Playback

After a live stream ends:
- The asset's `duration` reflects the full, finalized duration
- Use the asset's playback ID to play the recording of the live stream

### Multiple Recordings

Since live streams are reusable, a new asset is created each time a live stream begins broadcasting. A single live stream can produce an indefinite number of assets over time.

## Where Latency Comes From

Understanding the live stream pipeline helps explain latency sources:

1. **Captured by camera**
2. **Processed by encoder** - CPU limitations can cause lag
3. **Sent to RTMP ingest server** - "First mile" over internet; affected by packet loss and network disconnects
4. **Ingest server decodes and encodes** - Server must buffer content for processing
5. **Manifest files and segments delivered** - Files delivered over HTTP through CDNs; affected by network congestion
6. **Decoded and played on client** - Player maintains buffer of playable video

More latency tolerance allows the system to recover from momentary slowdowns at any step without interrupting playback.
