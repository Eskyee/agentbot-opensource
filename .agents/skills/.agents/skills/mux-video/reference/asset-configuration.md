# Asset Configuration and Processing

This reference covers configuring video assets in Mux, including metadata, video quality levels, 4K resolution support, processing optimization, audio normalization, watermarks, static MP4 renditions, and master access for downloading original files.

## Asset Metadata

Metadata provides additional descriptive information about your video assets. Mux supports three optional metadata fields:

| Field | Description | Limit |
|-------|-------------|-------|
| `title` | Descriptive name for your video content | 512 code points |
| `creator_id` | Value to identify the creator or owner | 128 code points |
| `external_id` | Reference to this asset in your system (e.g., database ID) | 128 code points |

**Note:** Code points differ from characters. Some unicode characters like `e` are stored as two code points. In JavaScript, `"e".length` returns `2`.

**Important:** Do not include personally identifiable information in these fields as they are accessible by browsers to display player UI.

### Example Metadata Object

```json
{
   "title": "Guide: Adding metadata to videos",
   "creator_id": "user_23456",
   "external_id": "cdef2345"
}
```

### Creating an Asset with Metadata

```json
// POST /video/v1/assets
{
    "inputs": [
        {
            "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4"
        }
    ],
    "playback_policies": ["public"],
    "video_quality": "basic",
    "meta": {
        "title": "Mux demo video",
        "creator_id": "abcd1234",
        "external_id": "bcde2345"
    }
}
```

### Updating Asset Metadata

Metadata can be changed at any time after asset creation:

```json
// PATCH /video/v1/assets/{ASSET_ID}
{
    "meta": {
        "title": "Updated Mux demo video",
        "creator_id": "cdef3456",
        "external_id": "defg4567"
    }
}
```

### Direct Upload with Metadata

Include metadata in `new_asset_settings` when creating the upload URL:

```json
// POST /video/v1/uploads
{
    "new_asset_settings": {
        "playback_policies": ["public"],
        "video_quality": "basic",
        "meta": {
            "title": "Mux demo video",
            "creator_id": "abcd1234",
            "external_id": "bcde2345"
        }
    },
    "cors_origin": "*"
}
```

### Live Stream Metadata for Recordings

Set default metadata for assets created from live streams:

```json
// POST /video/v1/live-streams
{
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"]
    },
    "meta": {
        "title": "Mux demo live stream recording",
        "creator_id": "abcd1234",
        "external_id": "bcde2345"
    }
}
```

## Video Quality Levels

Mux Video supports three video quality levels that determine quality, cost, and available features.

### Quality Level Comparison

| Quality Level | Description | Encoding Cost |
|---------------|-------------|---------------|
| **Basic** | Reduced encoding ladder with lower target quality, suitable for simpler use cases | No encoding charge |
| **Plus** | AI-powered per-title encoding that boosts bitrates for complex content and reduces for simple content | Per-minute encoding cost |
| **Premium** | Same AI-powered encoding tuned for premium media like live sports or studio movies | Higher cost for encoding, storage, and delivery |

### Feature Availability by Quality Level

| Feature | Basic | Plus | Premium |
|---------|-------|------|---------|
| JIT encoding | Yes | Yes | Yes |
| Multi CDN delivery | Yes | Yes | Yes |
| Mux Data included | Yes | Yes | Yes |
| Mux Player included | Yes | Yes | Yes |
| Thumbnails, GIFs, Storyboards | Yes | Yes | Yes |
| Watermarking | Yes | Yes | Yes |
| Signed playback IDs | Yes | Yes | Yes |
| Master Access | Yes | Yes | Yes |
| Audio-only Assets | Yes | Yes | Yes |
| Auto-generated captions | Yes | Yes | Yes |
| Clipping | Yes | Yes | Yes |
| Multi-track audio | Yes | Yes | Yes |
| Live Streaming | No | Yes | Yes |
| DRM | No | Yes | Yes |
| Adaptive bitrate ladder | Reduced | Standard | Extended |
| Maximum streaming resolution | 2160p (4K) | 2160p (4K) | 2160p (4K) |
| MP4 support | Yes | Yes | Yes |

### Setting Video Quality on Asset Creation

```json
// POST /video/v1/assets
{
    "inputs": [
        {
            "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4"
        }
    ],
    "playback_policies": ["public"],
    "video_quality": "basic"
}
```

### Setting Video Quality for Direct Uploads

