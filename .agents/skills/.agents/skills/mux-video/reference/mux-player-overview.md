# Mux Player Overview

Mux Player is a drop-in video player component optimized for playing Mux Video assets. It provides automatic Mux Data integration, timeline hover previews, adaptive controls, and modern playback capabilities across web, iOS, and Android platforms.

## Platform Support

| Platform | Package/SDK | Installation |
|----------|-------------|--------------|
| Web (HTML) | `@mux/mux-player` | npm, yarn, or CDN |
| Web (React) | `@mux/mux-player-react` | npm or yarn |
| Web (Embed) | iframe | No installation needed |
| iOS/iPadOS | `MuxPlayerSwift` | Swift Package Manager |
| Android | `com.mux.player:android` | Gradle |

## Supported Content Types

- On-demand video assets
- Live streams
- Low-latency live streams
- DVR mode for live streams
- Audio-only assets

---

## Web Implementation

### Installation Options

**NPM:**
```shell
npm install @mux/mux-player@latest
```

**Yarn:**
```shell
yarn add @mux/mux-player@latest
```

**CDN (Hosted Script):**
```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
```

### HTML Web Component

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata-video-title="Test VOD"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

When using the HTML element version, the `Player Software` in Mux Data appears as `mux-player`.

### HTML Embed (iframe)

```html
<iframe
  src="https://player.mux.com/EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs?metadata-video-title=Test%20VOD&metadata-viewer-user-id=user-id-007"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

When using the iframe embed, the `Player Software` in Mux Data appears as `mux-player-iframe`.

### React Component

**Installation:**
```shell
npm install @mux/mux-player-react@latest
```

**Usage:**
```jsx
import MuxPlayer from "@mux/mux-player-react";

<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  metadata={{
    videoTitle: "Test VOD",
    viewerUserId: "user-id-007"
  }}
/>
```

When using the React version, the `Player Software` in Mux Data appears as `mux-player-react`.

### Accent Color Customization

The default accent color is Mux pink (`#fa50b5`). Override it to match your brand:

**HTML:**
```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  accent-color="#ea580c"
  metadata-video-title="Test VOD"
  metadata-viewer-user-id="user-id-007"
></mux-player>
```

**React:**
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

---

## iOS Implementation

### Installation (Swift Package Manager)

1. Open your project in Xcode
2. Select File > Add Packages
3. Enter the SDK repository URL: `https://github.com/muxinc/mux-player-swift`
4. Select your dependency rule and click Add Package
5. Select your application target for the `MuxPlayerSwift` package product

### Basic Usage

```swift
import AVFoundation
import AVKit
import MuxPlayerSwift

let playbackID = "qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4"

// Using AVPlayerViewController
func preparePlayerViewController(
  playbackID: String
) -> AVPlayerViewController {
  let playerViewController = AVPlayerViewController(
    playbackID: playbackID
  )
  return playerViewController
}

// Using AVPlayerLayer
func preparePlayerLayer(
  playbackID: String
) -> AVPlayerLayer {
  let playerLayer = AVPlayerLayer(
    playbackID: playbackID
  )
  return playerLayer
}
```

### Playback Options (Resolution Control)

```swift
import AVKit
import MuxPlayerSwift

func preparePlayerViewController(
  playbackID: String
) -> AVPlayerViewController {
  let playbackOptions = PlaybackOptions(
    maximumResolution: .upTo720p
  )

  let playerViewController = AVPlayerViewController(
    playbackID: playbackID,
    playbackOptions: playbackOptions
  )

  return playerViewController
}
```

### AVPlayerLayer-Backed Views

```swift
import AVFoundation
import UIKit
import MuxPlayerSwift

func preparePlayerLayer(
  playbackID: String,
  playerView: UIView
) {
  guard let playerLayer = playerView.layer as? AVPlayerLayer else {
    print("Unexpected backing layer type!")
    return
  }

  playerLayer.prepare(
    playbackID: playbackID
  )
}
```

### Custom Mux Data Monitoring

```swift
import AVKit
import MuxPlayerSwift

func preparePlayerViewController(
  playbackID: String
) -> AVPlayerViewController {

  let customEnvironmentKey = "ENV_KEY"

  let playerData = MUXSDKCustomerPlayerData()
  playerData.environmentKey = customEnvironmentKey

  let videoData = MUXSDKCustomerVideoData()
  videoData.videoTitle = "Video Behind the Scenes"
  videoData.videoSeries = "Video101"

  let customerData = MUXSDKCustomerData()
  customerData.playerData = playerData
  customerData.videoData = videoData

  let monitoringOptions = MonitoringOptions(
    customerData: customerData
  )

  let playerViewController = AVPlayerViewController(
      playbackID: playbackID,
      monitoringOptions: monitoringOptions
  )

  return playerViewController
}
```

