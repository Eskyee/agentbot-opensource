# Player Setup and Integration

Detailed guide on integrating Mux Player into web applications using various frameworks (React, Vue, Svelte), embedding via iframe, providing playback IDs and metadata, and using Video.js kit as an alternative player.

## Mux Player Overview

Mux Player has 2 packages:

- `@mux/mux-player`: The web component, compatible with all frontend frameworks
- `@mux/mux-player-react`: The React component, for usage in React

Both are built with TypeScript and can be installed via npm, yarn, or loaded from a CDN. The web component can also be used as an iframe embed.

## Installation Methods

### NPM

```shell
npm install @mux/mux-player@latest #or @mux/mux-player-react@latest
```

### Yarn

```shell
yarn add @mux/mux-player@latest #or @mux/mux-player-react@latest
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
<!--
or
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player-react" defer></script>
-->
```

### Iframe Embed

```html
<iframe
  src="https://player.mux.com/{PLAYBACK_ID}"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

## Playback IDs and HLS URLs

Each asset and live stream in Mux can have one or more Playback IDs. Playback IDs can have a policy of `"public"` or `"signed"`.

Example playback ID from an asset or live stream:

```json
"playback_ids": [
  {
    "policy": "public",
    "id": "uNbxnGLKJ00yfbijDO8COxTOyVKT01xpxW"
  }
]
```

### Creating HLS URLs

HLS is a standard protocol for streaming video over the internet. HLS URLs end with the extension `.m3u8`. Use your playback ID to create an HLS URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

## Providing Attributes

Two recommended values to provide to the player:

- **Playback ID**: Used to create a URL that describes where the video can be streamed from
- **metadata**: Information about the video to be tracked by Mux Data (at minimum: `video_id`, `video_title`, and `viewer_user_id`)

### HTML Web Component Attributes

Using JavaScript to assign as a property on the element:

```js
document.querySelector("mux-player").metadata = { video_id: "video-id-123" };
```

Or add as attributes to the player in HTML using the `metadata-*` prefix:

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata-video-id="video-id-123456"
  metadata-video-title="Big Buck Bunny"
  metadata-viewer-user-id="user-id-bc-789"
>
```

### HTML Embed Attributes

Add supported attributes to the URL as query parameters. Remember that query parameters should be URL encoded using `encodeURIComponent()`:

```html
<iframe
  src="https://player.mux.com/{PLAYBACK_ID}?metadata-video-id=video-id-123456&metadata-video-title=Big%20Buck%20Bunny&metadata-viewer-user-id=user-id-bc-789"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

### React Attributes

In React, attributes are camelCased rather than kebab-cased. For example, `playback-id` becomes `playbackId`. The `metadata` is specified as an object in props:

```jsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata={{
    video_id: 'video-id-123456',
    video_title: 'Big Buck Bunny',
    viewer_user_id: 'user-id-bc-789',
  }}
></MuxPlayer>
```

## Framework Integration Examples

### React

```jsx
import MuxPlayer from '@mux/mux-player-react';

function VideoPlayer() {
  return (
    <MuxPlayer
      playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
      metadata={{
        video_id: 'video-id-123456',
        video_title: 'Big Buck Bunny',
        viewer_user_id: 'user-id-bc-789',
      }}
    />
  );
}
```

When using the React version, the `Player Software` in Mux Data will show as `mux-player-react`.

### Svelte

Since Svelte supports web components, use the `@mux/mux-player` component:

```html
<script context="module" lang="ts">
  export const prerender = true;
</script>

<script lang="ts">
  import { onMount } from "svelte";
  onMount(async () => {
    await import("@mux/mux-player");
  });
</script>

<mux-player
  playback-id="g65IqSFtWdpGR100c2W8VUHrfIVWTNRen"
  metadata-video-id="video-id-54321"
  metadata-video-title="Svelte Kit: Episode 2"
  metadata-viewer-user-id="user-id-sveltekit007"
/>
```

### Vue

Since Vue supports web components, use the `@mux/mux-player` component:

```html
<script setup lang="ts">
  import "@mux/mux-player";
</script>

<template>
  <main>
    <mux-player
      playback-id="g65IqSFtWdpGR100c2W8VUHrfIVWTNRen"
      metadata-video-id="video-id-54321"
      metadata-video-title="Vue 3: Episode 2"
      metadata-viewer-user-id="user-id-vue3007"
    />
  </main>
