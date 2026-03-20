# Text Tracks and Audio Configuration

Reference for adding subtitles, captions, auto-generated captions, transcripts, and alternate audio tracks to video assets for accessibility and multi-language support.

## Subtitles vs Captions

Understanding the distinction between subtitles and captions:

- **Subtitles**: Text on screen for translation purposes
- **Captions**: Text on screen for deaf and hard of hearing audiences, includes non-speech audio descriptions like `[crowd cheers]`

Mux supports both as "text tracks" in WebVTT or SRT format. When adding captions (not subtitles), set `closed_captions: true` on the text track.

## Supported File Formats

Mux accepts subtitle/caption files in:

- **WebVTT** (.vtt) - Web Video Text Tracks format
- **SRT** (.srt) - SubRip subtitle format

Example WebVTT format:

```
00:28.000 --> 00:30.000 position:90% align:right size:35%
...you have your robotics, and I
just want to be awesome in space.

00:31.000 --> 00:33.000 position:90% align:right size:35%
Why don't you just admit that
you're freaked out by my robot hand?
```

## Adding Subtitles/Captions to Assets

### At Asset Creation Time

Include text tracks as part of the input array when creating an asset. The video file must be the first input, followed by any number of text tracks:

```json
{
  "inputs": [
    {
      "url": "{VIDEO_INPUT_URL}"
    },
    {
      "url": "https://example.com/subtitles-en.vtt",
      "type": "text",
      "text_type": "subtitles",
      "closed_captions": false,
      "language_code": "en",
      "name": "English"
    },
    {
      "url": "https://example.com/subtitles-fr.vtt",
      "type": "text",
      "text_type": "subtitles",
      "closed_captions": false,
      "language_code": "fr",
      "name": "Francais"
    }
  ],
  "playback_policies": ["public"],
  "video_quality": "basic"
}
```

### Text Track Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL to the WebVTT or SRT file |
| `type` | string | Must be `"text"` |
| `text_type` | string | Must be `"subtitles"` |
| `closed_captions` | boolean | Set to `true` for captions (includes non-speech audio), `false` for subtitles |
| `language_code` | string | BCP-47 language code (e.g., `en`, `es`, `fr`) |
| `name` | string | Display name for the track (e.g., "English", "Spanish") |

### Adding Tracks to Existing Assets

Use the Create Asset Track API to add text tracks after asset creation. The asset must be in the `ready` state:

```
POST /video/v1/assets/{ASSET_ID}/tracks
```

This is useful for:
- Adding captions to live stream recordings after they finish
- Updating or adding languages after initial upload

## Showing Subtitles by Default

Add the `default_subtitles_lang` playback modifier to the HLS stream URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?default_subtitles_lang=en
```

The value must be a valid BCP-47 language code. If no exact match exists, the closest match of the same language is selected (e.g., `en-US` track selected for `default_subtitles_lang=en`).

Video players will display the default text track for autoplaying videos even when muted.

**Important for signed URLs**: Include the `default_subtitles_lang` parameter in your signed token.

## Auto-Generated Captions

Mux uses OpenAI's Whisper model to automatically generate captions for on-demand assets.

### Capabilities and Limitations

- Works best with reasonably clear audio
- May perform less well with non-speech audio (music, background noise, extended silence)
- Designed for same-language captioning only, not translation
- No additional charge - included in standard encoding and storage costs
- Processing time: approximately 0.1x content duration (1 hour video takes about 6 minutes)

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
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
| Catalan | ca | Beta |
| Turkish | tr | Beta |
| Swedish | sv | Beta |
| Ukrainian | uk | Beta |
| Norwegian | no | Beta |
| Finnish | fi | Beta |
| Slovak | sk | Beta |
| Greek | el | Beta |
| Czech | cs | Beta |
| Croatian | hr | Beta |
| Danish | da | Beta |
| Romanian | ro | Beta |
| Bulgarian | bg | Beta |

Beta languages may have lower accuracy.

### Enable at Asset Creation

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "...",
      "generated_subtitles": [
        {
          "language_code": "en",
          "name": "English CC"
        }
      ]
    }
  ],
  "playback_policies": ["public"],
  "video_quality": "basic"
}
```

