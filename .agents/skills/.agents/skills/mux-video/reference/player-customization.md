# Player Customization

Complete guide to customizing Mux Player appearance and behavior, including themes, colors, CSS styling, control visibility, keyboard shortcuts, poster images, and caption styling.

## Poster Image Customization

### Default Poster

By default, Mux Player pulls the poster image from the middle of the video based on the Playback ID:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg
```

### Changing the Poster Image

**Option 1: Using thumbnail-time**

Pass `thumbnail-time` (React: `thumbnailTime`) with the time in seconds:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" thumbnail-time="5"></mux-player>
```

Note: `thumbnail-time` is not available when using Signed URLs. For signed URLs, add the `time=` parameter to your signed token.

**Option 2: Using a custom poster URL**

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" poster="https://example.com/custom-poster.jpg"></mux-player>
```

### Placeholder While Poster Loads

Use the `placeholder` attribute with a Data URL for immediate display:

```html
<mux-player
  playback-id="{playbackId}"
  placeholder="{blurDataUrl}"
  style="aspect-ratio: {aspectRatio}"
></mux-player>
```

**Server-side placeholder generation with @mux/blurup:**

```js
import { createBlurUp } from '@mux/blurup';

const muxPlaybackId = 'O6LdRc0112FEJXH00bGsN9Q31yu5EIVHTgjTKRkKtEq1k';

const getPlaceholder = async () => {
  const { blurDataURL, aspectRatio } = await createBlurUp(muxPlaybackId, {});
  // Returns a Data URL with a lightweight multicolor gradient
};
```

If using a custom `thumbnailTime`, pass it to `createBlurUp`:

```js
createBlurUp(playbackId, { time: customThumbTime })
```

## Adding a Video Title

Use the `title` attribute to display a title in the top left corner:

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  title="My Video Title"
></mux-player>
```

Note: This is different from `metadata-video-title`, which is a Mux Data metadata field.

## CSS Styling

### Basic Styling

The Mux Player Web Component can be styled like any HTML element:

```css
mux-player {
  width: 100%;
  max-width: 800px;
  margin: 40px auto;
}
```

In React, use `styled-components` or the `style` prop directly.

### Aspect Ratio

Set the aspect ratio to prevent Cumulative Layout Shift:

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

Wrap the player in a div with border-radius:

```html
<div style="border-radius: 10px; overflow: hidden; display: flex;">
  <mux-player></mux-player>
</div>
```

### Video Size and Position

Control how video is sized within the element:

```css
mux-player {
  --media-object-fit: cover;
  --media-object-position: center;
}
```

## Color Customization

| HTML Attribute | React Prop | Description |
|----------------|------------|-------------|
| `accent-color` | `accentColor` | Color used to accent the controls |
| `primary-color` | `primaryColor` | Color of the control icons |
| `secondary-color` | `secondaryColor` | Background color of the control bar |

**HTML Example:**

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  accent-color="#FF5733"
  primary-color="#FFFFFF"
  secondary-color="#000000"
></mux-player>
```

**React Example:**

```jsx
<MuxPlayer
  playbackId="YOUR_PLAYBACK_ID"
  accentColor="#FF5733"
  primaryColor="#FFFFFF"
  secondaryColor="#000000"
/>
```

### Controls Backdrop Color

Set the background color behind the controls:

```css
mux-player {
  --controls-backdrop-color: rgb(0 0 0 / 60%);
}
```

Note: The backdrop is off by default. Ensure sufficient contrast for accessibility (WCAG 2.1 compliance).

## Hiding Controls with CSS

### Individual Controls

Use CSS variables to hide specific controls:

```css
mux-player {
  --seek-backward-button: none;
  --seek-forward-button: none;
}
```

Inline CSS is also supported:

```html
<mux-player
  style="--seek-backward-button: none; --seek-forward-button: none;"
></mux-player>
```

### Control Sections

Target specific sections by prefixing CSS variables:

- `top` - Top control bar (visible on small player sizes)
- `center` - Center controls (seek forward/backward, play button)
- `bottom` - Bottom control bar

```html
<mux-player
  style="--center-controls: none; --top-captions-button: none;"
></mux-player>
```

### All Available CSS Variables

```css
mux-player {
  /* Hide all controls at once */
  --controls: none;

  /* Hide the error dialog */
  --dialog: none;

  /* Hide the loading indicator */
  --loading-indicator: none;

  /* Target all sections by excluding the section prefix */
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

  /* Target a specific section */
  --center-controls: none;
  --bottom-play-button: none;
}
```

### CSS Parts

Use the `::part()` selector to style internal components:

```html
<style>
  mux-player::part(center play button) {
    display: none;
  }
</style>
<mux-player playback-id="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"></mux-player>
```

**Supported parts:** `live`, `layer`, `media-layer`, `poster-layer`, `vertical-layer`, `centered-layer`, `gesture-layer`, `top`, `center`, `bottom`, `play`, `button`, `seek-backward`, `seek-forward`, `mute`, `captions`, `airplay`, `pip`, `cast`, `fullscreen`, `playback-rate`, `volume`, `range`, `time`, `display`.

CSS parts can target individual elements (`::part(center play button)`) or multiple elements (`::part(button)`).

## Themes

Mux Player is built on Media Chrome, which provides theming capabilities. Themes are unavailable for the iframe embed.

### Minimal Theme

A pared-down experience with bare bones controls:

```jsx
import "@mux/mux-player/themes/minimal";

<MuxPlayer
  playbackId="YOUR_PLAYBACK_ID"
  theme="minimal"
/>
```

### Microvideo Theme

Optimized for shorter content:

```html
<script src="@mux/mux-player/themes/microvideo"></script>

