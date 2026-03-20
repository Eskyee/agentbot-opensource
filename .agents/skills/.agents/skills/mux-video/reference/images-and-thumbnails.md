# Images, Thumbnails, and Storyboards

This guide covers extracting images from videos including static thumbnails, animated GIFs, and storyboards for timeline hover previews. All image requests are made to `image.mux.com` using a playback ID.

## Static Thumbnails

To get an image from a video, make a request to `image.mux.com` in the following format:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.{png|jpg|webp}
```

Images can be served in `webp`, `png`, or `jpg` format. WebP typically yields smaller file sizes while maintaining good quality.

### Thumbnail Query Parameters

| Parameter   | Type      | Description |
|:------------|:----------|:------------|
| `time`      | `float`   | The time (in seconds) of the video timeline where the image should be pulled. Defaults to the middle of the original video. |
| `width`     | `int32`   | The width of the thumbnail (in pixels). Defaults to the width of the original video. |
| `height`    | `int32`   | The height of the thumbnail (in pixels). Defaults to the height of the original video. |
| `rotate`    | `int32`   | Rotate the image clockwise by the given number of degrees. Valid values are `90`, `180`, and `270`. |
| `fit_mode`  | `string`  | How to fit a thumbnail within width + height. Valid values are `preserve`, `stretch`, `crop`, `smartcrop`, and `pad`. |
| `flip_v`    | `boolean` | Flip the image top-bottom after performing all other transformations. |
| `flip_h`    | `boolean` | Flip the image left-right after performing all other transformations. |
| `latest`    | `boolean` | When set to `true`, pulls the latest thumbnail from an ongoing live stream. Can only be used with live streams. |

### Fit Mode Options

- **`preserve`** (default): Preserves the aspect ratio of the video while fitting the image within the requested width and height. For example, if the thumbnail width is 100, the height is 100, and the video aspect ratio is 16:9, the delivered image will be 100x56.
- **`stretch`**: The thumbnail will exactly fill the requested width and height, even if it distorts the image. Requires both width and height.
- **`crop`**: The video image will be scaled up or down until it fills the requested width and height box. Pixels outside the box will be cropped off. The crop is always centered. Requires both width and height.
- **`smartcrop`**: An algorithm attempts to find an area of interest in the image and center it within the crop while fitting the requested dimensions. Requires both width and height.
- **`pad`**: Similar to preserve but adds black padding (letterbox or pillar box) to make the image fit the exact requested dimensions. Allows maintaining aspect ratio while always getting thumbnails of the same size. Requires both width and height.

### Thumbnail Example

Request a 400x200 PNG using smartcrop from 35 seconds into the video:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.png?width=400&height=200&fit_mode=smartcrop&time=35
```

### Rate Limits

There is a default limit of 1 thumbnail and 1 GIF for every 10 seconds of duration per asset. For assets under 100 seconds in duration, the limit is 10 thumbnails and 10 GIFs.

Examples:
- 5 minute asset: 30 thumbnails and 30 GIFs
- 30 second asset: 10 thumbnails and 10 GIFs

## Animated GIFs

To get an animated GIF or WebP from a video, make a request in the following format:

```
https://image.mux.com/{PLAYBACK_ID}/animated.{gif|webp}
```

### Animated GIF Query Parameters

| Parameter | Type    | Description |
|:----------|:--------|:------------|
| `start`   | `float` | The time (in seconds) where the animated GIF should begin. Defaults to 0. |
| `end`     | `float` | The time (in seconds) where the GIF ends. Defaults to 5 seconds after the start. Maximum total duration is 10 seconds; minimum is 250ms. |
| `width`   | `int32` | The width in pixels. Default is 320px. If height is provided without width, width is determined by preserving aspect ratio. Max width is 640px. |
| `height`  | `int32` | The height in pixels. Default is determined by preserving aspect ratio with the width. Maximum height is 640px. |
| `fps`     | `int32` | The frame rate of the generated GIF. Defaults to 15 fps. Max 30 fps. |

### Animated GIF Example

Request a 640px wide GIF at 5fps:

```
https://image.mux.com/{PLAYBACK_ID}/animated.gif?width=640&fps=5
```

