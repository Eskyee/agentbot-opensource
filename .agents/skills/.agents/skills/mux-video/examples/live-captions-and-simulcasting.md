# Live Captions and Simulcasting Example

This guide demonstrates how to enable auto-generated captions on a Mux live stream, create transcription vocabularies for improved accuracy, and set up simulcasting to stream to multiple platforms like YouTube and Facebook simultaneously.

## Overview

Mux provides two powerful features for enhancing live streams:

1. **Auto-Generated Live Captions** - AI-powered speech-to-text technology that automatically generates closed captions in multiple languages
2. **Simulcasting** - Forward your live stream to social platforms like YouTube, Facebook, and Twitch

## Part 1: Auto-Generated Live Captions

### Supported Languages

Mux supports auto-generated live captions in the following languages:

| Language   | Language Code |
|------------|---------------|
| English    | `"en"`        |
| Spanish    | `"es"`        |
| Italian    | `"it"`        |
| Portuguese | `"pt"`        |
| German     | `"de"`        |
| French     | `"fr"`        |

Locale codes such as `"en-US"` or `"es-MX"` are accepted and will be parsed down to their language code (e.g., `"en-US"` becomes `"en"`).

### Content Suitability

Auto-generated live captions work best with:
- Non-technical content with clear audio
- Minimal background noise
- Single speaker or well-separated speakers

Not recommended for:
- Content with music
- Multiple speakers talking over each other

Accuracy ranges from 70-95% depending on content quality.

### Step 1: Create a Transcription Vocabulary

Transcription vocabularies improve caption accuracy for technical terms, brand names, and proper nouns that may not be in the standard language model.

**Request Body Parameters:**

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `name`    | `string` | Human-readable description of the transcription library |
| `phrases` | `array`  | Array of phrases (up to 1,000) to populate the library |

**Create Vocabulary Request:**

```json
POST /video/v1/transcription-vocabularies
{
  "name": "TMI vocabulary",
  "phrases": ["Mux", "Demuxed", "The Mux Informational", "video.js", "codec", "rickroll"]
}
```

**Response:**

```json
{
  "data": {
    "updated_at": "1656630612",
    "phrases": ["Mux", "Demuxed", "The Mux Informational", "video.js", "codec", "rickroll"],
    "name": "TMI vocabulary",
    "id": "4uCfJqluoYxl8KjXxNF00TgB56OyM152B5ZR00cLKXFlc",
    "created_at": "1656630612"
  }
}
```

Note: It can take up to 20 seconds for the transcription vocabulary to be applied to your live stream.

### Step 2: Enable Auto-Generated Captions

You can enable captions when creating a new live stream or add them to an existing stream.

**Generated Subtitles Parameters:**

| Parameter                      | Type     | Description |
|--------------------------------|----------|-------------|
| `name`                         | `string` | Human-readable description for the subtitle track (must be unique) |
| `passthrough`                  | `string` | Arbitrary metadata for the subtitle track |
| `language_code`                | `string` | BCP-47 language tag. Defaults to `"en"` |
| `transcription_vocabulary_ids` | `array`  | IDs of existing Transcription Vocabularies to apply (max 1,000 unique phrases total) |

#### Option A: Create New Live Stream with Captions

```json
POST /video/v1/live-streams
{
  "playback_policy": ["public"],
  "generated_subtitles": [
    {
      "name": "English CC (auto)",
      "passthrough": "English closed captions (auto-generated)",
      "language_code": "en",
      "transcription_vocabulary_ids": ["4uCfJqluoYxl8KjXxNF00TgB56OyM152B5ZR"]
    }
  ],
  "new_asset_settings": {
    "playback_policy": ["public"]
  }
}
```

**Response:**

```json
{
  "data": {
    "stream_key": "5bd28537-7491-7ffa-050b-bbb506401234",
    "playback_ids": [
      {
        "policy": "public",
        "id": "U00gVu02hfLPdaGnlG1dFZ00ZkBUm2m0"
      }
    ],
    "new_asset_settings": {
      "playback_policies": ["public"]
    },
    "generated_subtitles": [
      {
        "name": "English CC (auto)",
        "passthrough": "English closed captions (auto-generated)",
        "language_code": "en",
        "transcription_vocabulary_ids": ["4uCfJqluoYxl8KjXxNF00TgB56OyM152B5ZR"]
      }
    ],
    "id": "e00Ed01C9ws015d5SLU00ZsaUZzh5nYt02u",
    "created_at": "1624489336"
  }
}
```

#### Option B: Add Captions to Existing Live Stream

Note: Live captions cannot be configured while the stream is active.

```json
PUT /video/v1/live-streams/{live_stream_id}/generated-subtitles
{
  "generated_subtitles": [
    {
      "name": "English CC (auto)",
      "passthrough": "{\"description\": \"English closed captions (auto-generated)\"}",
      "language_code": "en",
      "transcription_vocabulary_ids": ["4uCfJqluoYxl8KjXxNF00TgB56OyM152B5ZR"]
    }
  ]
}
```

