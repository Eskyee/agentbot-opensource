# Setting Up Mux Player for Web

This guide provides step-by-step instructions for setting up Mux Player in a web application using HTML, React, and iframe embed methods, including metadata configuration and basic customization.

## Overview

Mux Player is a drop-in component for playing Mux video assets in web applications. It supports:

- On-demand assets
- Live streams
- Low-latency live streams
- DVR mode for live or low-latency live streams

Mux Player is available in three forms:

| Package | Usage |
|---------|-------|
| `@mux/mux-player` | Web component (`<mux-player>`) compatible with all frontend frameworks |
| `@mux/mux-player-react` | React component (`<MuxPlayer />`) |
| iframe embed | `<iframe src="https://player.mux.com/{playbackId}">` |

Mux Player includes automatic integration with Mux Data, responsive UI based on player dimensions and stream type, automatic thumbnail previews and poster images, and modern capabilities like fullscreen, picture-in-picture, Chromecast, and AirPlay.

## Installation

### HTML Web Component

Install via npm:

```shell
npm install @mux/mux-player@latest
```

Or via yarn:

```shell
yarn add @mux/mux-player@latest
```

Or load from CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
```

### React Component

Install via npm:

```shell
npm install @mux/mux-player-react@latest
```

Or via yarn:

```shell
yarn add @mux/mux-player-react@latest
```

### iframe Embed

No installation required. Simply use the embed URL:

```html
<iframe
  src="https://player.mux.com/{PLAYBACK_ID}"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

## Basic Implementation

### HTML Web Component Example

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata-video-title="Test VOD"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

When using the HTML element version, the `Player Software` in Mux Data will show as `mux-player`.

### React Component Example

```jsx
import MuxPlayer from '@mux/mux-player-react';

<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata={{
    video_id: 'video-id-123456',
    video_title: 'Big Buck Bunny',
    viewer_user_id: 'user-id-bc-789',
  }}
/>
```

When using React, the `Player Software` in Mux Data will show as `mux-player-react`.

### iframe Embed Example

```html
<iframe
  src="https://player.mux.com/EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs?metadata-video-title=Test%20VOD&metadata-viewer-user-id=user-id-007"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

When using the iframe embed, the `Player Software` in Mux Data will show as `mux-player-iframe`.

Note: Query parameters in the iframe URL should be URL encoded. Use `encodeURIComponent()` in JavaScript to encode values.

## Metadata Configuration

Metadata is essential for tracking video analytics with Mux Data. At minimum, you should provide:

- `video_id`: Unique identifier for the video
- `video_title`: Human-readable title
- `viewer_user_id`: Identifier for the viewer

### HTML Web Component Metadata

Using attributes:

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata-video-id="video-id-123456"
  metadata-video-title="Big Buck Bunny"
  metadata-viewer-user-id="user-id-bc-789"
>
```

Using JavaScript:

```js
document.querySelector("mux-player").metadata = { video_id: "video-id-123" };
```

### React Metadata

```jsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata={{
    video_id: 'video-id-123456',
    video_title: 'Big Buck Bunny',
    viewer_user_id: 'user-id-bc-789',
  }}
/>
```

### iframe Embed Metadata

```html
<iframe
  src="https://player.mux.com/{PLAYBACK_ID}?metadata-video-id=video-id-123456&metadata-video-title=Big%20Buck%20Bunny&metadata-viewer-user-id=user-id-bc-789"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

## Basic Customization

### Accent Color

The default accent color is Mux pink (`#fa50b5`). Override it with your brand color:

HTML:

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  accent-color="#ea580c"
  metadata-video-title="Test VOD"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

React:

```jsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  accentColor="#ea580c"
  metadata={{
    videoTitle: "Test VOD",
    ViewerUserId: "user-id-007"
  }}
/>
```

### Color Variables

| HTML Attribute | React Prop | Description |
|---------------|------------|-------------|
| `accent-color` | `accentColor` | Changes the color used to accent the controls |
| `primary-color` | `primaryColor` | Changes the color of the control icons |
| `secondary-color` | `secondaryColor` | Sets the background color of the control bar |

### Video Title Display

Add a title in the top left corner (visible when the player is wide enough):

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  title="My Video Title"
></mux-player>
```

Note: This is different from `metadata-video-title`, which is for Mux Data analytics.

### CSS Styling

Style the player with CSS:

```css
mux-player {
  width: 100%;
  max-width: 800px;
  margin: 40px auto;
}
```

### Aspect Ratio

Set the aspect ratio to prevent layout shift:

```css
mux-player {
  aspect-ratio: 16 / 9;
}

