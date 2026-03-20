# Live Stream Features

Reference for advanced live streaming features including live captions (embedded CEA-608 and auto-generated), viewer counts, health monitoring, simulcasting to third-party platforms, and simulated live streaming.

## Live Captions

Closed captions make video accessible to people who are deaf or hard of hearing, and empower all viewers to consume content in whichever way is best for them. Mux supports two approaches to live captions: embedded captions from professional caption vendors and auto-generated captions using AI.

### Embedded Live Captions (CEA-608)

Mux supports receiving closed captions embedded in the H.264 video stream using the CEA-608 standard for a single language. CEA-608 stems from the analog era where closed captions data was carried directly in the transmission. Most major live caption providers (AI-Media, EEG Falcon, 3Play, Verbit) support this standard.

Mux translates CEA-608 captions into WebVTT delivered as part of the HLS stream/manifest.

#### Embedded Subtitles Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Human-readable description. Must be unique across text tracks. Defaults to `language_code` if not provided. |
| `passthrough` | string | Arbitrary metadata. Max 255 characters. |
| `language_code` | string | BCP 47 compliant language code. Defaults to `en`. |
| `language_channel` | string | CEA-608 caption channel. Possible values: `cc1` |

#### Create Live Stream with Embedded Captions

```json
POST /video/v1/live-streams

{
  "playback_policy": ["public"],
  "embedded_subtitles": [
    {
      "name": "English CC",
      "passthrough": "English closed captions",
      "language_code": "en-US",
      "language_channel": "cc1"
    }
  ],
  "new_asset_settings": {
    "playback_policy": ["public"]
  }
}
```

#### Configure Embedded Captions on Existing Live Stream

```json
PUT /video/v1/live-streams/{live_stream_id}/embedded-subtitles

{
  "embedded_subtitles": [
    {
      "name": "en-US",
      "language_code": "en-US",
      "language_channel": "cc1"
    }
  ]
}
```

#### Disable Embedded Captions

```json
PUT /video/v1/live-streams/{live_stream_id}/embedded-subtitles

{
  "embedded_subtitles": []
}
```

#### Caption Vendor Integration Workflow

1. Create a live stream in Mux with `embedded_subtitles` configured
2. Create an event with your caption vendor (AI-Media, 3Play, Verbit), providing:
   - Start date and time
   - Language of audio to be captioned
   - Mux RTMP destination URL and stream key
3. Configure your video encoder with the Stream URL and Stream Key from the caption vendor
4. Start your live stream

#### CEA-608 Language Support

The CEA-608 standard only supports: English, Spanish, French, German, Dutch, Portuguese, and Italian. Only single language captions are supported.

#### RTMP Ingest URLs for Caption Vendors

| URL | Description |
|-----|-------------|
| `rtmp://global-live.mux.com:5222/app` | Standard RTMP ingest URL. Compatible with most streaming applications. |
| `rtmps://global-live.mux.com:443/app` | Secure RTMPS ingest URL. Higher security but compatible with fewer applications. |

### Auto-Generated Live Captions

Mux offers auto-generated live closed captions using AI-based speech-to-text technology. This feature supports English, French, German, Italian, Portuguese, and Spanish.

**Accuracy Note:** Auto-generated caption accuracy ranges from 70-95%. Non-technical content with clear audio and minimal background noise is most suitable. Content with music and multiple speakers speaking over each other is not ideal.

#### Supported Languages

| Language | Language Code |
|----------|---------------|
| English | `en` |
| Spanish | `es` |
| Italian | `it` |
| Portuguese | `pt` |
| German | `de` |
| French | `fr` |

Locale codes (e.g., `en-US`, `es-MX`) are accepted and parsed to their base language code.

#### Transcription Vocabulary

Improve accuracy by providing transcription vocabulary for technical terms and proper nouns. Each vocabulary can contain up to 1,000 phrases.

**Create Transcription Vocabulary:**

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

**Update Transcription Vocabulary:**

```json
PUT /video/v1/transcription-vocabularies/{id}

{
  "phrases": ["Demuxed", "HLS.js"]
}
```

Note: Updates to vocabulary applied to an active live stream will not take effect until the next stream session.

#### Generated Subtitles Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Human-readable description. Must be unique. Generated from `language_code` if not provided. |
| `passthrough` | string | Arbitrary metadata for the generated subtitle track. |
| `language_code` | string | BCP-47 language tag. Defaults to `en`. |
| `transcription_vocabulary_ids` | array | IDs of Transcription Vocabularies to apply. First 1,000 phrases used if combined vocabularies exceed limit. |

#### Create Live Stream with Auto-Generated Captions

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

#### Configure Auto-Generated Captions on Existing Stream

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

#### Disable Auto-Generated Captions

```json
PUT /video/v1/live-streams/{live_stream_id}/generated-subtitles

{
  "generated_subtitles": []
}
```

#### Auto-Generated Caption Tracks

When the stream goes live, two text tracks are created:

- `generated_live`: Available during streaming with predicted text
- `generated_live_final`: Transitions to ready after stream ends with higher-accuracy, better-timed text

After the live event concludes, playback uses only the more accurate `generated_live_final` track, though sidecar VTT files for both tracks remain available.

### Downloading Caption Tracks

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
```

### Live Caption Limitations

- Configuration can only be edited while the live stream is idle
- Does not work with audio-only streams
- Does not work with low latency live streams

## Viewer Counts (Engagement Counts API)

The Engagement Counts API allows you to embed real-time view and unique viewer counts for videos in your applications.

### Authentication

The API uses JSON Web Tokens (JWT) for authentication.

#### Create a Signing Key

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET} \
  'https://api.mux.com/system/v1/signing-keys'
```