### Signed Playback URLs (iOS)

```swift
import AVKit
import MuxPlayerSwift

func preparePlayerViewController(
  playbackID: String,
  playbackToken: String
) -> AVPlayerViewController {

  let playbackOptions = PlaybackOptions(playbackToken: playbackToken)

  let playerViewController = AVPlayerViewController(
      playbackID: playbackID,
      playbackOptions: playbackOptions
  )

  return playerViewController
}
```

### DRM Playback (iOS)

```swift
import AVKit
import MuxPlayerSwift

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

### Smart Caching (iOS)

Enable smart caching for improved performance when replaying content:

```swift
import AVKit
import MuxPlayerSwift

func preparePlayerViewController(
  playbackID: String,
  singleRenditionResolutionTier: SingleRenditionResolutionTier
) -> AVPlayerViewController {

  let playbackOptions = PlaybackOptions(
    enableSmartCache: true,
    singleRenditionResolutionTier: singleRenditionResolutionTier
  )

  let playerViewController = AVPlayerViewController(
    playbackID: playbackID,
    playbackOptions: playbackOptions
  )

  return playerViewController
}
```

The smart cache is automatically purged after app termination and may be purged by the OS when the app is suspended.

---

## Android Implementation

### Installation

Add Mux's maven repository to your `settings.gradle` or project-level `build.gradle`:

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        maven { url = uri("https://muxinc.jfrog.io/artifactory/default-maven-release-local") }
    }
}
```

Add the dependency to your app:

```kotlin
// build.gradle.kts
implementation("com.mux.player:android:1.0.0")
```

### Basic Usage

**Create a MuxPlayer:**
```kotlin
val player: MuxPlayer = MuxPlayer.Builder(context = this)
  .enableLogcat(true) // Optional
  .applyExoConfig {
    setHandleAudioBecomingNoisy(true)
  }
.build()
```

**Play a Mux Video Asset:**
```kotlin
val mediaItem = MediaItems.builderFromMuxPlaybackId("YOUR PLAYBACK ID")
  .setMediaMetadata(
    MediaMetadata.Builder()
      .setTitle("Hello from Mux Player on Android!")
      .build()
  )
  .build()

player.setMediaItem(mediaItem)
player.prepare()
player.playWhenReady = true
```

### Resolution Control (Android)

**Maximum Resolution:**
```kotlin
val mediaItem = MediaItems.builderFromMuxPlaybackId(
  "YOUR PLAYBACK ID",
  maxResolution = PlaybackResolution.FHD_1080,
)
  .build()
```

**Minimum Resolution:**
```kotlin
val mediaItem = MediaItems.builderFromMuxPlaybackId(
  "YOUR PLAYBACK ID",
  minResolution = PlaybackResolution.HD_720,
)
  .build()
```

### Smart Caching (Android)

```kotlin
val player: MuxPlayer = MuxPlayer.Builder(context)
  .enableSmartCache(true)
  .build()
```

### Custom Mux Data Metadata (Android)

```kotlin
private fun createPlayer(context: Context): MuxPlayer {
  return MuxPlayer.Builder(context)
    .addMonitoringData(
      CustomerData().apply {
        customerViewData = CustomerViewData().apply {
          viewSessionId = UUID.generateUUID()
        }
        customerVideoData = CustomerVideoData().apply {
          videoSeries = "My Series"
          videoId = "abc1234zyxw"
        }
        customData = CustomData().apply {
          customData1 = "my custom metadata field"
          customData2 = "another custom metadata field"
          customData10 = "up to 10 custom fields"
        }
      }
    )
    .build()
}
```

### Signed Playback URLs (Android)

```kotlin
private fun playSomething(jwt: String, context: Context) {
  val player = createPlayer(context)
  val mediaItem = MediaItems.builderFromMuxPlaybackId(
    playbackId,
    playbackToken = jwt,
  )
    .setMediaMetadata(
      MediaMetadata.Builder()
        .setTitle("Private Playback ID Example")
        .build()
    )
    .build()
  player.setMediaItem(mediaItem)
}
```

### DRM Playback (Android)

```kotlin
private fun playSomething(myPlaybackId: String, myPlaybackToken: String, myDrmToken: String, context: Context) {
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
}
```

### Custom Domain (Android)

```kotlin
val mediaItem = MediaItems.builderFromMuxPlaybackId(
  "YOUR PLAYBACK ID",
  domain = "customdomain.com",
)
  .build()
```

---

## Core Features

### Mux Data Integration

Mux Player automatically integrates with Mux Data to measure performance and quality of experience. No configuration is necessary - the Mux Data environment is inferred from the playback ID.

To override and send views to a specific Mux environment:
- HTML: `env-key` attribute
- React: `envKey` prop

