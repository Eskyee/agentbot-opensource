# Smart TV and Connected Device Integrations

This guide covers integrating Mux Data with smart TV platforms and connected devices including Roku, Samsung Tizen, LG webOS, and Chromecast. These integrations allow you to collect video performance metrics across the full range of living room devices.

## Overview

Mux Data provides SDKs for the following smart TV and connected device platforms:

| Platform | SDK | Integration Type |
|----------|-----|------------------|
| Roku | `mux-analytics.brs` | BrightScript Task |
| Samsung Tizen | `tizen-mux.js` | JavaScript (AVPlay API) |
| LG webOS | `mux-embed` | HTML5 via HLS.js/Dash.js |
| Chromecast | `@mux/mux-data-chromecast` | JavaScript (CAF Receiver) |

---

## Roku Integration

Mux's Roku integration supports Roku SceneGraph applications in conjunction with standard `Video` nodes. Mux runs as a `Task` alongside the `Video` node, and supports instances where `Video` nodes are reused with additional content as well as when nodes are reset between content.

### Installation

Place the SDK file in your `libs` folder:

```sh
https://src.litix.io/roku/2/mux-analytics.brs
```

### Setup MuxTask.xml

Create a new `Task` XML named `MuxTask.xml` inside your `components` folder:

```html
<component name="MuxTask" extends="Task">
  <interface>
    <field id="video" type="node" alwaysNotify="true"/>
    <field id="config" type="assocarray" alwaysNotify="true"/>
    <field id="rafEvent" type="assocarray" alwaysNotify="true"/>
    <field id="error" type="assocarray" alwaysNotify="true"/>
    <field id="view" type="String" alwaysNotify="true"/>
    <field id="exit" type="Boolean" alwaysNotify="true"/>
    <field id="exitType" type="String" alwaysNotify="true" value="hard" />
    <field id="useRenderStitchedStream" type="Boolean" alwaysNotify="true" value="false"/>
    <field id="useSSAI" type="Boolean" alwaysNotify="true" value="false"/>
    <field id="disableAutomaticErrorTracking" type="Boolean" alwaysNotify="true" value="false"/>
    <field id="randomMuxViewerId" type="Boolean" value="false"/>
  </interface>
  <script type="text/brightscript" uri="pkg:/libs/mux-analytics.brs"/>
</component>
```

### Initialize Mux Data

Within your main application, create the Mux Task node and pass the `Video` node. This should be done before content is set into the `Video` node so Mux can track the load process.

```js
m.mux = m.top.CreateNode("mux")
m.mux.setField("video", m.video)

muxConfig = {
  env_key: "ENV_KEY",
}

m.mux.setField("config", muxConfig)
m.mux.control = "RUN"

' Load the video into the Video node
```

### Roku Metadata

The SDK supports adding metadata via two mechanisms:

1. **muxConfig object** - Pass metadata in the `muxConfig` object. To update any field, modify `muxConfig` and call `m.mux.setField("config", muxConfig)`.

2. **Roku content metadata** - Some information is mapped from standard Roku content metadata fields:
   - `ContentType`
   - `URL`
   - `Live`
   - `StreamFormat`
   - `Length`

### Roku Debugging

Add manifest attributes to help with integration:

#### mux_debug_events

Values: `full`, `partial`, or `none` (default)

Outputs events at the time they occur:

```sh
# partial output:
[mux-analytics] EVENT playerready

# full output:
[mux-analytics] EVENT playing
{
  viewer_application_name:Roku,
  mux_api_version:2.1,
  view_seek_duration:0,
  ...
}
```

#### mux_debug_beacons

Values: `full`, `partial`, or `none` (default)

Outputs data being sent to Mux:

```sh
# partial output:
[mux-analytics] BEACON (2) [  playerready viewstart ]
```

#### mux_base_url

Controls which domain data is sent to. Useful for environmental builds.

### Roku Advertising Configuration

If using advertising, send appropriate events to the Mux Task:

```js
function setUpRokuAdFramework
  adIface.SetTrackingCallback(adTrackingCallback, adIface)
end function

function adTrackingCallback(obj = Invalid as Dynamic, eventType = Invalid as Dynamic, ctx = Invalid as Dynamic)
  m.mux = GetGlobalAA().global.findNode("mux")
  adUrl = Invalid
  if obj <> Invalid
    adUrl = obj.getAdUrl()
  end if
  m.mux.setField("rafEvent", {obj: { adurl: adUrl }, eventType:eventType, ctx:ctx})
end function
```

For RAF's `renderStitchedStream` method:

```js
mux.setField("useRenderStitchedStream", true)
```

For server-side ad insertion (SSAI):

```js
mux.setField("useSSAI", true)
```

### Roku View Control

To directly signal the beginning or ending of a view (needed when recycling Video nodes or using advertising):

```js
mux = GetGlobalAA().global.findNode("mux")

' To signal the start of a view:
mux.setField("view", "start")

' To signal the end of a view:
mux.setField("view", "end")
```

The `exitType` setting controls thread termination behavior:

