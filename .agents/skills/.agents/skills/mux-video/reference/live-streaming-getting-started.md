# Getting Started with Live Streaming

Comprehensive guide to creating and managing live streams with Mux, including API setup, creating live stream resources, understanding stream keys and playback IDs, starting broadcasts, and handling webhook events for live stream lifecycle management.

## Overview

The Mux Live Streaming API enables you to build live video capabilities into your application. With a simple API call, you get everything needed to push a live stream and play it back at high quality for a global audience. Whether building "Twitch for X", online classrooms, news and sports broadcasting platforms, or something entirely new, Mux provides the infrastructure.

The live streaming workflow consists of:

1. **Get an API Access Token** - Generate authentication credentials
2. **Create a Live Stream** - Create a unique resource with stream key and playback ID
3. **Start Broadcasting** - Push live content via RTMP
4. **Play the Live Stream** - Use the playback ID in your application
5. **Stop Broadcasting** - End the stream from broadcasting software
6. **Manage Live Streams** - Delete, update, and manage streams via API

## Authentication Setup

The Mux Video API uses a token key pair consisting of a **Token ID** and **Token Secret** for authentication.

### Creating an Access Token

1. Navigate to the [Access Token settings](https://dashboard.mux.com/settings/access-tokens) in your Mux dashboard
2. Generate a new Access Token
3. Ensure the token has Mux Video **Read** and **Write** permissions
4. Store the Token ID and Token Secret securely

Access Tokens belong to an Environment. Use the same Environment when using Mux Video and Mux Data together so data can be used to optimize your video streams.

## Creating a Live Stream

The Live Stream object in the Mux API represents a live stream of video that will be pushed to Mux. Each live stream has a unique stream key.

### Basic Live Stream Creation

Make a POST request to the `/video/v1/live-streams` endpoint:

```bash
curl -X POST https://api.mux.com/video/v1/live-streams \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET} \
  -d '{
    "playback_policy": ["public"],
    "new_asset_settings": {
      "playback_policy": ["public"]
    }
  }'
```

### Response Structure

The response includes essential information for streaming and playback:

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

### Understanding the Response

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for the live stream resource |
| `stream_key` | Secret key used to configure RTMP streaming software |
| `status` | Current state of the live stream (`idle`, `active`, etc.) |
| `playback_ids` | Array of playback IDs for viewing the stream |

## Stream Keys

Stream keys are used by broadcasters to receive a live stream for a Mux account. They are private and should be handled with care.

### Security Best Practices

**Important:** The stream key should be treated as a **private key for live streaming**. Anyone with the key can use it to stream video to the Live Stream it belongs to.

- Keep stream keys confidential
- Only share with authorized broadcasters
- Store securely if persisted in your CMS
- Reset immediately if compromised

### Resetting a Stream Key

If a stream key is lost or compromised, reset it:

```bash
curl -X POST https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}/reset-stream-key \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

This generates a new stream key, invalidating the previous one.

## Playback IDs

Playback IDs for a Live Stream work the same way as Playback IDs for an Asset. They can be used to:

- Play video in real-time
- Get images from a video
- Build timeline hover previews with your player

## Live Stream Options

When creating a live stream, you can configure additional options:

| Option | Description |
|--------|-------------|
| `"latency_mode": "reduced"` | Reduces glass-to-glass latency to about 10-15 seconds (compared to ~30 seconds standard) |
| `"latency_mode": "low"` | Reduces latency to as low as 5 seconds, though it varies based on viewer location and connectivity |
| `audio_only` | Processes only the audio track, dropping video if broadcast. Useful for live podcasts or radio shows |

**Note:** A live stream can only be configured as "reduced latency", "low latency", or standard latency - not multiple options simultaneously.

## Starting a Broadcast

Mux supports live streaming using the RTMP protocol, which is compatible with most broadcast software and hardware.

### RTMP Server URLs

| RTMP Server URL | Description | Common Applications |
|-----------------|-------------|---------------------|
| `rtmp://global-live.mux.com:5222/app` | Standard RTMP entry point | Open Source RTMP SDKs, most app-store streaming applications |
| `rtmps://global-live.mux.com:443/app` | Secure RTMPS entry point | OBS, Wirecast, Streamaxia RTMP SDKs |

**Important:** Mux's RTMP server URL uses port number **5222**, not the standard RTMP port 1935. Contact support if your encoder cannot change the port number.

### Configuring Broadcast Software

Configure your broadcasting software with:
- **Server URL:** `rtmp://global-live.mux.com:5222/app` or `rtmps://global-live.mux.com:443/app`
- **Stream Key:** The stream key from your live stream resource

Once the session begins, the software pushes live video to Mux and the Live Stream changes status to `active`.

### Additional Protocol Support

Mux also supports Secure Reliable Transport (SRT) for receiving live streams.

## Live Streaming from Mobile Apps

Live streaming from native applications requires software to capture the camera feed and stream it via RTMP.

### iOS and Android Examples

- [iOS Live Streaming Example](https://github.com/muxinc/examples/tree/master/ios-live-streaming)
- [Android Live Streaming Example](https://github.com/muxinc/examples/tree/master/android-live-streaming)

### Commercial Solutions

For commercial solutions, the following work well with Mux's RTMP ingest:
- [Streamaxia OpenSDK](https://www.streamaxia.com/)
- [Larix Broadcaster](https://softvelum.com/larix/)

### Web App Streaming

There are currently no reliable open source solutions for building web-based encoders for streaming via RTMP.

## Playing Back a Live Stream

Use the playback ID to create an HLS playback URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### HTML Example

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>
<script>
  var video = document.getElementById('video');
  var videoSrc = 'https://stream.mux.com/{PLAYBACK_ID}.m3u8';

  if (Hls.isSupported()) {
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoSrc;
  }
</script>
```

## Webhook Events

When a streamer begins or stops sending video, your application can respond using webhooks. These events enable you to build responsive user experiences.

### Broadcasting Lifecycle Events

| Event | Description |
|-------|-------------|
| `video.live_stream.connected` | Broadcasting software has connected to Mux servers. Video is not yet being recorded or playable. |
| `video.live_stream.disconnected` | Broadcasting software has disconnected, either intentionally or due to network issues. |
| `video.live_stream.recording` | Video is being recorded and prepared for playback. Recording includes video sent after this point. |
| `video.live_stream.active` | The live stream is now playable using the playback ID. |
| `video.live_stream.idle` | Broadcasting software disconnected and the `reconnect_window` has expired. Recording is complete. |
| `video.asset.live_stream_completed` | Fired when the live stream enters `idle` state. The playback URL switches to on-demand video. |

## Managing Stream Keys

### Use Cases

#### Single Stream Configuration

Ideal for:
- Only one stream active at a time
- Disposable, single-use live streams
- Conference scenarios with back-to-back speakers

#### Multiple Stream Configuration

Recommended when:
- Multiple concurrent streams overlap
- User-generated content where streaming can happen at any time
- No established schedule

### Managing User-Generated Content

When provisioning users as content creators:

1. Create a live stream configuration for each content creator
2. Store the `data.id` response in your CMS
3. Optionally store `data.stream_key` or pass it through at provision time
4. Reuse the same configuration for that creator's lifetime

### Enabling and Disabling Live Streams

Control when users can go live:

#### Enable a Live Stream

```bash
curl -X PUT https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}/enable \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Note:** All newly created live stream configurations are enabled by default.

#### Disable a Live Stream

```bash
curl -X PUT https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}/disable \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

When disabled, Mux closes the encoder connection immediately. Any reconnection attempts fail until re-enabled.

### Signaling Stream Complete

To make a live stream available as an on-demand asset immediately (bypassing the `reconnect_window`):

```bash
curl -X PUT https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}/complete \
  -H "Content-Type: application/json" \
  -u ${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}
```

**Note:** Mux waits 60 seconds before closing the encoder connection to give operators a chance to disconnect from their end, preventing unintended reconnection and new asset creation.

## Stopping a Broadcast

When the streamer stops their broadcast software:

1. Broadcasting software disconnects from Mux servers
2. After the `reconnect_window` expires, the Live Stream transitions to `idle` status
3. The recording becomes available as an on-demand asset

**Note:** Mux automatically disconnects clients after 12 hours. Contact support for longer live streams.

## API Reference

### Common Live Stream Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /video/v1/live-streams` | Create a live stream |
| `GET /video/v1/live-streams` | List live streams |
| `GET /video/v1/live-streams/{id}` | Retrieve a live stream |
| `DELETE /video/v1/live-streams/{id}` | Delete a live stream |
| `POST /video/v1/live-streams/{id}/playback-ids` | Create a playback ID |
| `DELETE /video/v1/live-streams/{id}/playback-ids/{playback_id}` | Delete a playback ID |
| `POST /video/v1/live-streams/{id}/reset-stream-key` | Reset stream key |
| `PUT /video/v1/live-streams/{id}/complete` | Signal stream complete |
| `PUT /video/v1/live-streams/{id}/disable` | Disable live stream |
| `PUT /video/v1/live-streams/{id}/enable` | Enable live stream |
| `POST /video/v1/live-streams/{id}/simulcast-targets` | Create simulcast target |
| `DELETE /video/v1/live-streams/{id}/simulcast-targets/{target_id}` | Delete simulcast target |
| `GET /video/v1/live-streams/{id}/simulcast-targets/{target_id}` | Retrieve simulcast target |
