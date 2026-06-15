# Creating a Video Asset with Captions and Metadata

This guide demonstrates how to create a fully configured Mux Video asset that includes auto-generated captions, custom metadata, quality settings, and static MP4 renditions for download.

## Complete Asset Creation Example

The following API request creates an asset with all features enabled:

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4",
      "generated_subtitles": [
        {
          "language_code": "en",
          "name": "English CC"
        }
      ]
    }
  ],
  "playback_policies": [
    "public"
  ],
  "video_quality": "plus",
  "meta": {
    "title": "Product Demo Video",
    "creator_id": "user_12345",
    "external_id": "video_abc789"
  },
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

## Feature Breakdown

### Auto-Generated Captions

The `generated_subtitles` array within the input enables automatic caption generation using OpenAI's Whisper model.

**Configuration options:**

```json
"generated_subtitles": [
  {
    "language_code": "en",
    "name": "English CC"
  }
]
```

**Supported language codes:**

| Language | Code | Status |
|:---------|:-----|:-------|
| English | en | Stable |
| Spanish | es | Stable |
| Italian | it | Stable |
| Portuguese | pt | Stable |
| German | de | Stable |
| French | fr | Stable |
| Automatic Detection | auto | Stable |
| Polish | pl | Beta |
| Russian | ru | Beta |
| Dutch | nl | Beta |
| Turkish | tr | Beta |
| Swedish | sv | Beta |

**Key behaviors:**

- Captions are generated separately from initial asset ingest, so playback is not delayed
- Listen for the `video.asset.track.ready` webhook with `"text_source": "generated_vod"` to know when captions are ready
- Generation time is approximately 0.1x content duration (a 1-hour video takes about 6 minutes)
- Works best with clear audio content; may be less accurate with music or background noise

### Video Metadata

The `meta` object provides descriptive information for organization and analytics.

```json
"meta": {
  "title": "Product Demo Video",
  "creator_id": "user_12345",
  "external_id": "video_abc789"
}
```

**Metadata fields:**

| Field | Description | Limit |
|:------|:------------|:------|
| `title` | Descriptive name for the video | 512 code points |
| `creator_id` | Identifier for the content creator | 128 code points |
| `external_id` | Reference ID from your system | 128 code points |

**Important:** Do not include personally identifiable information in metadata fields, as they may be accessible to browsers for player UI display.

### Video Quality Levels

The `video_quality` parameter controls encoding quality and available features.

```json
"video_quality": "plus"
```

**Available quality levels:**

| Level | Description | Encoding Cost | Best For |
|:------|:------------|:--------------|:---------|
| `basic` | Reduced encoding ladder, lower target quality | Free | Simple video use cases |
| `plus` | AI-powered per-title encoding, consistent high quality | Per-minute cost | Standard production content |
| `premium` | Optimized for premium media presentation | Higher per-minute cost | Live sports, studio films |

**Feature availability by quality:**

| Feature | Basic | Plus | Premium |
|:--------|:------|:-----|:--------|
| Auto-generated captions | Yes | Yes | Yes |
| Static MP4 renditions | Yes | Yes | Yes |
| Live Streaming | No | Yes | Yes |
| DRM | No | Yes | Yes |
| Maximum resolution | 4K | 4K | 4K |

### Static MP4 Renditions

The `static_renditions` array creates downloadable MP4/M4A files.

```json
"static_renditions": [
  {
    "resolution": "highest"
  },
  {
    "resolution": "audio-only"
  }
]
```

**Standard resolution options:**

- `highest` - Produces MP4 at up to 4K resolution
- `audio-only` - Produces M4A audio file

**Advanced resolution options (incur additional encoding cost):**

- 270p, 360p, 480p, 540p, 720p, 1080p, 1440p, 2160p

**Note:** Advanced resolutions cannot be mixed with `highest`, but can be combined with `audio-only`.

## Direct Upload Configuration

