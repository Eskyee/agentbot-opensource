# Playing DRM-Protected Videos

This guide demonstrates how to configure DRM-protected playback across web, iOS, and Android platforms, including token generation and player configuration.

## Overview

DRM (Digital Rights Management) provides an extra layer of content security for video content streamed from Mux. Mux uses industry-standard protocols: Google Widevine, Microsoft PlayReady, and Apple FairPlay.

DRM requires the use of Signed URLs. When combined with Domain and User-Agent restrictions, it provides strong content protection that can satisfy requirements of Hollywood studios.

### What DRM Protects Against

- Screen recording
- Screen sharing
- Downloading tools

### Protection Levels by Device

| Device Type | Encrypted Video | Screen Capture Protection | HDCP Enforced |
|-------------|-----------------|---------------------------|---------------|
| iPhone/iPad | Yes | Yes | Yes |
| Modern Android devices | Yes | Usually | No |
| Older/lower-end Android | Yes | Sometimes | No |
| Chrome/Edge on desktop | Yes | Sometimes | No |

## Prerequisites

Before implementing DRM playback:

1. Request a FairPlay certificate from Apple for playback on Apple devices
2. Contact Mux support to enable DRM on your environment
3. Receive your DRM configuration ID from Mux (found in Settings -> Digital Rights Management)

## Creating DRM-Protected Assets

### Create a DRM-Protected Asset

Use the Create Asset API with `advanced_playback_policies` and your DRM configuration ID. Video quality must be set to `plus` or `premium`.

```json
// POST /video/v1/assets
{
  "inputs": [
    {
      "url": "https://storage.googleapis.com/muxdemofiles/mux.mp4"
    }
  ],
  "advanced_playback_policies": [
    {
      "policy": "drm",
      "drm_configuration_id": "your-drm-configuration-id"
    }
  ],
  "video_quality": "plus"
}
```

### Create a DRM-Protected Live Stream

```json
// POST /video/v1/live-streams
{
  "advanced_playback_policies": [
    {
      "policy": "drm",
      "drm_configuration_id": "your-drm-configuration-id"
    }
  ],
  "new_asset_settings": {
    "advanced_playback_policies": [
      {
        "policy": "drm",
        "drm_configuration_id": "your-drm-configuration-id"
      }
    ]
  }
}
```

## Generating DRM Tokens

To play DRM-protected content, you need two tokens: a playback token and a DRM license token. Both are JWTs signed using Mux's signing key requirements.

### Using the Mux Node SDK

```js
const mux = new Mux({
  tokenId: "your-access-token-id",
  tokenSecret: "your-access-token-secret",
  jwtSigningKey: "your-environment-signing-public-key",
  jwtPrivateKey: "your-environment-signing-private-key"
});

const playbackToken = await mux.jwt.signPlaybackId("your-playback-id", {expiration: '7d'});
const drmLicenseToken = await mux.jwt.signDrmLicense("your-playback-id", {expiration: '7d'});
```

## Web Player Configuration

Support for DRM in Mux Player was added in version 2.8.0.

### HTML

```html
<mux-player
  playback-id="your-playback-id"
  playback-token="your-playback-token"
  drm-token="your-drm-license-token"
></mux-player>
```

### React

```jsx
import MuxPlayer from '@mux/mux-player-react';

<MuxPlayer
  playbackId="your-playback-id"
  tokens={{
    playback: "your-playback-token",
    drm: "your-drm-license-token"
  }}
/>
```

## iOS Player Configuration

Support for DRM in Mux Player for iOS was added in version 1.1.0.

FairPlay is required for iOS/iPadOS playback. You must obtain a FairPlay deployment package from Apple before DRM content will play on these platforms.

### AVPlayerViewController with DRM

```swift
import AVFoundation
import AVKit
import MuxPlayerSwift

/// Prepare an AVPlayerViewController to stream and monitor a Mux asset
/// with a playback ID configured for DRM
func preparePlayerViewController(
  playbackID: String,
  playbackToken: String,
  drmToken: String
) -> AVPlayerViewController {

  let playbackOptions = PlaybackOptions(
    playbackToken: playbackToken,
    drmToken: drmToken
  )

  let playerViewController = AVPlayerViewController(
      playbackID: playbackID,
      playbackOptions: playbackOptions
  )

  return playerViewController
}
```

### Using AVPlayerItem Directly

```swift
let playbackOptions = PlaybackOptions(
  drmToken: "your-drm-license-token",
  playbackToken: "your-playback-token",
)

let playerItem = AVPlayerItem(
  playbackID: "your-playback-id",
  playbackOptions: playbackOptions
)
```

## Android Player Configuration

Support for DRM in Mux Player for Android was added in version 1.1.0. Mux Player for Android uses Widevine DRM automatically when configured with the proper tokens.

### Kotlin