**Response:**

```json
{
  "data": {
    "private_key": "(base64-encoded PEM file with private key)",
    "id": "(unique signing-key identifier)",
    "created_at": "(UNIX Epoch seconds)"
  }
}
```

The API generates a 2048-bit RSA key pair. Store the private key securely. The public key is stored at Mux to validate signed tokens.

**Important:** The signing key's environment (Staging, Production, etc.) must match the environment of the views you want to count.

#### Required JWT Claims

| Claim | Description | Value |
|-------|-------------|-------|
| `sub` | Subject | The ID for which counts will be returned |
| `aud` | Audience (identifier type) | `video_id`, `asset_id`, `playback_id`, or `live_stream_id` |
| `exp` | Expiration time | UNIX Epoch seconds when token expires |
| `kid` | Key Identifier | Key ID from signing key creation |

**Note:** Each ID type is distinct and cannot be used interchangeably:
- `video_id` - Optional Data dimension provided by customer
- `asset_id` - Mux Video Asset ID
- `playback_id` - Mux Video Playback ID
- `live_stream_id` - Mux Video Live Stream ID

#### Expiration Time

Set expiration to at least the duration of the video or expected live stream duration. When the signed URL expires, you will no longer receive counts from the API.

### Making Requests

```bash
curl 'https://stats.mux.com/counts?token={JWT}'
```

**Response:**

```json
{
  "data": [{ "views": 95, "viewers": 94, "updated_at": "2021-09-28T18:21:19Z" }]
}
```

- `views`: Total (non-unique) number of views
- `viewers`: Total unique number of viewers (determined by `viewer_user_id` metadata field)

## Live Stream Health Stats

The Live Stream Health Stats API enables you to display live stream health information to streamers during live events, allowing them to monitor status and take action when issues occur.

### Understanding Live Stream Stats

#### Key Terms

- **Wallclock time**: Real-world time
- **Stream drift**: Difference between elapsed media time and elapsed wallclock time

#### Metrics Returned

**Stream Drift Session Average**

Running average of stream drift for the lifetime of an ingest connection. Use as an indication of average offset between elapsed wallclock time and media time throughout the session. Measured in milliseconds and reset when encoder disconnects.

**Stream Drift Deviation From Rolling Average**

Difference between current stream drift and current stream drift rolling average. The rolling average considers only the last ~30 seconds of data. Use this to understand if the stream is experiencing issues at the moment.

**Status**

| Status | Condition |
|--------|-----------|
| `excellent` | Deviation from rolling average <= 500ms |
| `good` | Deviation from rolling average <= 1s but > 500ms |
| `poor` | Deviation from rolling average > 1s |
| `unknown` | Unable to calculate stream drift (usually because stream is inactive) |

### Authentication

Uses JWT authentication identical to the Engagement Counts API.

#### Required JWT Claims

| Claim | Description | Value |
|-------|-------------|-------|
| `sub` | Subject | Live Stream ID |
| `aud` | Audience | `live_stream_id` |
| `exp` | Expiration time | UNIX Epoch seconds when token expires |
| `kid` | Key Identifier | Key ID from signing key creation |

### Making Requests

```bash
curl 'https://stats.mux.com/live-stream-health?token={JWT}'
```

**Response:**

```json
{
  "data": [
    {
      "ingest_health": {
        "updated_at": "2022-11-14T17:32:23",
        "stream_drift_session_avg": 384,
        "stream_drift_deviation_from_rolling_avg": 12,
        "status": "excellent"
      }
    }
  ]
}
```

## Simulcasting

Simulcasting (also known as restreaming, live syndication, or RTMP passthrough) enables forwarding live streams to third-party social platforms like YouTube, Facebook, and Twitch.

### Supported Platforms

Mux Simulcasting works with any RTMP or RTMPS server, including:

- Facebook Live
- YouTube Live
- Twitch
- Crowdcast
- Vimeo

**Not Supported:** Instagram (only supports going live from the Instagram app)

### Adding Simulcast Targets

Add Simulcast Targets when creating a live stream or anytime afterward. Targets can only be added while the live stream is not active.

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

### RTMP Credentials

Each Simulcast Target requires:

- `url`: RTMP hostname including application name for the third-party service
- `stream_key`: Stream identifier/password for the third-party service

**Security Note:** Stream keys are sensitive credentials and should be treated like API keys or passwords.

### Recommended Settings

For simulcasting, recommend to end users: 4,000 kbps at 720p resolution with 2-second keyframe intervals.

### Limits and Pricing

- Maximum of 6 simulcast targets per live stream
- Simulcasting has additional cost on top of live streaming (pay per use)

## Simulated Live Streaming

Simulated live (also called pre-recorded live, scheduled live, or pseudo-live) broadcasts pre-recorded video as if it were live. Mux does not currently support this directly as a feature, but several workarounds exist.

### Option 1: Third-Party Service

Use a dedicated simulated live streaming service like restream.io:

1. Upload your video to the service
2. Enter Mux RTMP ingest server details
3. Schedule the time for the stream to go live

### Option 2: Build Your Own Server

Build a server using encoder software like ffmpeg or GStreamer to ingest video files and send output to Mux RTMP ingest URL.

**Requirements:**

- Handle network blips gracefully
- Handle disconnects (ffmpeg does not have built-in disconnect handling)
- Rigorous testing with different content types and long-running streams

### Option 3: UI-Based Simulation

Use on-demand video and simulate the live experience in your UI:

- Hide the player timeline to prevent seeking
- Sync playhead to server time for simultaneous viewing
- Display visual indicators (e.g., red "live" dot)

This approach avoids the complexity of live streaming infrastructure while providing a synchronized viewing experience.
