# Web Player Integrations

Comprehensive guide for integrating Mux Data with web-based video players including Video.js, HLS.js, Shaka Player, Dash.js, and other popular HTML5 players. Covers installation, initialization, metadata configuration, and advanced options.

## Overview

Mux Data provides SDKs for monitoring video playback performance across a variety of web-based video players. Each integration collects metrics including quality of experience, engagement data, and playback analytics. All SDKs follow semantic versioning and the API will not change between major releases.

## Supported Players

| Player | Package | CDN Path |
|--------|---------|----------|
| Video.js | `videojs-mux` | `https://src.litix.io/videojs/5/videojs-mux.js` |
| HLS.js | `mux-embed` | `https://src.litix.io/core/4/mux.js` |
| Dash.js | `mux-embed` | `https://src.litix.io/core/4/mux.js` |
| Shaka Player | `@mux/mux-data-shakaplayer` | `https://src.litix.io/shakaplayer/5/shakaplayer-mux.js` |
| HTML5 Video | `mux-embed` | `https://src.litix.io/core/4/mux.js` |
| Bitmovin | `@mux/mux-data-bitmovin` | `https://src.litix.io/bitmovin/5/bitmovin-mux.js` |
| Flowplayer | `@mux/mux-data-flowplayer` | `https://src.litix.io/flowplayer/3/flowplayer-mux.js` |
| JW Player | `@mux/mux-data-jwplayer` | `https://src.litix.io/jwplayer/4/jwplayer-mux.js` |

---

## Video.js

### Installation

**npm:**
```bash
npm install --save videojs-mux
```

**yarn:**
```bash
yarn add videojs-mux
```

**CDN:**
```html
<script src="https://src.litix.io/videojs/5/videojs-mux.js"></script>
```

### Initialization

Call video.js like you normally would and include the Mux plugin options:

```js
videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      data: {
        env_key: 'ENV_KEY', // required
        // Site Metadata
        viewer_user_id: '', // ex: '12345'
        experiment_name: '', // ex: 'player_test_A'
        sub_property_id: '', // ex: 'cus-1'
        // Player Metadata
        player_name: '', // ex: 'My Main Player'
        player_version: '', // ex: '1.0.0'
        // There is no need to provide player_init_time, tracked automatically
        // Video Metadata
        video_id: '', // ex: 'abcd123'
        video_title: '', // ex: 'My Great Video'
        video_series: '', // ex: 'Weekly Great Videos'
        video_duration: '', // in milliseconds, ex: 120000
        video_stream_type: '', // 'live' or 'on-demand'
        video_cdn: '' // ex: 'Fastly', 'Akamai'
      }
    }
  }
});
```

### Update Metadata

```js
// player is the instance returned by the `videojs` function
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program (live stream):**
```js
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Ads Tracking

If you are using `videojs-ima`, Brightcove's IMA3 FreeWheel or OnceUX plugins with VideoJS, `videojs-mux` will track ads automatically. No extra configuration is needed.

---

## HLS.js

### Installation

**npm:**
```bash
npm install --save mux-embed
```

**yarn:**
```bash
yarn add mux-embed
```

**CDN:**
```html
<script src="https://src.litix.io/core/4/mux.js"></script>
```

### Initialization

Call `mux.monitor` and pass in a valid CSS selector or the video element itself. In the SDK options, be sure to pass in the `hlsjs` instance and the `Hls` constructor:

```js
mux.monitor('#my-player', {
  debug: false,
  hlsjs: hls,
  Hls,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

If the `Hls` constructor is available on the global `window` object, it can be omitted from the SDK options.

### Late HLS.js Initialization

If your player does not immediately have access to the HLS.js player instance, you can start monitoring at any time:

```js
mux.addHLSJS("#my-player", options)
// or
myVideoEl.mux.addHLSJS(options)
```

### Update Metadata

```js
mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
mux.emit('#my-player', 'videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
mux.emit('#my-player', 'programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

---

## Dash.js

### Installation

**npm:**
```bash
npm install --save mux-embed
```

**yarn:**
```bash
yarn add mux-embed
```

**CDN:**
```html
<script src="https://src.litix.io/core/4/mux.js"></script>
```

### Initialization

Call `mux.monitor` and pass in a valid CSS selector or the video element itself. In the SDK options, be sure to pass in the `dashjs` player instance:

```js
mux.monitor('#my-player', {
  debug: false,
  dashjs: dashjsPlayer,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

### Late Dash.js Initialization

If your player does not immediately have access to the dash.js player instance:

```js
mux.addDashJS("#my-player", options)
// or
myVideoEl.mux.addDashJS(options)
```

### Update Metadata

```js
mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
mux.emit('#my-player', 'videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
mux.emit('#my-player', 'programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

---

## Shaka Player

### Installation

**npm:**
```bash
npm install --save @mux/mux-data-shakaplayer
```

**yarn:**
```bash
yarn add @mux/mux-data-shakaplayer
```

**CDN:**
```html
<script src="https://src.litix.io/shakaplayer/5/shakaplayer-mux.js"></script>
```

### Initialization

Call `new shaka.Player` like you normally would and get the return value (a reference to the `player`). Call `initShakaPlayerMux` with the player reference and the SDK options:

```js
initShakaPlayerMux(player, {
  debug: false,
  data: {
    env_key: 'ENV_KEY',
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

### Passing in the Shaka Global

The 3rd argument to `initShakaPlayerMux` is the `shaka` object. If you are using a bundler and importing `shaka` with `require` or `import`, you need to pass in the `shaka` object. If no `shaka` object is passed in, `initShakaPlayerMux` will look for `shaka` on the global `window` object.

### Update Metadata

```js
// player is the instance returned by `new shaka.Player`
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Ads Tracking

The Shaka player integration does not have a built-in integration for tracking ad playback. If you need to track ads played within Shaka player, you will need to build a custom integration.

---

## HTML5 Video Element

Use this integration if Mux does not have an SDK specific for your player. While this SDK works with any modern HTML5 video player, player-specific Mux SDKs are preferable because they offer deeper integration and collect more pieces of data.

### Installation

**npm:**
```bash
npm install --save mux-embed
```

**yarn:**
```bash
yarn add mux-embed
```

**CDN:**
```html
<script src="https://src.litix.io/core/4/mux.js"></script>
```

### Initialization

Call `mux.monitor` and pass in a valid CSS selector or the video element itself:

```js
mux.monitor('#my-player', {
  debug: false,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

If you use a CSS selector that matches multiple elements, the first matching element in the document will be used.

### Update Metadata

```js
mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
const myPlayer = document.querySelector('#my-player');
myPlayer.src = 'https://muxed.s3.amazonaws.com/leds.mp4';

mux.emit('#my-player', 'videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
mux.emit('#my-player', 'programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

---

## Bitmovin Player

### Installation

**npm:**
```bash
npm install --save @mux/mux-data-bitmovin
```

**yarn:**
```bash
yarn add @mux/mux-data-bitmovin
```

**CDN:**
```html
<!-- Include bitmovin-mux after the core Bitmovin javascript file -->
<script src="https://cdn.bitmovin.com/player/web/8/bitmovinplayer.js"></script>
<script src="https://src.litix.io/bitmovin/5/bitmovin-mux.js"></script>
```

### Initialization

Call `bitmovin.player.Player` like you normally would. Call `initBitmovinMux` with the player reference and the SDK options:

```js
initBitmovinMux(player, {
  debug: false,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000, can use `initBitmovinMux.utils.now()`
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

### Update Metadata

```js
// player is the instance returned by the `bitmovin.player.Player` function
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Ads Tracking

Mux supports Bitmovin's VAST advertising client for pre-, mid-, and post-roll ads. Configure these plugins as you would normally, and Mux will track ads automatically. No additional configuration is needed.

---

## Flowplayer

### Installation

**npm:**
```bash
npm install --save @mux/mux-data-flowplayer
```

**yarn:**
```bash
yarn add @mux/mux-data-flowplayer
```

**CDN:**
```html
<!-- include flowplayer-mux after the other flowplayer libraries -->
<link rel="stylesheet" href="https://releases.flowplayer.org/7.2.1/skin/skin.css">
<script src="https://releases.flowplayer.org/7.2.1/flowplayer.min.js"></script>
<script src="https://src.litix.io/flowplayer/3/flowplayer-mux.js"></script>
```

### Initialization

Call `flowplayer` like you normally would and save a reference to the player. Call `initFlowplayerMux` with the player reference:

```js
initFlowplayerMux(player, container, {
  debug: false,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000, can use `initFlowplayerMux.utils.now()`
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

### Passing in the Flowplayer Global

The 3rd argument to `initFlowplayerMux` is `flowplayer`. If you are using a bundler and importing `flowplayer` with `require` or `import`, you need to pass in the `flowplayer` object. If no `flowplayer` object is passed in, `initFlowplayerMux` will look for `flowplayer` on the global `window` object.

### Update Metadata

```js
// player is the instance that gets returned from the `flowplayer` function
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Ads Tracking

Mux supports Flowplayer's IMA and VAST plugins for ad support. No additional configuration is needed; Mux will track ads automatically.

---

## JW Player (Web)

### Installation

**npm:**
```bash
npm install --save @mux/mux-data-jwplayer
```

**yarn:**
```bash
yarn add @mux/mux-data-jwplayer
```

**CDN:**
```html
<!-- Include jwplayer-mux after the core JW Player JavaScript file -->
<!-- Note that the KEY should be replaced with your JW Player account key -->
<script src="https://content.jwplatform.com/libraries/KEY.js"></script>
<script src="https://src.litix.io/jwplayer/4/jwplayer-mux.js"></script>
```

### Initialization

Be sure to call `initJWPlayerMux` immediately after initializing JW Player so that Mux can attach as soon as possible:

```js
initJWPlayerMux(player, {
  debug: false,
  data: {
    env_key: 'ENV_KEY', // required
    // Site Metadata
    viewer_user_id: '', // ex: '12345'
    experiment_name: '', // ex: 'player_test_A'
    sub_property_id: '', // ex: 'cus-1'
    // Player Metadata
    player_name: '', // ex: 'My Main Player'
    player_version: '', // ex: '1.0.0'
    player_init_time: '', // ex: 1451606400000, you can use `initJWPlayerMux.utils.now()`
    // Video Metadata
    video_id: '', // ex: 'abcd123'
    video_title: '', // ex: 'My Great Video'
    video_series: '', // ex: 'Weekly Great Videos'
    video_duration: '', // in milliseconds, ex: 120000
    video_stream_type: '', // 'live' or 'on-demand'
    video_cdn: '' // ex: 'Fastly', 'Akamai'
  }
});
```

### Update Metadata

```js
// player is the instance returned by the `jwplayer` function
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Changing the Video

**New source:**
```js
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

**New program:**
```js
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Ads Tracking

Mux supports JW Player's VAST integration for pre-, mid-, and post-roll ads. Configure these plugins as you would normally, and Mux will track ads automatically. No additional configuration is needed.

Other JW Player ad integrations, such as Google IMA and FreeWheel have not been tested, but may work out of the box.

### Latency Metrics

Mux supports latency metrics by parsing the incoming HLS manifest. JW Player allows manifest interception using an `onXhrOpen` hook. This is not available in Safari browsers where HLS is played natively.

```js
var player = jwplayer('my-player').setup({
  playlist: [{
    sources: [{
      file: 'video.m3u8',
      onXhrOpen: function(xhr, url) {
        player.mux && player.mux.onXhrOpen(xhr, url);
      }
    }]
  }]
});

// Initialize Mux Data monitoring
initJWPlayerMux(player, {
  // ...
});
```

---

## Common Metadata Fields

All player integrations support the same metadata fields:

### Required Fields

| Field | Description |
|-------|-------------|
| `env_key` | Your Mux environment key (required) |

### Site Metadata

| Field | Description | Example |
|-------|-------------|---------|
| `viewer_user_id` | Unique identifier for the viewer | `'12345'` |
| `experiment_name` | Name of the experiment for A/B testing | `'player_test_A'` |
| `sub_property_id` | Sub-property identifier | `'cus-1'` |

### Player Metadata

| Field | Description | Example |
|-------|-------------|---------|
| `player_name` | Name of the player instance | `'My Main Player'` |
| `player_version` | Version of your player implementation | `'1.0.0'` |
| `player_init_time` | Timestamp when player was initialized | `1451606400000` |

### Video Metadata

| Field | Description | Example |
|-------|-------------|---------|
| `video_id` | Unique identifier for the video | `'abcd123'` |
| `video_title` | Title of the video | `'My Great Video'` |
| `video_series` | Series the video belongs to | `'Weekly Great Videos'` |
| `video_duration` | Duration in milliseconds | `120000` |
| `video_stream_type` | Type of stream | `'live'` or `'on-demand'` |
| `video_cdn` | CDN provider | `'Fastly'`, `'Akamai'` |

---

## Advanced Options

All web player integrations support the following advanced options:

### Disable Cookies

```js
// Example with mux.monitor (HLS.js, Dash.js, HTML5)
mux.monitor('#my-player', {
  debug: false,
  disableCookies: true,
  data: {
    env_key: 'ENV_KEY',
    // ...
  }
});

// Example with Video.js
videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      disableCookies: true,
      data: {
        env_key: "ENV_KEY",
        // ...
      }
    }
  }
});
```

### Respect Do Not Track

```js
mux.monitor('#my-player', {
  debug: false,
  respectDoNotTrack: true, // Disable tracking of browsers where Do Not Track is enabled
  data: {
    env_key: 'ENV_KEY',
    // ...
  }
});
```

### Custom Error Tracking

Errors tracked by Mux are considered fatal, meaning they are the result of playback failures. If errors are non-fatal they should not be captured.

**Emit a custom error:**
```js
// For mux.monitor integrations
mux.emit('#my-player', 'error', {
  player_error_code: 100,
  player_error_message: 'Description of error',
  player_error_context: 'Additional context for the error'
});

// For player-specific SDKs (Video.js, Bitmovin, etc.)
player.mux.emit('error', {
  player_error_code: 100,
  player_error_message: 'Description of error',
  player_error_context: 'Additional context for the error'
});
```

### Error Translator

Transform error codes and messages before they are sent to Mux:

```js
function errorTranslator (error) {
  return {
    player_error_code: translateCode(error.player_error_code),
    player_error_message: translateMessage(error.player_error_message),
    player_error_context: translateContext(error.player_error_context)
  };
}

mux.monitor('#my-player', {
  debug: false,
  errorTranslator: errorTranslator,
  data: {
    env_key: 'ENV_KEY',
    // ...
  }
});
```

### Disable Automatic Error Tracking

```js
mux.monitor('#my-player', {
  debug: false,
  automaticErrorTracking: false,
  data: {
    env_key: 'ENV_KEY',
    // ...
  }
});
```

### Custom Beacon Collection Domain

```js
mux.monitor('#my-player', {
  debug: false,
  beaconCollectionDomain: 'CUSTOM_DOMAIN', // ex: 'foo.bar.com'
  data: {
    env_key: 'ENV_KEY',
    // ...
  }
});
```

---

## TypeScript Support (Beta)

`mux-embed` provides TypeScript type definitions. To use them, add a triple slash directive at the top of your `.ts` or `.tsx` file:

```ts
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../node_modules/mux-embed/dist/types/mux-embed.d.ts"/>
import mux from 'mux-embed';

// ...

let videoEl?: HTMLVideoElement;

// This should now be type valid
videoEl?.mux.destroy();
```

The triple slash directive requires passing in the relevant path from your `.ts` or `.tsx` file to the source `.d.ts` file in `node_modules/`.

---

## Troubleshooting

**If you are not seeing data:**
- Check if you have an ad blocker, tracking blocker, or network firewall that prevents your player from sending requests to Mux Data servers
- Verify your `env_key` is correct
- Log in to the Mux dashboard and find the environment that corresponds to your `env_key` and look for video views
- It takes about a minute or two from tracking a view for it to show up on the Metrics tab

**Debug mode:**
Set `debug: true` in your configuration to enable verbose logging to the console.
