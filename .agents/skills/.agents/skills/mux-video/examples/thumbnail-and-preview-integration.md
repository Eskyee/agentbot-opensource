# Thumbnail and Preview Integration Examples

Examples for integrating thumbnails and storyboards into video players and catalogs, including poster images, hover previews, and timeline scrubbing with various player libraries.

## Getting Thumbnails from Videos

### Basic Thumbnail Request

Request a thumbnail image from any Mux video using the playback ID:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.{png|jpg|webp}
```

Supported formats:
- `webp` - Smaller file size with good quality (recommended)
- `png` - Lossless compression
- `jpg` - Standard lossy compression

### Thumbnail Query Parameters

| Parameter   | Type      | Description                                                                                           |
|:------------|:----------|:------------------------------------------------------------------------------------------------------|
| `time`      | `float`   | Time in seconds where the image should be pulled. Defaults to the middle of the video.                |
| `width`     | `int32`   | Width of the thumbnail in pixels. Defaults to original video width.                                   |
| `height`    | `int32`   | Height of the thumbnail in pixels. Defaults to original video height.                                 |
| `rotate`    | `int32`   | Rotate clockwise by degrees. Valid values: `90`, `180`, `270`.                                        |
| `fit_mode`  | `string`  | How to fit thumbnail within dimensions. Values: `preserve`, `stretch`, `crop`, `smartcrop`, `pad`.    |
| `flip_v`    | `boolean` | Flip the image top-bottom after other transformations.                                                |
| `flip_h`    | `boolean` | Flip the image left-right after other transformations.                                                |
| `latest`    | `boolean` | For live streams only - pulls the latest thumbnail (refreshed every 10 seconds).                      |

### Fit Mode Options

- **preserve** (default): Maintains aspect ratio while fitting within requested dimensions. A 100x100 request for 16:9 video returns 100x56.
- **stretch**: Exactly fills requested dimensions, may distort image. Requires both width and height.
- **crop**: Scales to fill requested box, crops overflow. Always centered. Requires both width and height.
- **smartcrop**: Algorithm finds area of interest and centers crop. Requires both width and height.
- **pad**: Like preserve but adds black letterbox/pillarbox padding to match exact dimensions. Requires both width and height.

### Thumbnail Example with Parameters

Request a 400x200 smartcropped PNG from the 35th second:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.png?width=400&height=200&fit_mode=smartcrop&time=35
```

## Adding Poster Images to Video Players

### HTML5 Video Element

```html
<video
  id="my-video"
  width="640"
  height="360"
  poster="https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg"
  controls>
  <source src="https://stream.mux.com/{PLAYBACK_ID}.m3u8" type="application/x-mpegURL">
</video>
```

### React/JSX Example

```jsx
function VideoPlayer({ playbackId }) {
  const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=1280&height=720&fit_mode=smartcrop`;

  return (
    <video
      width="100%"
      poster={posterUrl}
      controls
    >
      <source
        src={`https://stream.mux.com/${playbackId}.m3u8`}
        type="application/x-mpegURL"
      />
    </video>
  );
}
```

### Custom Poster with Time Selection

```jsx
function VideoWithCustomPoster({ playbackId, posterTime = 10 }) {
  const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.webp?time=${posterTime}&width=1920&height=1080&fit_mode=crop`;

  return (
    <video poster={posterUrl} controls>
      <source src={`https://stream.mux.com/${playbackId}.m3u8`} type="application/x-mpegURL" />
    </video>
  );
}
```

## Animated GIF Previews

### Basic Animated GIF Request

```
https://image.mux.com/{PLAYBACK_ID}/animated.{gif|webp}
```

### Animated GIF Query Parameters

| Parameter | Type    | Description                                                                                    |
|:----------|:--------|:-----------------------------------------------------------------------------------------------|
| `start`   | `float` | Start time in seconds. Defaults to 0.                                                          |
| `end`     | `float` | End time in seconds. Defaults to 5 seconds after start. Max duration: 10s, min duration: 250ms.|
| `width`   | `int32` | Width in pixels. Default: 320px, max: 640px.                                                   |
| `height`  | `int32` | Height in pixels. Determined by aspect ratio if only width provided. Max: 640px.               |
| `fps`     | `int32` | Frame rate of GIF. Default: 15fps, max: 30fps.                                                 |

### Animated GIF Example

640px wide GIF at 5fps:

```
https://image.mux.com/{PLAYBACK_ID}/animated.gif?width=640&fps=5
```

Custom time range (seconds 10-18):

```
https://image.mux.com/{PLAYBACK_ID}/animated.gif?start=10&end=18&width=480
```

## Video Catalog with Hover Previews

### CSS-Based Hover Preview

```html
<style>
  .video-card {
    position: relative;
    width: 320px;
    height: 180px;
    overflow: hidden;
  }

  .video-card .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-card .preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .video-card:hover .preview {
    opacity: 1;
  }
