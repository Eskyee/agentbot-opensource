# Streaming Protocols and Encoder Setup

Complete reference for RTMP, RTMPS, and SRT streaming protocols, including ingest URLs, encoder configuration, recommended settings, and software/hardware encoder setup guides.

## Streaming Protocols Overview

Mux supports three primary protocols for live stream ingest:

| Protocol | Port | Security | Use Case |
|----------|------|----------|----------|
| RTMP | 5222 | Unencrypted | Standard streaming, widest compatibility |
| RTMPS | 443 | TLS encrypted | Secure streaming for sensitive content |
| SRT | 6001 | Encrypted (passphrase) | High-quality, reliable transmission over unreliable networks |

**Important:** Mux uses port 5222 for RTMP (not the standard port 1935). If your encoder does not provide a method to change the port number, contact Mux support.

## Ingest URLs

### Global and Regional Endpoints

| Region | RTMP Ingest URL | SRT Ingest URL |
|--------|-----------------|----------------|
| Global (Auto-Select) | `rtmp://global-live.mux.com:5222/app` | `srt://global-live.mux.com:6001?streamid={STREAM_KEY}&passphrase={SRT_PASSPHRASE}` |
| U.S. East | `rtmp://us-east.live.mux.com/app` | `srt://us-east.live.mux.com:6001?streamid={STREAM_KEY}&passphrase={SRT_PASSPHRASE}` |
| U.S. West | `rtmp://us-west.live.mux.com/app` | `srt://us-west.live.mux.com:6001?streamid={STREAM_KEY}&passphrase={SRT_PASSPHRASE}` |
| Europe | `rtmp://eu-west.live.mux.com/app` | `srt://eu-west.live.mux.com:6001?streamid={STREAM_KEY}&passphrase={SRT_PASSPHRASE}` |

### RTMPS Support

All RTMP URLs support RTMPS by changing the protocol:
- `rtmp://us-east.live.mux.com/app` becomes `rtmps://us-east.live.mux.com/app`
- Secure RTMPS global endpoint: `rtmps://global-live.mux.com:443/app`

### Choosing the Right Ingest URL

- **Automatic routing:** Use `global-live.mux.com` for Mux to route to the best region automatically
- **Manual control:** Use specific regional endpoints (e.g., `us-east.live.mux.com`) for explicit routing
- **Redundancy:** Configure your encoder to failover to another regional endpoint

## Configuration Terminology

Common terms used across broadcast software:

| Term | Description |
|------|-------------|
| Server URL | The Mux RTMP/SRT server endpoint |
| Stream Key | Authentication key for your live stream (exposed as `stream_key` in API) |
| Stream Name | Alias for Stream Key (technically correct RTMP specification term) |
| Location / URL | Sometimes refers to combined Server URL + Stream Key: `rtmp://global-live.mux.com:5222/app/{STREAM_KEY}` |
| FMS URL | Flash Media Server URL, alias for Server URL |

## Recommended Encoder Settings

### Common Settings (All Quality Levels)

- **Video Codec:** H.264 (Main Profile)
- **Audio Codec:** AAC

### Quality Presets

**Great - 1080p 30fps:**
- Bitrate: 5000 kbps
- Keyframe Interval: 2 seconds

**Good - 720p 30fps:**
- Bitrate: 3500 kbps
- Keyframe Interval: 2 seconds

**Works - 480p 30fps:**
- Bitrate: 1000 kbps
- Keyframe Interval: 5 seconds

**Bandwidth Consideration:** Use no more than ~50% of available upload bandwidth for your live stream ingest to ensure reliable connection.

## RTMP/RTMPS Configuration

### Authentication

RTMP uses a single Stream Key for authentication. The Stream Key is found in your Mux Live settings or via the API.

### Server URL Compatibility

| Server URL | Description | Compatible Applications |
|------------|-------------|------------------------|
| `rtmp://global-live.mux.com:5222/app` | Standard RTMP entry point | Open Source RTMP SDKs, most mobile streaming apps |
| `rtmps://global-live.mux.com:443/app` | Secure RTMPS entry point | OBS, Wirecast, Streamaxia RTMP SDKs |