```json
// POST /video/v1/uploads
{
    "new_asset_settings": {
        "playback_policies": ["public"],
        "video_quality": "basic"
    },
    "cors_origin": "*"
}
```

### Setting Video Quality for Live Streams

Live streams can only use `plus` or `premium` quality levels:

```json
// POST /video/v1/live-streams
{
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"],
        "video_quality": "plus"
    }
}
```

## 4K and High Resolution Support

Mux Video supports ingesting, storing, and delivering on-demand assets up to 4K (2160p). Live streams accept 2K/4K input but output is capped at 1080p.

### Resolution Tiers

| Tier | Max Resolution |
|------|----------------|
| `1080p` | Default, up to 1080p |
| `1440p` | 2K and 2.5K content |
| `2160p` | 4K content |

### Creating a 4K Asset

```json
// POST /video/v1/assets
{
    "inputs": [
        {
            "url": "https://storage.googleapis.com/muxdemofiles/mux-4k.mp4"
        }
    ],
    "playback_policies": ["public"],
    "video_quality": "basic",
    "max_resolution_tier": "2160p"
}
```

### 4K Direct Upload

```json
// POST /video/v1/uploads
{
    "new_asset_settings": {
        "playback_policies": ["public"],
        "video_quality": "basic",
        "max_resolution_tier": "2160p"
    },
    "cors_origin": "*"
}
```

### Limiting Playback Resolution

Control playback resolution with query parameters:

```
https://stream.mux.com/${PLAYBACK_ID}.m3u8?max_resolution=1080p
```

### 4K Input Requirements

- Maximum dimension: 4096 pixels
- Maximum keyframe interval: 10 seconds (6 seconds for HEVC)
- Maximum bitrate: 20 Mbps
- Frame rate: 5-60 fps

## Minimizing Processing Time

Mux accepts most video formats but non-standard inputs require additional processing time.

### Standard Input Requirements

| Requirement | 1080p Assets | 4K Assets |
|-------------|--------------|-----------|
| Video codec | H.264 or HEVC | H.264 or HEVC |
| GOP type | Closed GOP | Closed GOP |
| Color depth | 8-bit 4:2:0 (10-bit for HEVC) | 8-bit 4:2:0 (10-bit for HEVC) |
| Audio codec | AAC | AAC |
| Max resolution | 2048x2048 | 4096 pixels (any dimension) |
| Keyframe interval | 20 seconds (10 for HEVC) | 10 seconds (6 for HEVC) |
| Max bitrate | 8 Mbps (16 Mbps peak per GOP) | 20 Mbps |
| Frame rate | 5-120 fps | 5-60 fps |
| Max duration | 12 hours | 12 hours |

### Creating Standard Input with FFmpeg

For 1080p content:

```shell
ffmpeg -i input.mp4 -c:a copy -vf "scale=w=min(iw\,1920):h=-2" -c:v libx264 \
-profile high -b:v 7000k -g 239 -pix_fmt yuv420p -maxrate 16000k -bufsize 24000k out.mp4
```

For 4K content:

```shell
ffmpeg -i input.mp4 -c:a copy -vf "scale=w=min(iw\,4096):h=-2" -c:v libx264 \
-profile high -b:v 18000k -g 239 -pix_fmt yuv420p -maxrate 36000k -bufsize 54000k out.mp4
```

### Non-Standard Input Detection

When Mux detects non-standard input, it emits the `video.asset.non_standard_input_detected` webhook:

```json
{
  "type": "video.asset.non_standard_input_detected",
  "data": {
    "id": "{ASSET_ID}",
    "status": "preparing",
    "non_standard_input_reasons": {
      "video_gop_size": "high"
    }
  }
}
```

### Tracking Transcoding Progress

For assets requiring additional processing, use the Get Asset API to check progress:

```json
// GET /video/v1/assets/{ASSET_ID}
{
  "id": "{ASSET_ID}",
  "status": "preparing",
  "non_standard_input_reasons": {
    "video_gop_size": "high"
  },
  "progress": {
    "state": "transcoding",
    "progress": 23.02
  }
}
```

Progress states:
- `transcoding`: Active processing (progress 0-100)
- `ingesting`: Initial processing (progress 0)
- `errored`: Processing failed (progress -1)
- `completed`: Processing complete (progress 100)
- `live`: Live stream in progress (progress -1)

## Audio Normalization

Audio normalization adjusts recording based on perceived loudness using LUFS (Loudness Units relative to Full Scale).

### Target Loudness