</style>

<div class="video-card">
  <img
    class="thumbnail"
    src="https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?width=320&height=180&fit_mode=crop"
    alt="Video thumbnail"
  />
  <img
    class="preview"
    src="https://image.mux.com/{PLAYBACK_ID}/animated.gif?width=320"
    alt="Video preview"
  />
</div>
```

### React Hover Preview Component

```jsx
import { useState } from 'react';

function VideoCard({ playbackId, title }) {
  const [isHovered, setIsHovered] = useState(false);

  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=320&height=180&fit_mode=crop`;
  const previewUrl = `https://image.mux.com/${playbackId}/animated.gif?width=320&fps=10`;

  return (
    <div
      className="video-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered ? previewUrl : thumbnailUrl}
        alt={title}
        loading="lazy"
      />
      <h3>{title}</h3>
    </div>
  );
}
```

### Lazy Loading Previews

```jsx
function VideoCardOptimized({ playbackId, title }) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.webp?width=320&height=180&fit_mode=crop`;
  const previewUrl = `https://image.mux.com/${playbackId}/animated.webp?width=320&fps=12`;

  // Preload GIF on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!previewLoaded) {
      const img = new Image();
      img.onload = () => setPreviewLoaded(true);
      img.src = previewUrl;
    }
  };

  return (
    <div
      className="video-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered && previewLoaded ? previewUrl : thumbnailUrl}
        alt={title}
      />
    </div>
  );
}
```

## Timeline Hover Previews (Storyboards)

Timeline hover previews show thumbnail images when users hover over the video player timeline/scrub bar.

### Storyboard Image Request

```
https://image.mux.com/{PLAYBACK_ID}/storyboard.{png|jpg|webp}
```

Storyboard images contain:
- 50 tiles for assets under 15 minutes
- 100 tiles for assets 15 minutes or longer

### Storyboard Metadata (WebVTT)

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt
```

Example WebVTT response:

```
WEBVTT

00:00:00.000 --> 00:01:06.067
https://image.mux.com/{PLAYBACK_ID}/storyboard.jpg#xywh=0,0,256,160

00:01:06.067 --> 00:02:14.067
https://image.mux.com/{PLAYBACK_ID}/storyboard.jpg#xywh=256,0,256,160

00:02:14.067 --> 00:03:22.067
https://image.mux.com/{PLAYBACK_ID}/storyboard.jpg#xywh=512,0,256,160
```