<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  theme="microvideo"
></mux-player>
```

### Classic Theme

The classic 1.x version of Mux Player:

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  theme="classic"
></mux-player>
```

### Theme-Specific Button Visibility

These themes have some buttons disabled by default. Enable them with CSS:

| Button | CSS Variable |
|--------|-------------|
| Seek backward button | `--seek-backward-button: block;` |
| Seek forward button | `--seek-forward-button: block;` |
| PiP button | `--pip-button: block;` |

### Custom Media Chrome Themes

Create custom themes via:

1. **Inline template:** `<template id="mytheme">`
2. **Custom element:** `<media-theme-mytheme>`

## Behavior Customization

### Mute

Start playback muted:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" muted></mux-player>
```

### Skip Forward/Backward

Change the skip duration (default: 10 seconds):

| Attribute (HTML) | React Prop | Description |
|------------------|------------|-------------|
| `forward-seek-offset` | `forwardSeekOffset` | Seconds to skip forward |
| `backward-seek-offset` | `backwardSeekOffset` | Seconds to skip backward |

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  forward-seek-offset="5"
  backward-seek-offset="5"
></mux-player>
```

### Closed Captions

Disable captions appearance by default (control still visible):

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  default-hidden-captions
></mux-player>
```

React: `defaultHiddenCaptions`

### Start Time

Set a specific start timestamp:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" start-time="13"></mux-player>
```

When `start-time` is provided, it also sets `thumbnail-time` if not explicitly provided.

### Looping Content

Enable automatic looping:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" loop></mux-player>
```

**Background video example (no controls, autoplay, muted, looped):**

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

## Autoplay Options

| Attribute (HTML) | Prop (React) | Behavior |
|------------------|--------------|----------|
| `autoplay` | `autoPlay` | Tries to autoplay with sound (likely to fail) |
| `autoplay="muted"` | `autoPlay="muted"` | Autoplays muted (likely to work) |
| `autoplay="any"` | `autoPlay="any"` | Tries with sound first, falls back to muted |

## Keyboard Shortcuts (Hotkeys)

Default hotkeys are enabled when the player or controls are focused.

### Default Hotkeys

| Key | Name to turn off | Behavior |
|-----|------------------|----------|
| Space | `nospace` | Toggle playback |
| `c` | `noc` | Toggle captions/subtitles |
| `k` | `nok` | Toggle playback |
| `m` | `nom` | Toggle mute |
| `f` | `nof` | Toggle fullscreen |
| Left arrow | `noarrowleft` | Seek back 10s |
| Right arrow | `noarrowright` | Seek forward 10s |

### Disable All Hotkeys

```html
<mux-player
  nohotkeys
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
></mux-player>
```

For iframe embed:
```html
<iframe
  src="https://player.mux.com/EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs?nohotkeys=true"
></iframe>
```

Via JavaScript:

```js
const player = document.querySelector("mux-player");
player.nohotkeys = true;  // disable
player.nohotkeys = false; // re-enable
```

### Disable Specific Hotkeys

Via HTML attribute:

```html
<mux-player
  hotkeys="noarrowleft noarrowright"
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
></mux-player>
```

For iframe embed:
```html
<iframe
  src="https://player.mux.com/EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs?hotkeys=noarrowleft%20noarrowright"
></iframe>
```

Via JavaScript (DOM Token List API):

```js
const player = document.querySelector("mux-player");

// Turn off arrow key seeking
player.hotkeys.add("noarrowright", "noarrowleft");

// Re-enable
player.hotkeys.remove("noarrowright", "noarrowleft");
```

## Caption Styling

Basic caption styling with cross-browser support:

```css
mux-player::part(media-layer) {
  -webkit-text-fill-color: red;
  -webkit-text-stroke: 1px blue;
}
```

Despite the `-webkit-` prefix, these properties have good cross-browser support. More advanced caption styling will be available in future versions.

## Preloading Assets

Use the `preload` attribute with values:

- `"none"` - Load nothing until user tries to play
- `"metadata"` - Load minimum data (duration info)
- `"auto"` - Start loading immediately (best startup time)

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" preload="auto"></mux-player>
```

Notes:
- Default behavior varies by browser (most use `"auto"`, Chrome uses `"metadata"`)
- On mobile devices, `preload` is always `none`
- Using `"metadata"` or `"none"` preserves bandwidth but increases startup time

## Custom Storyboards

Override the default storyboard WebVTT source:

```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  storyboard-src="https://example.com/custom-storyboard.vtt"
></mux-player>
```

React: `storyboardSrc`

## Debugging

Enable verbose logging with the `debug` attribute:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" debug></mux-player>
```

This enables logging from:
- Mux Player (prefixed with `[mux-player]`)
- HLS.js
- Mux Data

Set `debug` before setting `playback-id` for full logging.

## Disabling Cookies

Disable Mux Data cookies:

```html
<mux-player playback-id="YOUR_PLAYBACK_ID" disable-cookies></mux-player>
```

React: `disableCookies`

Set before `playback-id` to take effect.

## Re-using Player Instances

Change the playback ID to reuse a player instance:

**React:**
```jsx
<MuxPlayer playbackId={newPlaybackId} />
```

**Web Component:**
```js
const muxPlayer = document.querySelector('mux-player');

// Using setAttribute
muxPlayer.setAttribute('playback-id', 'new-playback-id-xxx');

// Using the property
muxPlayer.playbackId = 'new-playback-id-xxx';
```

## Iframe Embed Limitations

When using the player.mux.com iframe embed, the following are unavailable:

- CSS styling (no access to CSS Custom Properties)
- Custom themes
- JavaScript events
- `::part()` selectors

However, iframe embeds do support:
- Color attributes via URL parameters
- Hotkey configuration via URL parameters
- Control via Player.js spec
- Automatic placeholder generation