</template>
```

## Mux Data Player Software Identification

- HTML element version: `mux-player`
- HTML embed (iframe) version: `mux-player-iframe`
- React version: `mux-player-react`

## Lazy Loading Mux Player

Improve page load performance by lazy-loading the Mux Player.

### React Lazy Loading

After installing `@mux/mux-player-react`, import from the lazy module:

```jsx
import MuxPlayer from '@mux/mux-player-react/lazy';
```

Depending on your bundler, your import might look different:

- `@mux/mux-player-react/lazy`
- `@mux/mux-player-react/dist/lazy.mjs`
- `@mux/mux-player-react/dist/lazy`

Note: Mux Player React Lazy is not available when using the hosted option on jsdelivr.com.

### Preventing Cumulative Layout Shift

Because the player is added to the DOM after the page loads, it can cause cumulative layout shift. To prevent this, provide an `aspectRatio` style property:

```jsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  style={{ aspectRatio: 16/9 }}
/>
```

### Loading Attribute Options

Mux Player React Lazy accepts a `loading` attribute:

| Value | Behavior |
|-------|----------|
| `loading="page"` | Loads the player after the page loads and initial JavaScript bundle executes |
| `loading="viewport"` | (Default) Extends `page` by also waiting until the placeholder enters the viewport |

### Custom Placeholders

While loading, the player displays a placeholder with the same background color as the player (default: black). You can provide a custom placeholder using the `placeholder=` attribute and generate placeholders that match your video poster with `@mux/blurup`:

```js
// Server-Side
import { createBlurUp } from '@mux/blurup';

const options = {};
const muxPlaybackId = 'O6LdRc0112FEJXH00bGsN9Q31yu5EIVHTgjTKRkKtEq1k';

const getPlaceholder = async () => {
  const { blurDataURL, aspectRatio } = await createBlurUp(muxPlaybackId, options);
  console.log(blurDataURL, aspectRatio);
  // data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" ...
};
```

### Lazy Loading with Other Frameworks

For environments supporting dynamic imports (Webpack, Rollup, Parcel, modern browsers), use a dynamic import to load Mux Player:

```js
// Use dynamic import to load Mux Player
const loadPlayer = async () => {
  await import("@mux/mux-player");
  // Replace placeholder with player
};
```

## Video.js Kit Integration

Video.js kit is a project built on Video.js with additional Mux-specific functionality:

- Timeline hover previews
- Mux Data integration
- `playback_id` helper (automatically generates full playback URL)

### Installation

```text
// npm
npm install @mux/videojs-kit

// yarn
yarn add @mux/videojs-kit
```

### JavaScript Import

```js
import videojs from '@mux/videojs-kit';
import '@mux/videojs-kit/dist/index.css';
```

### CDN Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/videojs-kit@latest/dist/index.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mux/videojs-kit@latest/dist/index.css">
```

### Basic HTML Setup

```html
<video
  id="my-player"
  class="video-js vjs-16-9"
  controls
  preload="auto"
  width="100%"
  data-setup='{}'
>
  <source src="{PLAYBACK_ID}" type="video/mux" />
</video>
```

### Video.js Default Playback Engine

As of version 0.8.0, you can use Video.js's default playback engine instead of hls.js:

For import:
```js
import videojs from '@mux/videojs-kit/dist/index.vhs.js';
```

For script tag:
```html
<script src="https://unpkg.com/@mux/videojs-kit@latest/dist/index.vhs.js"></script>
```

### Timeline Hover Preview

Enable by setting `timelineHoverPreviews: true`:

```html
<video id="my-player" class="video-js vjs-16-9" controls preload="auto" width="100%"
  data-setup='{
    "timelineHoverPreviews": true
  }'
>
  <source src="{PLAYBACK_ID}" type="video/mux" />
</video>
```

### Enable Mux Data

```html
<video id="my-player" class="video-js vjs-16-9" controls preload="auto" width="100%"
  data-setup='{
    "plugins": {
      "mux": {
        "debug": true,
        "data":{
          "env_key": "ENV_KEY",
          "video_title": "Example Title"
        }
      }
    }
  }'
>
  <source src="{PLAYBACK_ID}" type="video/mux" />
</video>
```

### JavaScript Initialization

```html
<video id="my-player" class="video-js vjs-16-9" controls preload="auto" width="100%">
</video>

<script>
const player = videojs('my-player', {
  timelineHoverPreviews: true,
  plugins: {
    mux: {
      debug: false,
      data: {
        env_key: 'ENV_KEY',
        video_title: 'Example Title'
      }
    }
  }
});

player.src({
  src: "{PLAYBACK_ID}",
  type: "video/mux",
});
</script>
```

### Signed URL Playback

For signed playback, append the JWT token to the playback ID:

