# Complete Live Streaming Setup Example

This guide provides an end-to-end example showing how to create a live stream with reduced latency, configure OBS for streaming, handle webhooks for stream lifecycle events, and play back the live stream using Mux Player.

## Overview

Building a live streaming platform with Mux involves these key steps:

1. Create a Live Stream resource with your desired latency settings
2. Configure broadcast software (like OBS) with the stream key
3. Set up webhooks to handle stream lifecycle events
4. Play back the live stream using Mux Player or HLS

## Step 1: Create an API Access Token

The Mux Video API uses a token key pair consisting of a **Token ID** and **Token Secret** for authentication. Generate a new Access Token in the [Access Token settings](https://dashboard.mux.com/settings/access-tokens) of your Mux account dashboard.

The access token should have Mux Video **Read** and **Write** permissions.

Access Tokens belong to an Environment. Use the same Environment when using Mux Video and Mux Data together so the data from Mux Data can optimize your Mux Video streams.

## Step 2: Create a Live Stream with Reduced Latency

Create a live stream with reduced latency by making a POST request to the `/live-streams` endpoint:

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "reduced",
    "reconnect_window": 60,
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"]
    }
}
```

### Latency Mode Options

| Mode | Latency | Description |
|------|---------|-------------|
| `standard` | 25-30 seconds | Default HLS delivery |
| `reduced` | 12-20 seconds | Optimized processing for lower latency |
| `low` | As low as 5 seconds | Uses Apple's LL-HLS spec |

**Note:** A live stream can only be configured with one latency mode at a time.

### Low Latency Example

For the lowest possible latency (as low as 5 seconds), use:

```json
// POST https://api.mux.com/video/v1/live-streams

{
    "latency_mode": "low",
    "reconnect_window": 60,
    "playback_policies": ["public"],
    "new_asset_settings": {
        "playback_policies": ["public"]
    }
}
```

### API Response

The response includes a **Playback ID** and a **Stream Key**:

```json
{
  "data": {
    "id": "QrikEQpEXp3RvklQSHyHSYOakQkXlRId",
    "stream_key": "super-secret-stream-key",
    "status": "idle",
    "playback_ids": [
      {
        "policy": "public",
        "id": "OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02"
      }
    ],
    "created_at": "1527110899"
  }
}
```

**Important:** The Stream Key should be treated as a private key. Anyone with the key can stream video to your Live Stream. If you lose control of a stream key, you can delete the Live Stream or reset the stream key via the API.

## Step 3: Configure OBS for Streaming

### RTMP Server URLs

| URL | Description | Use Case |
|-----|-------------|----------|
| `rtmp://global-live.mux.com:5222/app` | Standard RTMP entry point | Most streaming applications, Open Source RTMP SDKs |
| `rtmps://global-live.mux.com:443/app` | Secure RTMPS entry point | OBS, Wirecast, Streamaxia RTMP SDKs |

**Important:** Mux's RTMP server URL uses port 5222, not the standard RTMP port 1935.

### Regional Ingest URLs

For manual control over geographic routing:

| Region | RTMP Ingest URL |
|--------|-----------------|
| Global (Auto-Select) | `rtmp://global-live.mux.com/app` |
| U.S. East | `rtmp://us-east.live.mux.com/app` |
| U.S. West | `rtmp://us-west.live.mux.com/app` |
| Europe | `rtmp://eu-west.live.mux.com/app` |

All RTMP URLs also support RTMPS (e.g., `rtmps://us-east.live.mux.com/app`).

### OBS Configuration Steps

1. Open OBS and go to **Settings > Stream**
2. Select **"Custom..."** as the service
3. Enter the Ingest URL based on your preferred region:
   ```
   rtmps://us-east.live.mux.com/app
   ```
4. Enter your Stream Key from the Mux API response
5. Click **"Start Streaming"**

### Recommended Encoder Settings

**Common Settings:**
- **Video CODEC:** H.264 (Main Profile)
- **Audio CODEC:** AAC

**Quality Presets:**

| Quality | Resolution | Bitrate | Keyframe Interval |
|---------|------------|---------|-------------------|
| Great | 1080p 30fps | 5000 kbps | 2 seconds |
| Good | 720p 30fps | 3500 kbps | 2 seconds |
| Works | 480p 30fps | 1000 kbps | 5 seconds |

**Tip:** Use no more than ~50% of your available upload bandwidth for reliable streaming.

## Step 4: Handle Webhooks for Stream Lifecycle Events

Set up webhooks to receive notifications about stream status changes. The following events are available:

| Event | Description |
|-------|-------------|
| `video.live_stream.connected` | Broadcasting software has connected to Mux servers. Video is not yet being recorded or playable. |
| `video.live_stream.disconnected` | Broadcasting software has disconnected from Mux servers (intentionally or due to network issues). |
| `video.live_stream.recording` | Video is being recorded and prepared for playback. Turn on your "recording" indicator light. |
| `video.live_stream.active` | The live stream is now playable using the Playback ID. |
| `video.live_stream.idle` | The `reconnect_window` has expired after disconnect. The recording is complete. |
| `video.asset.live_stream_completed` | Fired when the Live Stream enters the `idle` state. The playback URL switches to on-demand video. |

