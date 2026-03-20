# Playback Modifiers and Resolution Control

Playback modifiers are optional parameters added to video playback URLs that allow you to change the behavior of the stream you receive from Mux. This guide covers all available modifiers including resolution control, rendant streams, instant clipping, and subtitles configuration.

## Applying Playback Modifiers

Mux Video supports two different playback policies: `public` and `signed`. The method to add modifiers differs based on the policy type.

### Public Playback URLs (Query String)

For public playback IDs, add modifiers as query parameters:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?{MODIFIER_NAME}={MODIFIER_VALUE}
```

Multiple modifiers can be combined:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?max_resolution=720p&rendition_order=desc
```

### Signed Playback URLs (JWT Claims)

For signed playback IDs, modifiers must be encoded in the JWT token:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?token={TOKEN}
```

Add modifiers to the claims body in the JWT payload. See the Secure video playback guide for details about adding query parameters to signed tokens.

## Available Playback Modifiers Reference

| Modifier | Available Values | Default Value | Description |
| :-- | :-- | :-- | :-- |
| `max_resolution` | `270p`, `360p`, `480p`, `540p`, `720p`, `1080p`, `1440p`, `2160p` | none | Sets the maximum resolution of renditions included in the manifest |
| `min_resolution` | `270p`, `360p`, `480p`, `540p`, `720p`, `1080p`, `1440p`, `2160p` | none | Sets the minimum resolution of renditions included in the manifest |
| `rendition_order` | `desc` | Automatically ordered by Mux's internal logic | Sets the order of renditions in the HLS manifest |
| `redundant_streams` | `true`, `false` | `false` | Includes HLS redundant streams in the manifest |
| `default_subtitles_lang` | A BCP47 compliant language code | none | Sets which subtitles/captions language should be the default |
| `program_start_time` | An epoch timestamp | none | Sets the start time for instant clipping from a live stream |
| `program_end_time` | An epoch timestamp | none | Sets the end time for instant clipping from a live stream |
| `asset_start_time` | Time (in seconds) | none | Sets the relative start time for instant clipping |
| `asset_end_time` | Time (in seconds) | none | Sets the relative end time for instant clipping |
| `roku_trick_play` | `true`, `false` | `false` | Adds support for timeline hover previews on Roku devices |

## Resolution Control

### Default Playback Behavior

The default playback URL contains all available resolutions of your video. The resolutions available depend on the video source file:

- If the source file contains 1080p or higher, the highest resolution provided by Mux will be 1080p
- If the source file is lower than 1080p, the highest resolution available will be the resolution of the source
- For 4K content, higher resolutions including 2.5K and 4K are available

Default playback URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

Use the default playback URL for most use cases. The video player will determine the best resolution based on the available bandwidth of the viewer.

### Maximum Resolution (`max_resolution`)

The `max_resolution` parameter modifies the maximum resolution available for the player to choose from:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?max_resolution=720p
```

**Available values:** `270p`, `360p`, `480p`, `540p`, `720p`, `1080p`, `1440p`, `2160p`

**Use cases:**
- Reduce delivery costs
- Build tiered features where certain viewers receive lower resolution video
- Control bandwidth usage for specific playback scenarios

**Note:** Not all resolutions are available for all assets. If you specify a max resolution that is not available for the asset, Mux will limit the resolution to the highest resolution available below the one you specified. For example, if you specify `max_resolution=1080p` but the highest resolution available for the asset is 720p, the manifest will be capped at 720p.

### Minimum Resolution (`min_resolution`)

The `min_resolution` parameter modifies the minimum resolution available for the player to choose from:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?min_resolution=720p
```

**Available values:** `270p`, `360p`, `480p`, `540p`, `720p`, `1080p`, `1440p`, `2160p`

**Use cases:**
- Omit lowest quality renditions from the HLS manifest when visual quality is critical
- Live streams with detailed screen share content
- Content where minimum quality standards must be maintained

**Note:** Not all resolutions are available for all assets. If you specify a min resolution that is not available for the asset, Mux will limit the resolution to the next highest resolution available below the one you specified.

### Rendition Order (`rendition_order`)

By default, the top resolution in the playlist is one of the middle resolutions. Many players start with the first one listed, so this default behavior strikes a balance between quality and bandwidth.

To change this behavior, use `rendition_order=desc`:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?rendition_order=desc
```

This sorts the list of renditions from highest (highest quality, most bandwidth) to lowest (lowest quality, least bandwidth). Players that start with the first rendition in the list will attempt to start playback with the highest resolution.

**Tradeoff:** Users on slow connections will experience increased startup time.

## Redundant Streams

Enable HLS redundant streams in the manifest for delivery redundancy:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?redundant_streams=true
```

## Instant Clipping Parameters

These modifiers allow you to create clips from live streams or assets without creating a new asset:

### Program Time (Epoch Timestamps)

Use for live streams with known wall-clock times:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?program_start_time=1609459200&program_end_time=1609462800
```

- `program_start_time`: Epoch timestamp for clip start
- `program_end_time`: Epoch timestamp for clip end

### Asset Time (Relative Seconds)

Use for clips with known offset times within an asset:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?asset_start_time=30&asset_end_time=90
```

- `asset_start_time`: Start time in seconds from the beginning of the asset
- `asset_end_time`: End time in seconds from the beginning of the asset

## Subtitles Configuration

### Default Subtitles Language

Set which subtitles/captions language should be enabled by default:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?default_subtitles_lang=en
```

The value must be a BCP47 compliant language code (e.g., `en`, `es`, `fr`, `de`).

## Platform-Specific Usage

### Mux Player

Mux Player supports `min_resolution`, `max_resolution`, and `rendition_order` as attributes on the web component and props on the React component.

**Web Component:**

```html
<mux-player max-resolution="720p"></mux-player>
```

**React:**

```jsx
<MuxPlayer maxResolution="720p" />
```

When setting these attributes, Mux Player will internally add them as query parameters on the streaming URL.

**With Signed URLs:** Parameters should be encoded in the `playback-token` attribute (or `tokens.playback` in React).

### AVPlayer on iOS

Set the playback modifier by appending a `URLQueryItem` to the playback URL:

**Swift:**

```swift
var components = URLComponents(string: "https://stream.mux.com/\(playbackId).m3u8")!
components.queryItems = [URLQueryItem(name: "max_resolution", value: "720p")]
let player = AVPlayer(url: components.url!)
```

**Objective-C:**

```objc
NSURLComponents *components = [NSURLComponents componentsWithString:
    [NSString stringWithFormat:@"https://stream.mux.com/%@.m3u8", playbackId]];
components.queryItems = @[[NSURLQueryItem queryItemWithName:@"max_resolution" value:@"720p"]];
AVPlayer *player = [[AVPlayer alloc] initWithURL:components.URL];
```

## Combining Multiple Modifiers

Multiple modifiers can be combined in a single URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?max_resolution=1080p&min_resolution=480p&rendition_order=desc&default_subtitles_lang=en
```

For signed URLs, include all modifiers in the JWT claims body.