```html
<video id="my-player" class="video-js vjs-16-9" controls preload="auto" width="100%" data-setup="{}">
  <source src="{PLAYBACK_ID}?token={JWT_VIDEO_TOKEN}" type="video/mux" />
</video>
```

Or with JavaScript:

```js
player.src({
  src: `{PLAYBACK_ID}?token={JWT_VIDEO_TOKEN}`,
  type: `video/mux`,
});
```

### Timeline Hover Preview with Signed URLs

For signed URLs, use `timelineHoverPreviewsUrl` instead of `timelineHoverPreviews`:

```html
<video id="my-player"
  class="video-js vjs-16-9"
  controls
  preload="auto"
  width="100%"
  data-setup='{
    "timelineHoverPreviewsUrl": "https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt?token={JWT_STORYBOARD_TOKEN}"
  }'>
  <source src="{PLAYBACK_ID}?token={JWT_VIDEO_TOKEN}" type="video/mux" />
</video>
```

Or use the JavaScript API:

```js
player.timelineHoverPreviews({
  enabled: true,
  src: "https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt?token={JWT_STORYBOARD_TOKEN}"
});
```

To disable timeline hover previews:

```js
player.timelineHoverPreviews({
  enabled: false,
});
```

### Quality Selector

As of v0.10.0, Video.js kit includes `videojs-contrib-quality-levels` and `videojs-http-source-selector` plugins (not enabled by default).

Enable via data-setup:

```html
<video id="my-player" class="video-js vjs-16-9" controls preload="auto" width="100%"
  data-setup='{
    "plugins": {
      "mux": {
        "debug": true,
        "data":{
          "env_key": "ENV_KEY",
          "video_title": "Example Title"
        }
      },
      "httpSourceSelector": {}
    }
  }'
>
  <source src="{PLAYBACK_ID}" type="video/mux" />
</video>
```

Or call manually:

```js
player.httpSourceSelector();
```

### Webpack Configuration for Other Plugins

When using additional Video.js plugins, configure webpack's resolve.alias:

```js
config.resolve = {
  alias: {
    'video.js': 'video.js/core',
  }
};
```

### Configuring hls.js Options

```js
videojs('mux-default', {
  html5: {
    hls: {
      capLevelToPlayerSize: true
    }
  }
});
```

## Other Popular HLS Players

You can use any HLS-compatible player with Mux videos:

| Player | Type | HLS Support |
|--------|------|-------------|
| HLS.js | Free/Open Source | Core library, no UI components |
| Plyr.io | Free/Open Source | Requires HLS.js integration |
| Video.js | Free/Open Source | Native since v7 |
| JWPlayer | Commercial | Native |
| Brightcove Player | Commercial | Native (built on Video.js) |
| Bitmovin Player | Commercial | Native |
| THEOplayer | Commercial | Native (custom HLS engine) |
| Agnoplay | Commercial | Full HLS support |

## Mux Video Element

For a simpler alternative to Mux Player, use the `<mux-video>` element - a drop-in replacement for HTML5 `<video>` that works with Mux and has Mux Data automatically configured:

- HTML: `@mux/mux-video`
- React: `@mux/mux-video-react`

## Advanced Playback Features

### Redundant Streams

Add delivery redundancy to survive CDN failures:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?redundant_streams=true
```

If using signed playback URLs, include `redundant_streams` in your signed token.

**Player support for redundant streams:**

| Player | Version | Manifest 4xx | Manifest 5xx | Media 4xx | Media 5xx |
|--------|---------|--------------|--------------|-----------|-----------|
| Video.js | >= 7.6.6 | Yes | Yes | Yes | Yes |
| HLS.js | >= 0.14.11 | Yes | Yes | Yes | Yes |
| JWPlayer | Production Release | Yes | Yes | Yes | Yes |
| Safari iOS (AVPlayer) | >= iOS 13.6.1 | Yes | Yes | Yes | Yes |
| Safari MacOS | >= 13.1.2 | Yes | Yes | Yes | Yes |
| ExoPlayer | >= r2.12.0 | Yes | Yes | Yes | Yes |

### Subtitles/Closed Captions

Mux includes subtitles/closed captions text tracks in HLS for playback. Download sidecar files:

```
https://stream.mux.com/{PLAYBACK_ID}/text/{TRACK_ID}.vtt
```

## Mobile Platform Support

### iOS/tvOS

The default player (AVPlayer) supports HLS natively. Use VideoPlayer struct from SwiftUI and AVKit.

### Android

ExoPlayer supports HLS natively with no extra configuration needed.