Mux targets **-24 LUFS** for audio normalization.

### When to Use

- Standardizing perceived loudness across assets
- Works best when audio gain is normal and quality is high
- Consider that processing will change the audio

### Enabling Audio Normalization

Set `normalize_audio` to `true` when creating an asset (cannot be changed after creation):

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
        "inputs": [
          {
            "url": "https://example.com/myVideo.mp4"
          }
        ],
        "playback_policies": ["public"],
        "video_quality": "basic",
        "normalize_audio": true
    }' \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Limitations:**
- Only available via API (not Dashboard)
- Cannot be updated after asset creation
- Applies to on-demand assets only (not live streams)

## Watermarks

Watermarks are images overlaid on video for branding or labeling.

### Supported Formats

- `.png`
- `.jpg`

Not supported: `.gif`, `.webp`, `.svg`

### Adding a Watermark

The first input is the video, subsequent inputs are watermark images with `overlay_settings`:

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "{VIDEO_INPUT_URL}"
    },
    {
      "url": "{WATERMARK_URL}",
      "overlay_settings": {
        "vertical_align": "top",
        "vertical_margin": "10%",
        "horizontal_align": "left",
        "horizontal_margin": "10%"
      }
    }
  ],
  "playback_policies": ["public"]
}
```

### Positioning Options

| Property | Values |
|----------|--------|
| `vertical_align` | `top`, `middle`, `bottom` |
| `horizontal_align` | `left`, `center`, `right` |
| `vertical_margin` | Percentage or pixels |
| `horizontal_margin` | Percentage or pixels |
| `width` | Percentage or pixels |
| `height` | Percentage or pixels |

### Percent vs Pixel Positioning

**Percentages:** Relative to video dimensions
- `horizontal_margin: "10%"` on 1920px video = 192px from edge

**Pixels:** Applied as if video is scaled to 1920x1080 (horizontal) or 1080x1920 (vertical)
- `width: "80px"` on 1920px video = 80px
- `width: "80px"` on 960px video = 40px

### Pixel-Based Positioning Example

```json
{
  "inputs": [
    {
      "url": "{INPUT_URL}"
    },
    {
      "url": "{WATERMARK_URL}",
      "overlay_settings": {
        "width": "80px",
        "vertical_align": "top",
        "vertical_margin": "40px",
        "horizontal_align": "left",
        "horizontal_margin": "40px"
      }
    }
  ],
  "playback_policies": ["public"]
}
```

### Centering a Watermark

```json
{
  "inputs": [
    {
      "url": "{INPUT_URL}"
    },
    {
      "url": "{WATERMARK_URL}",
      "overlay_settings": {
        "vertical_align": "middle",
        "horizontal_align": "center"
      }
    }
  ],
  "playback_policies": ["public"]
}
```

### Live Stream Watermarks

For live streams, add `overlay_settings` in `new_asset_settings.input`. The watermark applies to both live playback and recorded assets.

## Static MP4 and M4A Renditions

Static renditions are downloadable versions in MP4 (video) or M4A (audio) format.

### Use Cases

- Supporting legacy devices (Android < 4.0)
- Very short duration assets (< 10s)
- Open Graph cards for social media
- Offline viewing downloads
- Audio extraction for transcription services
- Podcast audio downloads

### Resolution Options

**Standard Options:**
| Option | Output |
|--------|--------|
| `highest` | MP4 at video resolution up to 4K |
| `audio-only` | M4A audio file |

**Advanced Options (specific resolutions):**
- 270p, 360p, 480p, 540p, 720p, 1080p, 1440p, 2160p

Note: Advanced resolutions cannot be mixed with `highest` but can be combined with `audio-only`.

### Enabling During Asset Creation

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4"
    }
  ],
  "playback_policies": ["public"],
  "static_renditions": [
    {
      "resolution": "highest"
    },
    {
      "resolution": "audio-only"
    }
  ]
}
```