- `hard` (default) - Thread terminates immediately; unsent data is lost
- `soft` - Thread sends remaining data before terminating

```js
m.mux.setField("exitType", "soft")
```

### Roku Error Tracking

To disable automatic error tracking:

```js
<field id="disableAutomaticErrorTracking" type="Boolean" alwaysNotify="true" value="true"/>
```

Or at runtime:

```js
mux.setField("disableAutomaticErrorTracking", true)
```

To emit errors manually:

```js
mux.setField("error", {
  player_error_code: errorCode,
  player_error_message: errorMessage,
  player_error_context: errorContext,
  player_error_severity: errorSeverity,
  player_error_business_exception: isBusinessException
})
```

Error severity values: `"warning"` or `"fatal"`.

### Roku CDN Tracking

```js
' The "new_cdn" string should be the new CDN name
mux.setField("cdn", "new_cdn")
```

### Roku Rebuffer Controls

To disable automatic rebuffer tracking:

```js
<field id="disablePlayheadRebufferTracking" type="Boolean" alwaysNotify="true" value="true"/>
```

Emit rebuffer events manually:

```js
mux.setField("rebufferstart", true)
mux.setField("rebufferend", true)
```

### Roku Playback Mode

```js
mux.setField("playback_mode", {
  player_playback_mode: mode,
  player_playback_mode_data: data
})
```

Suggested mode values: `inline`, `fullscreen`, `mini`, `pip`.

### Roku Network Request Events

Custom request events can be emitted:

```js
mux.setField("request", manifestRequest)
```

The `manifestRequest` must be a parseable JSON string with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string (required) | `completed`, `failed`, or `canceled` |
| `request_start` | numeric | Timestamp when request was initiated |
| `request_response_start` | numeric | Timestamp when first byte was received |
| `request_response_end` | numeric | Timestamp when last byte was received |
| `request_bytes_loaded` | numeric | Total bytes loaded |
| `request_hostname` | string | Hostname portion of the URL |
| `request_type` | string | `manifest`, `video`, `audio`, `video_init`, `audio_init`, `media`, `subtitle`, or `encryption` |
| `request_id` | string | Unique identifier for the request |
| `request_url` | string | The URL that was requested |
| `request_labeled_bitrate` | numeric | Labeled bitrate in bps |
| `request_response_headers` | object | Map of response headers |
| `request_media_duration` | numeric | Duration of media loaded (seconds) |
| `request_video_width` | numeric | Width of video in segment |
| `request_video_height` | numeric | Height of video in segment |
| `request_error` | string | Name of error event |
| `request_error_code` | numeric | Response code of failed request |
| `request_error_text` | string | Message from failed status code |

Latency and throughput are automatically calculated when `request_start`, `request_response_start`, `request_response_end`, and `request_bytes_loaded` are provided.

---

## Samsung Tizen Integration

Mux Data supports applications built for Samsung Tizen TVs using JavaScript and Tizen's AVPlay API.

### Installation

Include the SDK via CDN:

```html
<!-- place within the <head> of your index.html -->
<script src="//src.litix.io/tizen/2/tizen-mux.js"></script>
```

### Initialize Mux Data

Pass the AVPlay player instance to `monitorTizenPlayer`:

```js
// Place in your application initialization code, around
// where you call `prepare`

var player = $('#my-player').get(0);
player.url = this.url;
var playerInitTime = monitorTizenPlayer.utils.now();
this.prepare();
monitorTizenPlayer(player, {
  debug: true,
  data: {
    env_key: 'ENV_KEY', // required
    // Metadata
    player_name: 'Custom Player', // ex: 'My Main Player'
    player_init_time: playerInitTime,
    // ... additional metadata
  },
  // Optional passthrough listener
  playbackListener: playbackListener
});
```

Tizen's AVPlay API does not allow multiple AVPlayPlaybackCallback listeners. If you require your own listener, pass it as `playbackListener` and Mux's SDK will proxy calls to it.

To stop monitoring:

```js
player.mux.stopMonitor();
```

### Tizen Metadata