### Reconnect Window

When a client disconnects unexpectedly, Mux keeps the live stream "active" for the duration of the `reconnect_window` (default: 60 seconds, max: 1800 seconds / 30 minutes). During this time:

- The client can reconnect and resume streaming
- The live stream remains playable for viewers
- You can configure a slate image to display during disconnections

When the `reconnect_window` expires:
- The live stream transitions to `idle` state
- Mux writes the `#EXT-X-ENDLIST` tag to the HLS manifest
- The next stream with the same key creates a new Asset

## Step 5: Play Back the Live Stream

Use the `PLAYBACK_ID` from the API response to create an HLS playback URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### Using Mux Player (Recommended)

Mux Player supports low-latency HLS out of the box (version >= 1.0):

```html
<mux-player
  playback-id="OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02"
  stream-type="live"
></mux-player>
```

### Using HLS.js

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>
<script>
  var video = document.getElementById('video');
  var videoSrc = 'https://stream.mux.com/OJxPwQuByldIr02VfoXDdX6Ynl01MTgC8w02.m3u8';

  if (Hls.isSupported()) {
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoSrc;
  }
</script>
```

### Using Video.js (8.0.0+)

LL-HLS playback is enabled by default in Video.js 8.0.0 and later.

For Video.js prior to 8.0.0, enable low latency with:

```javascript
var player = videojs(video, {
  html5: {
    vhs: {
      experimentalLLHLS: true
    }
  }
});
```

### Disabling Low Latency Playback

If your player has issues with LL-HLS, add the `low_latency=false` parameter:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?low_latency=false
```

## Low Latency Input Requirements

For best results with `reduced` or `low` latency modes, ensure you have control over:

- The encoder software
- The hardware running the encoder
- The network the encoder is connected to

**Note:** Home networks and mobile connections are often not stable enough for reliable `reduced` or `low` latency streaming.

## Player Compatibility for Low Latency

| Player | Minimum Version | Notes |
|--------|-----------------|-------|
| HLS.js | >= 1.1.5 | |
| JW Player | >= 8.20.5 | Do not set `liveSyncDuration` for low-latency playback |
| THEOplayer | >= 6.0.0 | LL-HLS enabled by default |
| VideoJS | >= 8.0.0 | LL-HLS enabled by default |
| Mux Player | >= 1.0 | |
| Apple iOS (AVPlayer) | 15.* | Recommended version |
| Android ExoPlayer | >= 2.14 | |

## Complete Example: Node.js Server

Here is a complete example of setting up a live streaming backend:

```javascript
const Mux = require('@mux/mux-node');

// Initialize the Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Create a live stream with reduced latency
async function createLiveStream() {
  const liveStream = await mux.video.liveStreams.create({
    latency_mode: 'reduced',
    reconnect_window: 60,
    playback_policies: ['public'],
    new_asset_settings: {
      playback_policies: ['public'],
    },
  });

  console.log('Live Stream created:');
  console.log('  Stream Key:', liveStream.stream_key);
  console.log('  Playback ID:', liveStream.playback_ids[0].id);
  console.log('  Status:', liveStream.status);

  return liveStream;
}

// Webhook handler for stream events
function handleWebhook(event) {
  switch (event.type) {
    case 'video.live_stream.connected':
      console.log('Stream connected, waiting for video...');
      break;
    case 'video.live_stream.recording':
      console.log('Recording started!');
      break;
    case 'video.live_stream.active':
      console.log('Stream is now live and playable!');
      const playbackUrl = `https://stream.mux.com/${event.data.playback_ids[0].id}.m3u8`;
      console.log('Playback URL:', playbackUrl);
      break;
    case 'video.live_stream.idle':
      console.log('Stream ended');
      break;
    case 'video.live_stream.disconnected':
      console.log('Stream disconnected, waiting for reconnect...');
      break;
  }
}

createLiveStream();
```

## Stopping the Broadcast

When the streamer stops their broadcast software:

1. The broadcasting software disconnects from Mux servers
2. The `reconnect_window` timer begins
3. If the timer expires without reconnection, the live stream transitions to `idle`
4. The Active Asset is marked as complete
5. The playback URL switches from live to on-demand video

**Note:** Mux automatically disconnects clients after 12 hours. Contact Mux support if you require longer live streams.

## Additional API Operations

After creating live streams, you can manage them with these endpoints:

- List live streams
- Retrieve a live stream
- Delete a live stream
- Create/delete live stream playback IDs
- Reset a stream key
- Signal a live stream is finished
- Disable/enable a live stream
- Create/manage simulcast targets

## Updating Latency Mode

You can change an existing live stream's latency mode when the stream is in `idle` status:

```json
// PATCH https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}

{
    "latency_mode": "low"
}
```

After successful update, your webhook endpoint receives a `video.live_stream.updated` event.