## SRT Configuration

SRT (Secure Reliable Transport) is designed for high-quality, reliable point-to-point video transmission over unreliable networks.

### Authentication Requirements

SRT requires two pieces of information:

1. **streamid:** The `stream_key` attribute from your live stream
2. **passphrase:** The `srt_passphrase` field from the Live Streams API

```json
// GET https://api.mux.com/video/v1/live-streams/{LIVE_STREAM_ID}
{
  "stream_key": "abc-123-def-456",
  "srt_passphrase": "GHI789JKL101112"
}
```

### Building the SRT URL

The SRT URL has three components:

1. Protocol and host: `srt://global-live.mux.com:6001`
2. streamid query parameter
3. passphrase query parameter

**Complete example:**
```
srt://global-live.mux.com:6001?streamid=abc-123-def-456&passphrase=GHI789JKL101112
```

### SRT Configuration Fields

For encoders with separate configuration fields:

| Field | Value |
|-------|-------|
| Hostname / URL / Port | `srt://global-live.mux.com:6001` |
| Stream ID | Use the `stream_key` from your live stream |
| Passphrase | Use the `srt_passphrase` field from your live stream |
| Mode | Set to `caller` if required |
| Encryption Key Size / Length | `128` bits or `16` pbkeylen |

### SRT Tuning Parameters

| Field | Recommended Value | Notes |
|-------|-------------------|-------|
| Latency | `500` | Set to at least 4x the RTT to `global-live.mux.com` |
| Bandwidth | `25%` | Percentage of overhead for retransmission bursts |

### HEVC Codec Support

SRT supports HEVC (H.265) as the contribution codec, allowing 30-50% bitrate reduction without sacrificing quality.

### SRT Limitations

- **Embedded captions:** CEA-608 captions not supported (auto-generated captions work)
- **Multi-track audio:** Only one audio track recommended; Mux uses the first audio stream in PMT
- **Protocol switching:** Cannot switch protocols/codecs within reconnect window

## Software Encoder Setup

### OBS

**RTMP/RTMPS Setup:**
1. Go to Settings > Stream
2. Select "Custom..." as the service
3. Enter the Ingest URL: `rtmps://us-east.live.mux.com/app`
4. Enter your Stream Key
5. Click "Start Streaming"

**SRT Setup:**
- Enter the full SRT URL in the Server field:
  ```
  srt://global-live.mux.com:6001?streamid={stream_key}&passphrase={srt_passphrase}
  ```
- Leave Stream Key empty (credentials are in the URL)

**Resolution Configuration:**
- Go to Settings > Video > Output (Scaled) Resolution
- Select desired output resolution (e.g., 1280x720 for 720p)

### Wirecast

**SRT Setup:**
Configure each parameter separately:
- Hostname: `global-live.mux.com`
- Port: `6001`
- Stream ID: Your stream_key
- Passphrase: Your srt_passphrase

### FFmpeg

**SRT streaming example:**
```shell
ffmpeg \
  -f lavfi -re -i testsrc=size=1920x1080:rate=30 \
  -f lavfi -i "sine=frequency=1000:duration=3600" \
  -c:v libx264 -x264-params keyint=120:scenecut=0 \
  -preset superfast -b:v 5M -maxrate 6M -bufsize 3M -threads 4 \
  -c:a aac \
  -f mpegts 'srt://global-live.mux.com:6001?streamid={stream_key}&passphrase={srt_passphrase}'
```

### GStreamer

**SRT streaming example:**
```shell
gst-launch-1.0 -v videotestsrc ! queue ! video/x-raw, height=1080, width=1920 \
  ! videoconvert ! x264enc tune=zerolatency ! video/x-h264, profile=main \
  ! ts. audiotestsrc ! queue ! avenc_aac ! mpegtsmux name=ts \
  ! srtsink uri='srt://global-live.mux.com:6001?streamid={stream_key}&passphrase={srt_passphrase}'
```

### Other Software Encoders