/* For iframe embed */
iframe {
  aspect-ratio: 16 / 9;
}
```

### Rounded Corners

```html
<div style="border-radius: 10px; overflow: hidden; display: flex;">
  <mux-player></mux-player>
</div>
```

## Hiding Controls with CSS

Use CSS variables to hide specific controls:

```css
mux-player {
  --seek-backward-button: none;
  --seek-forward-button: none;
}
```

Or inline:

```html
<mux-player
  style="--seek-backward-button: none; --seek-forward-button: none;"
></mux-player>
```

### Available CSS Variables for Controls

```css
mux-player {
  /* Hide all controls at once */
  --controls: none;

  /* Hide the error dialog */
  --dialog: none;

  /* Hide the loading indicator */
  --loading-indicator: none;

  /* Individual control buttons */
  --play-button: none;
  --live-button: none;
  --seek-backward-button: none;
  --seek-forward-button: none;
  --mute-button: none;
  --captions-button: none;
  --airplay-button: none;
  --pip-button: none;
  --fullscreen-button: none;
  --cast-button: none;
  --playback-rate-button: none;
  --volume-range: none;
  --time-range: none;
  --time-display: none;
  --duration-display: none;
  --rendition-menu-button: none;

  /* Target specific sections */
  --center-controls: none;
  --bottom-play-button: none;
}
```

### Control Sections

Target specific sections by prefixing CSS vars:

- `top`: The top control bar (shown on small player size)
- `center`: Center controls (seek forward/backward, play button)
- `bottom`: The bottom control bar

```html
<mux-player
  style="--center-controls: none; --top-captions-button: none;"
></mux-player>
```

## Framework Examples

### Svelte

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

## Adaptive Controls

Mux Player automatically adjusts controls based on:

- **Stream type**: Different controls for live vs. on-demand content
- **Player size**: Controls are selectively hidden when they do not fit in the UI

In the latest version, stream type is automatically detected. For custom themes that need to know stream type immediately, set `stream-type` (`streamType` in React) to either `on-demand` or `live`.

The following features appear based on browser support detection:

- AirPlay
- Chromecast (requires extra configuration)
- Fullscreen
- Picture-in-picture button
- Volume controls

## Poster Image Configuration

By default, Mux Player pulls the poster image from the middle of the video:

`https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`

### Custom Thumbnail Time

Use `thumbnail-time` (React: `thumbnailTime`) with a value in seconds:

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  thumbnail-time="30"
></mux-player>
```

Note: `thumbnail-time` is not available with Signed URLs.

### Custom Poster URL

Use the `poster` attribute with any image URL:

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  poster="https://example.com/custom-poster.jpg"
></mux-player>
```

## Common Configuration Options

| Attribute (HTML) | Prop (React) | Description |
|-----------------|--------------|-------------|
| `muted` | `muted` | Start playback muted |
| `autoplay` | `autoPlay` | Basic autoplay (likely to fail) |
| `autoplay="muted"` | `autoPlay="muted"` | Muted autoplay (likely to work) |
| `autoplay="any"` | `autoPlay="any"` | Try with sound, fall back to muted |
| `loop` | `loop` | Loop playback |
| `start-time` | `startTime` | Set start time in seconds |
| `forward-seek-offset` | `forwardSeekOffset` | Seconds to skip forward (default: 10) |
| `backward-seek-offset` | `backwardSeekOffset` | Seconds to skip backward (default: 10) |
| `default-hidden-captions` | `defaultHiddenCaptions` | Hide captions by default |

### Background Video Example

For a looping background video without controls:

```html
<style>
  mux-player {
    --controls: none;
  }
</style>

<mux-player
  playback-id="23s11nz72DsoN657h4314PjKKjsF2JG33eBQQt6B95I"
  autoplay="muted"
  loop
></mux-player>
```

## Limitations of iframe Embed

When using the iframe embed through `player.mux.com`, you cannot:

- Use CSS to style the mux-player element directly
- Access CSS Custom Properties for hiding controls or styling
- Use the `--controls` CSS variable

The iframe embed does support URL query parameters for most configuration options like metadata, autoplay, and hotkeys.