### Enable with Direct Uploads

```json
// POST /video/v1/uploads
{
  "new_asset_settings": {
    "playback_policies": ["public"],
    "video_quality": "basic",
    "inputs": [
      {
        "generated_subtitles": [
          {
            "language_code": "en",
            "name": "English CC"
          }
        ]
      }
    ]
  },
  "cors_origin": "*"
}
```

### Retroactively Add Auto-Generated Captions

Add captions to existing assets by posting to the generate-subtitles endpoint:

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

**For self-service customers**: Add captions to any asset using this API.

**For contract customers**: Assets older than 7 days may require contacting support.

### Webhook for Caption Completion

Auto-captioning runs separately from initial asset ingest. Listen for the `video.asset.track.ready` webhook with `"text_source": "generated_vod"` to know when captions are ready.

### Correcting Auto-Generated Captions

To fix recognition errors:

1. Download the VTT file: `https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt`
2. Edit the VTT file with your preferred text editor
3. Delete the autogenerated track using the Delete Track API
4. Add a new track with the edited VTT file using the Create Track API

## Retrieving Transcripts

For assets with a `ready` auto-generated captions track, retrieve a plain text transcript:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.txt
```

For WebVTT format:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
```

For signed assets, include a JWT token:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.txt?token={JWT}
```

The JWT requires the same `aud` claim used for video playback.

To find the `TRACK_ID`, retrieve the asset and look in the `tracks` array for the track with the corresponding `track.id`.

**Use cases for transcripts**: Content moderation, sentiment analysis, summarization, extracting insights, and more.

## Alternate Audio Tracks (Multi-Track Audio)

Add alternate audio tracks for:
- Multi-language support
- Accessibility
- Alternative audio experiences (e.g., director's commentary)

### Setting Primary Audio Track Language

When creating an asset, specify the language and name of the primary audio track:

```json
// POST https://api.mux.com/video/assets
{
  "inputs": [
    {
      "url": "{VIDEO_INPUT_URL}",
      "language_code": "en",
      "name": "English"
    }
  ],
  "playback_policies": ["public"],
  "video_quality": "basic"
}
```

The `language_code` must be a BCP-47 language tag (e.g., `en`, `es`, `fr`). The `name` is optional but recommended - if omitted, it will be generated from the language code. Assets without language/name set will have the primary track labeled "Default" with no language.

### Adding Alternate Audio Tracks

Use the Create Asset Track API once the asset is in `ready` state:

```json
// POST https://api.mux.com/video/assets/{ASSET_ID}/tracks
{
  "url": "https://example.com/french-audio.m4a",
  "type": "audio",
  "language_code": "fr",
  "name": "Francais"
}
```

**Supported audio formats**: M4A, WAV, MP3, and most other audio file formats and codecs.

**Requirements**:
- Asset must be in `ready` state
- `language_code` is required for alternate audio tracks
- `name` is optional (auto-generated from language code if not provided)
- Call the API once per alternate audio track

### Playback with Multi-Track Audio

When alternate audio tracks are processed, Mux automatically adds them to the HLS playback URL.

**Player support**: Mux Player, Video.js, ExoPlayer, AVPlayer, and many other players support multi-track audio out of the box. Players without support will play the primary audio track.

Switching between audio tracks varies by player but typically appears as a menu option (in Mux Player, click the waveform icon).

## Workflow for Third-Party Subtitle Generation

For human-generated or machine-generated subtitles from services like Rev.com or Simon Says:

1. Create a Mux asset (via Direct Upload, input URL, or live stream recording)
2. Add `mp4_support` to the asset at creation or afterward
3. Wait for `video.asset.static_renditions.ready` webhook
4. Send the MP4 file to your subtitle service
5. When the subtitle track (SRT or WebVTT) is ready, add it to your asset using the Create Asset Track API

## Accessibility Considerations

The A11Y project checks videos for accessibility. The `jsx-a11y/media-has-caption` linting rule may fail because it looks for a `<track>` attribute, but Mux includes subtitles via the HLS manifest. If you have added text tracks to your Mux videos, you can safely disable this linting rule.