- **XSplit** - Commercial, supports RTMP
- **vMix** - Commercial, supports RTMP

## Hardware Encoder Setup

Any encoder supporting RTMP works with Mux Video.

### Compatible Hardware Encoders

- **Teradek VidiU** - Portable streaming encoders
- **DataVideo RTMP Encoders** - Professional broadcast encoders
- **Magewell Ultra Stream** - HDMI/SDI capture with streaming
- **Osprey Talon** - Enterprise streaming (contact sales@ospreyvideo.com for documentation)
- **Videon** - Hardware encoders with Mux integration

### Videon SRT Configuration

Configure each parameter separately:
- URL/Host: `global-live.mux.com`
- Port: `6001`
- Stream ID: Your stream_key
- Passphrase: Your srt_passphrase

## Mobile Streaming

### Larix Broadcaster (iOS and Android)

**SRT Configuration:**
Configure each parameter separately in the app settings:
- Host: `global-live.mux.com`
- Port: `6001`
- Stream ID: Your stream_key
- Passphrase: Your srt_passphrase

### Controlling Recording Resolution

#### Android

**CameraX:**
```kotlin
val selector = QualitySelector.fromOrderedList(
  listOf(Quality.HD, Quality.SD),
  FallbackStrategy.lowerQualityOrHigherThan(Quality.SD)
)

val recorder = Recorder.Builder()
  .setQualitySelector(selector)
  .build()
```

**MediaCodec:**
```kotlin
val mediaCodec = MediaCodec.createByCodecName(codecName)
val encodeFormat = MediaFormat().apply {
  setInteger(MediaFormat.KEY_FRAME_RATE, myExampleFrameRate)
  setInteger(MediaFormat.KEY_HEIGHT, 720)
  setInteger(MediaFormat.KEY_WIDTH, 1280)
}
mediaCodec.configure(
  encodeFormat,
  myInputSurface,
  null,
  MediaCodec.CONFIGURE_FLAG_ENCODE
)
```

**MediaRecorder:**
```kotlin
mediaRecord.setVideoSize(1280, 720)
mediaRecord.prepare()
```

**Camera2:**
```kotlin
val supportedCameraResolutions = streamConfigMap.getOutputSizes(ImageFormat.NV21)
val size = supportedCameraResolutions.toList()
  .sortedBy { it.height }
  .findLast { it.height <= 720 && it.width <= 1280 }
size?.let { cameraSurfaceHolder.setFixedSize(it.width, it.height) }
cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_RECORD)
  .apply { addTarget(cameraSurfaceHolder.surface) }
  .build()
cameraDevice.createCaptureSession(...)
```

#### iOS/iPadOS

**AVCaptureSession:**
```swift
let session = fetchYourCaptureSession()
session.beginConfiguration()

let updatedSessionPreset = AVCaptureSession.hd1280x720
if session.canSetSessionPreset(updatedSessionPreset) {
    session.sessionPreset = updatedSessionPreset
}

session.commitConfiguration()
```

**Important:** Call `beginConfiguration()` before changes and `commitConfiguration()` after. Keep configuration work synchronous.

## Simulcasting with SRT

SRT streams can be simulcast to both SRT and RTMP destinations.

### Creating an SRT Simulcast Target

```json
POST /video/v1/live-streams/{LIVE_STREAM_ID}/simulcast-targets

{
  "url": "srt://my-srt-server.example.com:6001?streamid=streamid&passphrase=passphrase",
  "passthrough": "My SRT Destination"
}
```

### Platform Compatibility for Simulcast

| Platform | Protocols | Codecs |
|----------|-----------|--------|
| Facebook | RTMP(S) | H.264 |
| X (Twitter) | RTMP(S), HLS Pull | H.264 |
| YouTube | RTMP(S), HLS Pull, SRT (Closed Beta) | H.264, HEVC, AV1 |
| Twitch / IVS | RTMP(S) | H.264 |

**Note:** When simulcasting HEVC over SRT, Mux does not transcode the output stream. Verify the destination supports HEVC.