### Adaptive Controls

Controls automatically adjust based on:
- Stream type (`on-demand` or `live`)
- Feature support (AirPlay, Chromecast, fullscreen, PiP)
- Player container size (not viewport size)

Controls shown based on availability include:
- AirPlay (Apple devices)
- Chromecast (requires detection on network)
- Fullscreen (if available on the page)
- Picture-in-picture
- Volume controls (not on iOS/iPadOS where hardware buttons are required)

### Timeline Hover Previews

Timeline hover previews automatically display thumbnails when hovering over the timeline, showing video content at each timestamp. This feature works automatically with Mux-hosted content.

### Quality Selector

By default, Mux Player shows a quality selector allowing users to pin to a specific rendition. Availability depends on platform:

| Environment | Quality Selector Available |
|-------------|---------------------------|
| Non-Safari desktop browsers | Yes (uses MSE) |
| Android browsers | Yes (uses MSE) |
| macOS Safari / iPadOS browsers | Not by default (can enable with `playbackEngine="mse"`) |
| iOS browsers | No (MSE not supported) |

To hide the quality selector:
```css
mux-player {
  --rendition-menu-button: none;
}
```

### Multi-Track Audio Selector

If your stream has multiple audio tracks (descriptive audio, language dubs), Mux Player shows an audio track selector. Hidden automatically if only one track exists.

To hide:
```css
mux-player {
  --audio-track-menu-button: none;
}
```

### Chromecast Support

Chromecast support is built-in.

- **Mux Player >= v2.3.0**: No additional configuration needed
- **Mux Player < v2.3.0**: Add the Google Cast script to your page:

```html
<script
  defer
  src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
></script>
```

Note: The default Chromecast receiver does not support low-latency live streams. For custom receiver apps, override `chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID`.

### Live Stream Playback Modes

**Non-DVR Mode (most common):**
- Use the `playback_id` associated with the Live Stream
- Keeps viewers on the live edge
- Does not allow seeking backwards while live

**DVR Mode:**
- Use the `playback_id` associated with the Asset that corresponds to the Live Stream
- Allows users to seek backwards while the stream is still live
- UI shows a timeline for scrolling back to the beginning

### Autoplay

```html
<mux-player
  playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  autoplay
></mux-player>
```

Additional autoplay values:
- `autoplay="muted"` - Mutes audio first to increase success odds
- `autoplay="any"` - Attempts playback with current options, falls back to muted if needed

### Audio Player Mode

For audio-only assets or to display video as audio player:

```html
<mux-player
  playback-id="YOUR_AUDIO_PLAYBACK_ID"
  audio
></mux-player>
```

---

## Accessibility

Mux Player supports WCAG AA compliance with:
- Keyboard navigation
- Screen reader compatibility (Accessibility Object Model)
- Closed captions/subtitles shown by default (if available)

When customizing colors, ensure implementations meet WCAG 2.1 contrast ratio requirements.

---

## Error Handling

When encountering unrecoverable errors, Mux Player:
1. Displays clear error messages to viewers
2. Provides developer logs prefixed with `[mux-player]` containing debugging details
3. Tracks errors with details in your Mux Data dashboard

---

## Instant Clipping

Request a stream with custom start/end times without creating a new asset.

**iOS:**
```swift
let playbackOptions = PlaybackOptions(
  instantClipping: InstantClipping(
    assetStartTimeInSeconds: 10,
    assetEndTimeInSeconds: 20
  )
)

let playerViewController = AVPlayerViewController(
  playbackID: playbackID,
  playbackOptions: playbackOptions
)
```

Note: Instant clipping operates at segment-level accuracy. Content may be several seconds longer than requested.

---

## Technical Requirements

### Web
- Targets ES2019 JavaScript runtime
- TypeScript 4.5+ for TypeScript benefits

### Browser Support (Evergreen)
- Chrome (Mac, Windows, Linux, iOS, iPadOS, Android)
- Safari (Mac, iOS, iPadOS)
- Firefox (Mac, Windows, Linux, Android)
- Edge (Mac, Windows, Linux)

### iOS
- Requires FairPlay deployment package for DRM playback

### Android
- Built on Google's media3 player SDK

---

## Accessing the Underlying Video Element (Web)

```jsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  ref={(muxPlayerEl) => console.log(muxPlayerEl.media.nativeEl)}
  metadata={{
    video_id: "video-id-54321",
    video_title: "Test video title",
    viewer_user_id: "user-id-007",
  }}
/>
```

Note: Not available when using iframe embed. Control embedded player through the Player.js spec.

---

## Architecture (Web)

Mux Player is built with Web Components and consists of:
- **Mux Video HTML element**: Handles HLS playback and Mux Data integration
- **Media Chrome**: Provides the UI layer

Both components are maintained by Mux.