To use WebP format for the storyboard image:

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt?format=webp
```

### Storyboard Metadata (JSON)

```
GET https://image.mux.com/{PLAYBACK_ID}/storyboard.json
```

Example JSON response:

```json
{
  "url": "https://image.mux.com/{PLAYBACK_ID}/storyboard.jpg",
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

## Player Integration Examples

### Video.js with VTT Thumbnails

```html
<link href="https://vjs.zencdn.net/8.0.0/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.0.0/video.min.js"></script>
<script src="https://unpkg.com/videojs-vtt-thumbnails/dist/videojs-vtt-thumbnails.min.js"></script>

<video
  id="my-player"
  class="video-js"
  crossorigin="anonymous"
  controls
  poster="https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg"
>
  <source src="https://stream.mux.com/{PLAYBACK_ID}.m3u8" type="application/x-mpegURL">
</video>

<script>
  const player = videojs('my-player');

  player.vttThumbnails({
    src: 'https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt'
  });
</script>
```

### Compatible Video Players

The following players support WebVTT storyboard files:

- **Video.js** with [VTT Thumbnails plugin](https://www.npmjs.com/package/videojs-vtt-thumbnails)
- **JW Player** - [Documentation](https://docs.jwplayer.com/players/docs/ios-add-preview-thumbnails)
- **THEOplayer** - [Documentation](https://www.theoplayer.com/docs/theoplayer/how-to-guides/texttrack/how-to-implement-preview-thumbnails/)
- **Bitmovin** - [Demo](https://bitmovin.com/demos/thumbnail-seeking)
- **Flow Player** - [Demo](https://flowplayer.com/demos/video-thumbnails)
- **Plyr** - [plyr.io](https://plyr.io)

### Custom Timeline Preview with hls.js

For chromeless players like hls.js, use the JSON metadata:

```javascript
async function initTimelinePreview(playbackId) {
  // Fetch storyboard metadata
  const response = await fetch(`https://image.mux.com/${playbackId}/storyboard.json`);
  const storyboard = await response.json();

  // Preload storyboard image
  const storyboardImg = new Image();
  storyboardImg.src = storyboard.url;

  // Find tile for a given time
  function getTileForTime(timeInSeconds) {
    const tiles = storyboard.tiles;
    for (let i = tiles.length - 1; i >= 0; i--) {
      if (timeInSeconds >= tiles[i].start) {
        return tiles[i];
      }
    }
    return tiles[0];
  }

  // Render preview at hover position
  function showPreview(timeInSeconds, previewElement) {
    const tile = getTileForTime(timeInSeconds);

    previewElement.style.backgroundImage = `url(${storyboard.url})`;
    previewElement.style.backgroundPosition = `-${tile.x}px -${tile.y}px`;
    previewElement.style.width = `${storyboard.tile_width}px`;
    previewElement.style.height = `${storyboard.tile_height}px`;
  }

  return { getTileForTime, showPreview, storyboard };
}
```

### React Timeline Preview Component

```jsx
import { useEffect, useState, useRef } from 'react';

function TimelinePreview({ playbackId, currentHoverTime, visible }) {
  const [storyboard, setStoryboard] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    fetch(`https://image.mux.com/${playbackId}/storyboard.json`)
      .then(res => res.json())
      .then(setStoryboard);
  }, [playbackId]);

  if (!storyboard || !visible) return null;

  // Find the appropriate tile for the current hover time
  const tile = storyboard.tiles.reduce((prev, curr) => {
    return currentHoverTime >= curr.start ? curr : prev;
  }, storyboard.tiles[0]);

  return (
    <div
      ref={previewRef}
      style={{
        width: storyboard.tile_width,
        height: storyboard.tile_height,
        backgroundImage: `url(${storyboard.url})`,
        backgroundPosition: `-${tile.x}px -${tile.y}px`,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    />
  );
}
```

## Roku Trick Play Support

For Roku devices (required for on-demand content over 15 minutes):

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?roku_trick_play=true
```

This includes an Image Media Playlist in the HLS manifest for Roku certification compliance.

Note: When using signed URLs, include `roku_trick_play` in your signed token.

## CORS Requirements

Since storyboard URLs use `image.mux.com` and video playback uses `stream.mux.com`, add the `crossorigin` attribute to video elements:

```html
<video crossorigin="anonymous" controls>
  <source src="https://stream.mux.com/{PLAYBACK_ID}.m3u8" type="application/x-mpegURL">
</video>
```

## Signed URL Considerations

For videos with `signed` playback policy, you must sign image and storyboard requests. The signing process is the same as for video playback URLs.

## Rate Limits

Thumbnail and GIF requests have default limits:

- 1 thumbnail and 1 GIF per 10 seconds of asset duration
- Minimum of 10 thumbnails and 10 GIFs for assets under 100 seconds

Examples:
- 30-second video: 10 thumbnails, 10 GIFs
- 5-minute video: 30 thumbnails, 30 GIFs

## Live Stream Thumbnails

Get the latest frame from an active live stream:

```
https://image.mux.com/{LIVE_PLAYBACK_ID}/thumbnail.jpg?latest=true
```

- Thumbnail refreshes every 10 seconds
- Only works with active live streams
- Returns 400 error if used on VOD assets or inactive streams

Use cases:
- Moderation and content classification workflows
- Discovery experiences showing active live streams
- Live stream preview grids