```kotlin
private fun playSomething(
  myPlaybackId: String,
  myPlaybackToken: String,
  myDrmToken: String,
  context: Context
) {
  val player = createPlayer(context)
  val mediaItem = MediaItems.builderFromMuxPlaybackId(
    playbackId,
    playbackToken = myPlaybackToken,
    drmToken = myDrmToken,
  )
    .setMediaMetadata(
      MediaMetadata.Builder()
        .setTitle("DRM playback Example")
        .build()
    )
    .build()
  player.setMediaItem(mediaItem)

  // Then prepare and play your media as normal
  player.prepare()
  player.playWhenReady = true
}
```

### Java

```java
MuxPlayer player = createPlayer(context);
MediaItem mediaItem = MediaItems.builderFromMuxPlaybackId(
      "your-playback-id",
      PlaybackResolution.QHD_1440,
      PlaybackResolution.LD_540,
      RenditionOrder.Descending,
      /* domain = */ null,
      /*playbackToken = */ jwt,
      /*drmToken = */ drmToken
  )
  .setMediaMetadata(
      new MediaMetadata.Builder()
          .setTitle("DRM Playback Example")
          .build()
  )
  .build();
player.setMediaItem(mediaItem);

// Then prepare and play your media as normal
player.setPlayWhenReady(true);
player.prepare();
```

## Third-Party Player Configuration

If not using Mux players, you need to construct license URLs manually.

### License URL Formats

**Widevine:**
```
https://license.mux.com/license/widevine/{playback-id}?token={drm-license-token}
```

**FairPlay License URL:**
```
https://license.mux.com/license/fairplay/{playback-id}?token={drm-license-token}
```

**FairPlay Certificate URL:**
```
https://license.mux.com/appcert/fairplay/{playback-id}?token={drm-license-token}
```

**PlayReady:**
```
https://license.mux.com/license/playready/{playback-id}?token={drm-license-token}
```

### HLS.js Configuration

```js
if (Hls.isSupported()) {
  var hls = new Hls({
    emeEnabled: true,
    drmSystems: {
      'com.widevine.alpha': {
        licenseUrl: 'https://license.mux.com/license/widevine/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}'
      },
      'com.microsoft.playready': {
        licenseUrl: 'https://license.mux.com/license/playready/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}'
      },
      'com.apple.fps': {
        licenseUrl: 'https://license.mux.com/license/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
        serverCertificateUrl: 'https://license.mux.com/appcert/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
      }
    }
  });
}
```

### Video.js Configuration

Requires the `videojs-contrib-eme` plugin.

```js
const player = videojs('vid1', {});

player.eme();
player.src({
  src: 'https://stream.mux.com/{playback-id}.m3u8?token={JWT}',
  type: 'application/x-mpegURL',
  keySystems: {
    'com.widevine.alpha': 'https://license.mux.com/license/widevine/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
    'com.apple.fps.1_0': {
      certificateUri: 'https://license.mux.com/appcert/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
      licenseUri: 'https://license.mux.com/license/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
    },
    'com.microsoft.playready': 'https://license.mux.com/license/playready/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}'
  }
});
```

### Shaka Player Configuration

```js
player.configure({
  drm: {
    servers: {
      'com.widevine.alpha': 'https://license.mux.com/license/widevine/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
      'com.apple.fps.1_0': 'https://license.mux.com/license/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}',
      'com.microsoft.playready': 'https://license.mux.com/license/playready/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}'
    },
    advanced: {
      'com.apple.fps.1_0': {
        serverCertificateUri: 'https://license.mux.com/appcert/fairplay/${PLAYBACK_ID}?token=${DRM_LICENSE_TOKEN}'
      }
    }
  }
});
```

### Roku Configuration

Add to your channel's manifest:
```
requires_widevine_drm=1
requires_widevine_version=1.0
```

Configure the content node:
```brightscript
drmParams = {
  keySystem: "Widevine",
  licenseServerURL: "https://license.mux.com/license/widevine/${PLAYBACK_ID}?token=${DRM_LICENSE_JWT}"
}

contentNode = CreateObject("roSGNode", "ContentNode")
contentNode.url = "<content URL>"
contentNode.drmParams = drmParams
contentNode.title = "<your title>"
contentNode.length = <duration in seconds>

' Play your video as you normally would
```

## Supported Platforms

### Desktop Browsers
- Chrome (macOS and Windows)
- Firefox (macOS and Windows)
- Safari (macOS)
- Edge (Windows)
- Legacy Edge (Windows)

### Mobile Browsers
- Chrome on Android
- Firefox on Android
- All browsers on iOS

### Native Mobile Apps
- Android apps using Mux Player for Android
- iOS apps using Mux Player for iOS

### Living Room Devices (OTT)
- Chromecast
- Google TV
- Apple TV (tvOS)
- Roku
- Fire TV

## Testing DRM

To verify DRM is working correctly, take a screenshot during playback. If DRM is active, the video will appear as either a black rectangle or a single frame from the start of the video in the screenshot.

## Version Requirements

| Platform | Minimum Version |
|----------|-----------------|
| Mux Player Web | 2.8.0 |
| Mux Player iOS | 1.1.0 |
| Mux Player Android | 1.1.0 |
