# Web Player Integration Examples

Practical code examples for integrating Mux Data with popular web video players, including Video.js plugin setup, HLS.js with mux-embed, and handling common scenarios like video changes, metadata updates, and error tracking.

## Video.js Integration with videojs-mux

### Installation

Install the videojs-mux plugin using npm, yarn, or CDN.

**npm:**
```bash
npm install videojs-mux
```

**yarn:**
```bash
yarn add videojs-mux
```

**CDN:**
```html
<script src="https://src.litix.io/videojs/5/videojs-mux.js"></script>
```

### Basic Initialization

Initialize Video.js with the Mux plugin enabled:

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
        // player_init_time: '', // ex: 1451606400000;
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

### Updating Metadata After Initialization

When metadata is not available at initialization time, update it later:

```js
// player is the instance returned by the `videojs` function
player.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Handling Video Changes

#### New Source (Same Player, Different Video)

When changing the video source without destroying the player:

```js
// player is the instance returned by the `videojs` function
player.mux.emit('videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

#### New Program (Live Stream Program Change)

When a new program starts within a live stream:

```js
// player is the instance returned by the `videojs` function
player.mux.emit('programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Advanced Options for Video.js

#### Disable Cookies

```js
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

#### Respect Do Not Track

```js
videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      respectDoNotTrack: true,
      data: {
        env_key: "ENV_KEY",
        // ...
      }
    }
  }
});
```

#### Custom Error Tracking

Emit custom fatal errors that occur outside the player context:

```js
// player is the instance returned by the `videojs` function
player.mux.emit('error', {
  player_error_code: 100,
  player_error_message: 'Description of error',
  player_error_context: 'Additional context for the error'
});
```

**Note:** Errors tracked by Mux are considered fatal, meaning they result from playback failures. Non-fatal errors should not be captured.

#### Error Translator

Transform error information before it is sent to Mux:

```js
function errorTranslator (error) {
  return {
    player_error_code: translateCode(error.player_error_code),
    player_error_message: translateMessage(error.player_error_message),
    player_error_context: translateContext(error.player_error_context)
  };
}

videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      errorTranslator,
      data: {
        env_key: "ENV_KEY",
        // ...
      }
    }
  }
});
```

#### Disable Automatic Error Tracking

```js
videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      automaticErrorTracking: false,
      data: {
        env_key: "ENV_KEY",
        // ...
      }
    }
  }
});
```

#### Custom Beacon Collection Domain

```js
videojs('#my-player', {
  plugins: {
    mux: {
      debug: false,
      beaconCollectionDomain: 'CUSTOM_DOMAIN', // ex: 'foo.bar.com'
      data: {
        env_key: "ENV_KEY",
        // ...
      }
    }
  }
});
```

### Ads Tracking

If you are using `videojs-ima`, Brightcove's IMA3, FreeWheel, or OnceUX plugins with Video.js, then `videojs-mux` will track ads automatically. No extra configuration is needed.

---

## HLS.js Integration with mux-embed

### Installation

Install mux-embed using npm, yarn, or CDN.

**npm:**
```bash
npm install mux-embed
```

**yarn:**
```bash
yarn add mux-embed
```

**CDN:**
```html
<script src="https://src.litix.io/core/5/mux.js"></script>
```

### Basic Initialization

Call `mux.monitor` and pass in a valid CSS selector or the video element itself, along with SDK options and metadata:

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

**Important notes:**
- If using a CSS selector that matches multiple elements, the first matching element is used
- Pass in both the `hlsjs` instance and the `Hls` constructor in SDK options
- If the `Hls` constructor is available on the global `window` object, it can be omitted from SDK options

### Deferred HLS.js Initialization

If your player does not immediately have access to the HLS.js instance, start monitoring later:

```js
mux.addHLSJS("#my-player", options)
// or
myVideoEl.mux.addHLSJS(options)
```

### Updating Metadata After Initialization

When metadata is not available at initialization time:

```js
mux.updateData({ video_title: 'My Updated Great Video' });
```

### Handling Video Changes

#### New Source

When changing the video source:

```js
mux.emit('#my-player', 'videochange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

#### New Program

When a new program starts within a live stream:

```js
mux.emit('#my-player', 'programchange', {
  video_id: 'abc345',
  video_title: 'My Other Great Video',
  video_series: 'Weekly Great Videos',
  // ...
});
```

### Advanced Options for HLS.js

#### Disable Cookies

```js
mux.monitor('#my-player', {
  debug: false,
  disableCookies: true,
  hlsjs: hls,
  Hls,
  data: {
    env_key: 'ENV_KEY',
    // ... rest of metadata
  }
});
```

#### Respect Do Not Track

```js
mux.monitor('#my-player', {
  debug: false,
  hlsjs: hls,
  Hls,
  respectDoNotTrack: true, // Disable tracking of browsers where Do Not Track is enabled
  data: {
    env_key: 'ENV_KEY',
    // ... rest of metadata
  }
});
```

#### Custom Error Tracking

Emit custom fatal errors:

```js
mux.emit('#my-player', 'error', {
  player_error_code: 100,
  player_error_message: 'Description of error',
  player_error_context: 'Additional context for the error'
});
```

**Note:** Errors tracked by Mux are considered fatal, meaning they result from playback failures. Non-fatal errors should not be captured.

#### Error Translator

Transform error information before sending to Mux:

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
  errorTranslator,
  hlsjs: hls,
  Hls,
  data: {
    env_key: 'ENV_KEY', // required
    // ... additional metadata
  }
});
```

#### Disable Automatic Error Tracking

```js
mux.monitor('#my-player', {
  debug: false,
  automaticErrorTracking: false,
  hlsjs: hls,
  Hls,
  data: {
    env_key: 'ENV_KEY', // required
    // ... additional metadata
  }
});
```

#### Custom Beacon Collection Domain

```js
mux.monitor('#my-player', {
  debug: false,
  beaconCollectionDomain: 'CUSTOM_DOMAIN', // ex: 'foo.bar.com'
  hlsjs: hls,
  Hls,
  data: {
    env_key: 'ENV_KEY', // required
    // ... additional metadata
  }
});
```

---

## Common Metadata Fields Reference

Both Video.js and HLS.js integrations support the same metadata fields:

| Category | Field | Description | Example |
|----------|-------|-------------|---------|
| **Required** | `env_key` | Your Mux environment key | `'abc123'` |
| **Site** | `viewer_user_id` | Unique viewer identifier | `'12345'` |
| **Site** | `experiment_name` | A/B test or experiment name | `'player_test_A'` |
| **Site** | `sub_property_id` | Sub-property identifier | `'cus-1'` |
| **Player** | `player_name` | Name of this player instance | `'My Main Player'` |
| **Player** | `player_version` | Version of your player | `'1.0.0'` |
| **Player** | `player_init_time` | Timestamp when player initialized | `1451606400000` |
| **Video** | `video_id` | Unique video identifier | `'abcd123'` |
| **Video** | `video_title` | Human-readable video title | `'My Great Video'` |
| **Video** | `video_series` | Series or playlist name | `'Weekly Great Videos'` |
| **Video** | `video_duration` | Duration in milliseconds | `120000` |
| **Video** | `video_stream_type` | Type of stream | `'live'` or `'on-demand'` |
| **Video** | `video_cdn` | CDN provider name | `'Fastly'`, `'Akamai'` |

---

## Troubleshooting

If you are not seeing data in your Mux dashboard:

1. Verify your `env_key` is correct
2. Check for ad blockers or tracking blockers in the browser
3. Verify no network firewall is blocking requests to Mux Data servers
4. Enable `debug: true` in the SDK options to see console output
5. Data typically appears in the Metrics tab within 1-2 minutes after tracking a view