## Storyboards (Timeline Hover Previews)

Timeline hover previews (also known as trick play or scrub bar previews) make player operations like fast-forward, rewind, and seeking more visual. Each image shown when hovering over the scrub bar is part of a larger storyboard image.

A storyboard is a collection of thumbnails created from video frames at regular time intervals, arranged in a grid layout.

### Storyboard Image Request

```
https://image.mux.com/{PLAYBACK_ID}/storyboard.{png|jpg|webp}
```

### Storyboard Tile Count

- Assets less than 15 minutes: 50 tiles
- Assets 15 minutes or longer: 100 tiles

### WebVTT Metadata

Most video players use WebVTT files to describe individual tiles of the storyboard image.

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt
```

Example WebVTT response:

```
WEBVTT

00:00:00.000 --> 00:01:06.067
https://image.mux.com/Dk8pvMnvTeqDk9dy5nqmXz02MM4YtdElW/storyboard.jpg#xywh=0,0,256,160

00:01:06.067 --> 00:02:14.067
https://image.mux.com/Dk8pvMnvTeqDk9dy5nqmXz02MM4YtdElW/storyboard.jpg#xywh=256,0,256,160

00:02:14.067 --> 00:03:22.067
https://image.mux.com/Dk8pvMnvTeqDk9dy5nqmXz02MM4YtdElW/storyboard.jpg#xywh=512,0,256,160
```

To use WebP format for the storyboard image referenced in the VTT:

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt?format=webp
```

#### Compatible Video Players

- VideoJS + VTT Thumbnails plugin
- JW Player
- THEOplayer
- Bitmovin
- Flow Player
- Plyr

**Note:** WebVTT files may be limited to HTML5 browser-based video players and may not be supported in device-specific SDKs including iOS and Android. These platforms typically use HLS iFrame Playlists.

### JSON Metadata

For custom implementations or chromeless players like hls.js, storyboard metadata is available in JSON format:

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.json
```

Example JSON response:

```json
{
  "url": "https://image.mux.com/Dk8pvMnvTeqDk9dy5nqmXz02MM4YtdElW/storyboard.jpg",
  "tile_width": 256,
  "tile_height": 160,
  "duration": 6744.1,
  "tiles": [
    {
      "start": 0,
      "x": 0,
      "y": 0
    },
    {
      "start": 66.066667,
      "x": 256,
      "y": 0
    },
    {
      "start": 134.066667,
      "x": 512,
      "y": 0
    }
  ]
}
```

To use WebP format:

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.json?format=webp
```

## Common Use Cases

### Poster Image for Video Player

Add a poster image to display before playback starts:

```html
<video id="my-video" width="640" height="360" poster="https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg" controls>
```

### Preview GIF on Hover

Show a preview GIF when users hover over a video thumbnail in a catalog. This can be implemented with CSS, JavaScript, or another method that fits your application.

### Live Stream Latest Thumbnail

For active live streams, use `?latest=true` to get the latest thumbnail, which refreshes every 10 seconds:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?latest=true
```

This is useful for:
- Moderation and classification workflows
- Discovery experiences showing active live streams

**Note:** Using the `latest` parameter on a VOD asset or non-live stream returns a 400 error.

## Roku Trick Play

To support Roku's channel certification requirements for trick play on on-demand video longer than 15 minutes, add the `roku_trick_play` modifier to playback requests:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?roku_trick_play=true
```

This includes an Image Media Playlist in the HLS manifest.

**Important:** When using signed playback URLs, include `roku_trick_play` in your signed token.

## CORS Requirements

Storyboard URLs use the `image.mux.com` hostname while video playback uses `stream.mux.com`. Because these are different hostnames, add the `crossorigin` attribute to your video element:

```html
<video crossorigin="anonymous" src="...">
```

## Signed URLs

If your playback ID uses a `signed` playback policy, you must sign requests for images, animated GIFs, and storyboards. The signing process is the same as for video playback URLs.

**Important:** Do not use individual thumbnail requests for storyboards. Use the dedicated storyboard endpoints instead, which are optimized for timeline hover previews.