### Advanced Resolution Example

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4"
    }
  ],
  "playback_policies": ["public"],
  "static_renditions": [
    {
      "resolution": "720p"
    },
    {
      "resolution": "480p"
    },
    {
      "resolution": "audio-only"
    }
  ]
}
```

### Adding to Existing Assets

```json
// POST /video/v1/assets/{ASSET_ID}/static-renditions
{
  "resolution": "highest"
}
```

### Direct Upload with Static Renditions

```json
// POST /video/v1/uploads
{
  "cors_origin": "https://example.com/",
  "new_asset_settings": {
    "playback_policies": ["public"],
    "static_renditions": [
      {
        "resolution": "highest"
      }
    ]
  }
}
```

### Live Stream Static Renditions

```json
// POST /video/v1/live-streams
{
  "playback_policies": ["public"],
  "new_asset_settings": {
    "playback_policies": ["public"],
    "static_renditions": [
      {
        "resolution": "highest"
      }
    ]
  }
}
```

### Accessing Static Renditions

URL pattern:
```
https://stream.mux.com/{PLAYBACK_ID}/{STATIC_RENDITION_NAME}
```

Examples:
```
https://stream.mux.com/abcd1234/highest.mp4
https://stream.mux.com/abcd1234/audio.m4a
```

Force download with custom filename:
```
https://stream.mux.com/abcd1234/highest.mp4?download=cats
```

### Static Rendition Response Object

```json
{
  "static_renditions": [
    {
      "id": "ABC123",
      "type": "standard",
      "status": "preparing",
      "resolution": "highest",
      "name": "highest.mp4",
      "ext": "mp4"
    },
    {
      "id": "GHI678",
      "type": "standard",
      "status": "preparing",
      "resolution": "audio-only",
      "name": "audio.m4a",
      "ext": "m4a"
    }
  ]
}
```

### Removing Static Renditions

```json
// DELETE /video/v1/asset/{ASSET_ID}/static-renditions/{STATIC_RENDITION_ID}
```

### Static Rendition Webhooks

| Webhook | Description |
|---------|-------------|
| `video.asset.static_rendition.created` | Rendition entry created, file being prepared |
| `video.asset.static_rendition.ready` | Rendition ready for download |
| `video.asset.static_rendition.errored` | Rendition generation failed |
| `video.asset.static_rendition.skipped` | Rendition skipped due to asset metadata conflict |
| `video.asset.static_rendition.deleted` | Individual rendition deleted |

## Master Access (Original File Download)

Master access provides a temporary URL to download the original quality video stored by Mux.

### Use Cases

- Downloading for offline editing (e.g., Final Cut Pro)
- Archiving videos before deletion
- Moving videos to another service
- Providing download access after live streams

### Enabling Master Access on Asset Creation

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "VIDEO_URL"
    }
  ],
  "playback_policies": ["public"],
  "video_quality": "basic",
  "master_access": "temporary"
}
```

### Enabling for Live Stream Recordings

```json
// POST /video/v1/live-streams
{
  "playback_policies": ["public"],
  "new_asset_settings": {
    "playback_policies": ["public"],
    "video_quality": "basic",
    "master_access": "temporary"
  }
}
```

### Retrieving the Master URL

After enabling, check the asset for the `master` object:

```json
{
  "master_access": "temporary",
  "master": {
    "status": "preparing"
  }
}
```

When ready:

```json
{
  "master_access": "temporary",
  "master": {
    "status": "ready",
    "url": "https://mezzanine.mux.com/ABC123/mezzanine.mp4?skid=foo&signature=bar"
  }
}
```

**Important:** The URL expires after 24 hours but can be re-enabled at any time.

### Customizing Download Filename

Append `download` query parameter:

```
https://mezzanine.mux.com/ABC123/mezzanine.mp4?skid=foo&signature=bar&download=desired_filename.mp4
```

Do not modify any other URL parameters.

### Master Access Webhooks

| Webhook | Description |
|---------|-------------|
| `video.asset.master.preparing` | Master access first requested |
| `video.asset.master.ready` | URL to master is available |
| `video.asset.master.deleted` | Master access set to `none` |
| `video.asset.master.errored` | Unexpected error occurred |

## Complete Asset Configuration Example

Here is a comprehensive example combining multiple configuration options:

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "https://example.com/video.mp4"
    },
    {
      "url": "https://example.com/watermark.png",
      "overlay_settings": {
        "vertical_align": "bottom",
        "vertical_margin": "5%",
        "horizontal_align": "right",
        "horizontal_margin": "5%",
        "width": "10%"
      }
    }
  ],
  "playback_policies": ["public"],
  "video_quality": "plus",
  "max_resolution_tier": "2160p",
  "normalize_audio": true,
  "master_access": "temporary",
  "static_renditions": [
    {
      "resolution": "highest"
    },
    {
      "resolution": "720p"
    }
  ],
  "meta": {
    "title": "My Video Title",
    "creator_id": "user_123",
    "external_id": "video_456"
  }
}
```