For browser-based uploads, configure the same features in `new_asset_settings`:

```json
// POST /video/v1/uploads
{
  "new_asset_settings": {
    "playback_policies": [
      "public"
    ],
    "video_quality": "plus",
    "meta": {
      "title": "User Uploaded Video",
      "creator_id": "user_12345",
      "external_id": "upload_xyz456"
    },
    "inputs": [
      {
        "generated_subtitles": [
          {
            "language_code": "en",
            "name": "English CC"
          }
        ]
      }
    ],
    "static_renditions": [
      {
        "resolution": "highest"
      }
    ]
  },
  "cors_origin": "*"
}
```

## Updating Existing Assets

### Update Metadata

```json
// PATCH /video/v1/assets/{ASSET_ID}
{
  "meta": {
    "title": "Updated Video Title",
    "creator_id": "new_creator_id",
    "external_id": "new_external_id"
  }
}
```

### Add Captions Retroactively

```json
// POST /video/v1/assets/{ASSET_ID}/tracks/{AUDIO_TRACK_ID}/generate-subtitles
{
  "generated_subtitles": [
    {
      "language_code": "en",
      "name": "English (generated)"
    }
  ]
}
```

### Add Static Renditions Retroactively

```json
// POST /video/v1/assets/{ASSET_ID}/static-renditions
{
  "resolution": "highest"
}
```

## Accessing Generated Content

### Retrieve Transcript

Once captions are ready, retrieve the plain text transcript:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.txt
```

For WebVTT format:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
```

For signed assets, append a JWT token:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.txt?token={JWT}
```

### Access Static Renditions

After the `video.asset.static_rendition.ready` webhook fires:

```
https://stream.mux.com/{PLAYBACK_ID}/highest.mp4
https://stream.mux.com/{PLAYBACK_ID}/audio.m4a
```

To trigger a download instead of streaming:

```
https://stream.mux.com/{PLAYBACK_ID}/highest.mp4?download=my-video
```

## Webhook Events

Monitor asset creation progress with these webhooks:

| Event | Description |
|:------|:------------|
| `video.asset.ready` | Asset is ready for playback |
| `video.asset.track.ready` | Caption track is ready (check for `text_source: "generated_vod"`) |
| `video.asset.static_rendition.ready` | Static rendition is ready for download |
| `video.asset.static_rendition.errored` | Static rendition generation failed |
| `video.asset.static_rendition.skipped` | Static rendition skipped due to conflict |

## Asset Response Structure

After creation, the asset object includes:

```json
{
  "id": "asset_abc123",
  "status": "ready",
  "playback_ids": [
    {
      "id": "playback_xyz789",
      "policy": "public"
    }
  ],
  "meta": {
    "title": "Product Demo Video",
    "creator_id": "user_12345",
    "external_id": "video_abc789"
  },
  "video_quality": "plus",
  "tracks": [
    {
      "id": "track_audio_001",
      "type": "audio",
      "status": "ready"
    },
    {
      "id": "track_text_001",
      "type": "text",
      "text_type": "subtitles",
      "text_source": "generated_vod",
      "language_code": "en",
      "name": "English CC",
      "status": "ready"
    }
  ],
  "static_renditions": [
    {
      "id": "sr_001",
      "type": "standard",
      "status": "ready",
      "resolution": "highest",
      "name": "highest.mp4",
      "ext": "mp4"
    },
    {
      "id": "sr_002",
      "type": "standard",
      "status": "ready",
      "resolution": "audio-only",
      "name": "audio.m4a",
      "ext": "m4a"
    }
  ]
}
```

## Pricing Considerations

- **Auto-generated captions:** No additional charge (included with standard encoding)
- **Basic quality:** No encoding charge
- **Plus/Premium quality:** Per-minute encoding charge
- **Static renditions:** Storage and delivery fees apply; advanced resolutions incur additional encoding costs