```js
monitorTizenPlayer(player, {
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

### Tizen Custom Beacon Domain

```js
monitorTizenPlayer(player, {
  debug: false,
  beaconCollectionDomain: 'CUSTOM_DOMAIN', //ex: 'foo.bar.com'
  data: {
    env_key: 'ENV_KEY', // required
    // ...
  }
});
```

---

## LG webOS Integration

LG Smart TV applications are built on HTML5 video technology. Due to this HTML5 nature, the Mux Data integration uses one of the HTML5 integrations depending on which player engine your application uses:

- HTML5 video element
- HLS.js
- Dash.js

### LG with HLS.js

```js
play: function() {
  var data = {
    env_key: 'ENV_KEY', // required
    player_name: 'My Custom Player',
    player_init_time: mux.utils.now(),
    // ... additional metadata
  };

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('<your source file>');
    hls.attachMedia(this.player);
    hls.on(Hls.Events.MANIFEST_PARSED,function(e,d) {
      app.player.play();
    });
    mux.monitor('#my-player', {
      debug: true,
      hlsjs: hls,
      Hls: Hls,
      data: data
    });
    this.hls = hls;
  }
}
```

### LG with Dash.js

```js
const dashjsPlayer = dashjs.MediaPlayer().create();
dashjsPlayer.getDebug().setLogToBrowserConsole(false);
mux.monitor('#my-player', {
  debug: true,
  dashjs: dashjsPlayer,
  data: data
});
dashjsPlayer.initialize(this.player, 'http://dash.edgesuite.net/envivio/EnvivioDash3/manifest.mpd', true);
this.dashjsPlayer = dashjsPlayer;
```

### LG Metadata

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

### LG Custom Beacon Domain

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

## Chromecast Integration

Mux supports Chromecast applications built on top of the Cast Application Framework (CAF) Receiver SDK. The SDK is integrated at the receiver side.

### Installation

Via npm/yarn:

```sh
npm install --save @mux/mux-data-chromecast
# or
yarn add @mux/mux-data-chromecast
```

Via CDN:

```html
<script src="//src.litix.io/chromecast/4/chromecast-mux.js"></script>
```

### Initialize Mux Data

Pass the `PlayerManager` instance to `initChromecastMux`. You can initialize within a message interceptor for the `LOAD` event:

```js
import initChromecastMux from '@mux/mux-data-chromecast';

var app = {
  init: function () {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();
    let firstPlay = true;
    let playerInitTime = initChromecastMux.utils.now();

    playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData => {
      if (firstPlay) {
        initChromecastMux(playerManager, {
          debug: false,
          data : {
            env_key: 'ENV_KEY', // required

            // Metadata
            player_name: 'Custom Player', // ex: 'My Main Player'
            player_init_time: playerInitTime,

            // ... additional metadata
          }
        });
      }

      return loadRequestData;
    });

    context.start();
  }
};

$(document).ready(function () {
  app.init();
});
```

### Update Metadata Mid-View

```js
playerManager.mux.updateData({ video_title: 'My Updated Great Video' });
```

### Chromecast Video Change

For applications playing multiple videos, signal video changes by intercepting the `LOAD` message:

```js
playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData => {
  // Only call this on subsequent videos, not the first playback
  if (!firstVideo) {
    playerManager.mux.emit('videochange', { ... });
  }

  return loadRequestData;
});
```

### Chromecast Error Tracking

Emit custom fatal errors:

```js
playerManager.mux.emit('error', {
  player_error_code: 100,
  player_error_message: 'Description of error',
  player_error_context: 'Additional context for the error'
});
```

#### Error Translator

Transform error data before sending to Mux:

```js
function errorTranslator (error) {
  return {
    player_error_code: translateCode(error.player_error_code),
    player_error_message: translateMessage(error.player_error_message),
    player_error_context: translateContext(error.player_error_context)
  };
}

initChromecastMux(playerManager, {
  debug: false,
  errorTranslator: errorTranslator,
  data : {
    env_key: 'ENV_KEY', // required
    player_name: 'Custom Player',
    // ... additional metadata
  }
});
```

#### Disable Automatic Error Tracking

```js
initChromecastMux(playerManager, {
  debug: false,
  automaticErrorTracking: false,
  data : {
    env_key: 'ENV_KEY', // required
    player_name: 'Custom Player',
    // ... additional metadata
  }
});
```

### Chromecast Custom Beacon Domain

```js
initChromecastMux(playerManager, {
  debug: false,
  beaconCollectionDomain: 'CUSTOM_DOMAIN', // ex: 'foo.bar.com'
  data: {
    env_key: "ENV_KEY",
    // ...
  }
});
```

### Destroying the Monitor

Stop monitoring playback when the player is no longer in use:

```js
playerManager.mux.destroy();
```

---

## Common Metadata Fields

All integrations support these metadata fields:

| Field | Description | Example |
|-------|-------------|---------|
| `env_key` | Required. Your Mux environment key | `'abc123'` |
| `viewer_user_id` | Unique user identifier | `'12345'` |
| `experiment_name` | A/B test experiment name | `'player_test_A'` |
| `sub_property_id` | Sub-property identifier | `'cus-1'` |
| `player_name` | Name of your player | `'My Main Player'` |
| `player_version` | Version of your player | `'1.0.0'` |
| `player_init_time` | Timestamp when player initialized | `1451606400000` |
| `video_id` | Unique video identifier | `'abcd123'` |
| `video_title` | Title of the video | `'My Great Video'` |
| `video_series` | Series name | `'Weekly Great Videos'` |
| `video_duration` | Duration in milliseconds | `120000` |
| `video_stream_type` | Type of stream | `'live'` or `'on-demand'` |
| `video_cdn` | CDN provider | `'Fastly'`, `'Akamai'` |

---

## Verifying the Integration

After integrating:

1. Start playing a video in the player
2. Pass `debug: true` to see debug statements in the console
3. After a few minutes, check the Mux Data dashboard
4. Find the environment matching your `env_key`
5. Look for video views in the Metrics tab

If data is not appearing, check for ad blockers, tracking blockers, or network firewalls that may prevent requests to Mux Data servers.