### Step 3: Understanding Caption Tracks During Streaming

When your live stream starts with captions enabled:

1. **During the stream**: Two text tracks are created:
   - `generated_live` - Contains real-time predicted text
   - `generated_live_final` - Preparing state during stream

2. **After the stream ends**:
   - `generated_live_final` transitions to ready state with finalized, higher-accuracy text
   - Playback uses the more accurate `generated_live_final` track
   - Both VTT sidecar files remain available for download

### Step 4: Disable Captions for Future Streams

To stop auto-generating captions for future connections:

```json
PUT /video/v1/live-streams/{live_stream_id}/generated-subtitles
{
  "generated_subtitles": []
}
```

### Managing Transcription Vocabularies

Update phrases in a vocabulary (changes apply to next stream activation, not active streams):

```json
PUT /video/v1/transcription-vocabularies/{vocabulary_id}
{
  "phrases": ["Demuxed", "HLS.js"]
}
```

### Downloading Caption Files

Download auto-generated captions as VTT files:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
```

### Live Captions Limitations

- Cannot edit caption configuration while stream is active
- Low latency live streams do not support live captions
- Mixed language audio uses single language model (may produce incomprehensible output)

---

## Part 2: Simulcasting to Multiple Platforms

Simulcasting allows you to forward your Mux live stream to social platforms simultaneously.

### Supported Platforms

Mux simulcasting works with any platform supporting RTMP or RTMPS protocols:

**Supported:**
- YouTube Live
- Facebook Live
- Twitch
- Crowdcast
- Vimeo

**Not Supported:**
- Instagram (only supports live streaming from their app)

### Simulcast Target Parameters

| Parameter     | Type     | Description |
|---------------|----------|-------------|
| `url`         | `string` | RTMP hostname including application name for the third-party service |
| `stream_key`  | `string` | Stream identifier/password for the third-party service |
| `passthrough` | `string` | Optional metadata to identify the target |

### Adding Simulcast Targets

Simulcast targets can be added when creating a live stream or afterward (only when stream is not active).

**Create Live Stream with Simulcast Targets:**

```json
POST https://api.mux.com/video/v1/live-streams
{
  "playback_policies": ["public"],
  "new_asset_settings": {
    "playback_policies": ["public"]
  },
  "simulcast_targets": [
    {
      "url": "rtmp://a.rtmp.youtube.com/live2",
      "stream_key": "12345",
      "passthrough": "YouTube Example"
    },
    {
      "url": "rtmps://live-api-s.facebook.com:443/rtmp/",
      "stream_key": "12345",
      "passthrough": "Facebook Example"
    }
  ]
}
```

### Platform-Specific RTMP URLs

**YouTube Live:**
```
rtmp://a.rtmp.youtube.com/live2
```

**Facebook Live:**
```
rtmps://live-api-s.facebook.com:443/rtmp/
```

### Recommended Encoder Settings

For simulcasting, recommended settings are:
- **Bitrate**: 4,000 kbps
- **Resolution**: 720p
- **Keyframe Interval**: 2 seconds

### Simulcasting Limits

- Maximum of 6 simulcast targets per live stream
- Stream keys are sensitive credentials - treat them like API keys or passwords
- Simulcast targets can only be added while the live stream is idle (not active)

---

## Complete Example: Live Stream with Captions and Simulcasting

This example creates a live stream with auto-generated English captions and simulcasts to both YouTube and Facebook:

```json
POST /video/v1/live-streams
{
  "playback_policy": ["public"],
  "generated_subtitles": [
    {
      "name": "English CC (auto)",
      "passthrough": "Auto-generated English captions",
      "language_code": "en",
      "transcription_vocabulary_ids": ["your-vocabulary-id"]
    }
  ],
  "simulcast_targets": [
    {
      "url": "rtmp://a.rtmp.youtube.com/live2",
      "stream_key": "your-youtube-stream-key",
      "passthrough": "YouTube"
    },
    {
      "url": "rtmps://live-api-s.facebook.com:443/rtmp/",
      "stream_key": "your-facebook-stream-key",
      "passthrough": "Facebook"
    }
  ],
  "new_asset_settings": {
    "playback_policy": ["public"]
  }
}
```

## Summary

| Feature | Key Points |
|---------|------------|
| **Live Captions** | AI-powered, 6 languages, 70-95% accuracy, vocabulary support |
| **Transcription Vocabulary** | Up to 1,000 phrases, improves accuracy for technical terms |
| **Simulcasting** | RTMP/RTMPS support, up to 6 targets, YouTube/Facebook/Twitch/more |
| **Configuration** | Both features must be configured while stream is idle |
