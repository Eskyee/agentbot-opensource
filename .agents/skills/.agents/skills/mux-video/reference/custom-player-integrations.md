# Building Custom Player Integrations

Comprehensive guide for building custom Mux Data integrations when no pre-built SDK exists for your player. Covers the core SDK architecture for JavaScript, Java, and Objective-C.

## Overview

Mux provides pre-built SDKs and integrations for most major platforms, but there are some platforms for which there is no pre-built integration. In these cases, Mux provides core SDKs for multiple languages, including JavaScript, Java, and Objective-C. These core libraries encapsulate the majority of the business and metric calculation logic, while exposing a common API for plugging in individual player integrations.

## Integration Architecture

Mux Data SDKs operate by tracking the playback events that occur through the idea of a `Player`. To Mux, a `Player` is an object that encapsulates the playback of videos, exposing APIs for playback events and retrieving playback state information.

In most cases, the `Player` is a single object exposed by the player technology. For instance, for the Video.js integration (`videojs-mux`), the `Player` is just the Video.js Player object. However, in some scenarios, there may be one or more underlying player instances that are unified through a single composite API/object. In these cases, the `Player` would be that higher-level object.

### Three Major Steps for Building an Integration

1. **Initialize a monitor** for the `Player` that is being tracked
2. **Provide callbacks** for the core SDK to retrieve player/device information
3. **Emit events** for each of the important playback events

## Integration-Level Metadata

When initializing a monitor for a `Player`, metadata about the integration itself should be passed:

| Property | Description | Example |
|----------|-------------|---------|
| `player_software_name` | The name of the underlying player software | `'Video.js'` |
| `player_software_version` | The version of the player software | `'1.0.1'` |
| `player_mux_plugin_name` | The name of the plugin being built | Custom descriptive string |
| `player_mux_plugin_version` | The version of the plugin being built | Version string |

---

## JavaScript Integration

### Installation

#### Install via npm or yarn (preferred)

```sh
yarn add mux-embed
```

This will add `mux-embed` as a dependency to your package. Mux follows the semver standard, so updates within a major version will not have any breaking changes.

#### Load from CDN (not preferred)

If you do not use a package manager, include the source file from `https://src.litix.io/core/4/mux.js` directly in a vendor folder.

### Importing the Library

```js
import mux from 'mux-embed';

// mux.log - logs message
// mux.utils - includes multiple helper methods for massaging data
```

### Initialize the SDK

For each new player that is being tracked, initialize the SDK:

```js
mux.init(playerID, options);
```

The core `mux` library can track multiple players at once, so pass a unique player ID for each player you want to track. This ID is used in all future calls to the `mux` library.

#### Init Options

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `debug` | No | boolean | Controls whether debug log statements are logged to the console |
| `getPlayheadTime` | Yes | function | Callback for playhead position |
| `getStateData` | Yes | function | Callback for player state |
| `data` | No | object | Data about the viewer, video, and integration |

Within the `data` object, the only required property is `env_key`, which is your environment key found on the Mux dashboard.

### Provide Callbacks

The JavaScript Core SDK expects two callback functions: `getPlayheadTime` and `getStateData`.

#### getPlayheadTime

A simple function that returns the accurate playhead position in milliseconds.

#### getStateData

A function that returns player state properties:

```js
options.getStateData = () => {
  return {
    // Required properties - must be provided every time
    player_is_paused: player.isPaused(),       // Whether player is paused, stopped, or complete
    player_width: player.getWidth(),           // Width in pixels of player on screen
    player_height: player.getHeight(),         // Height in pixels of player on screen
    video_source_height: player.currentSource().height,  // Height of current rendition
    video_source_width: player.currentSource().width,    // Width of current rendition

    // Preferred properties - provide if possible
    player_is_fullscreen: player.isFullscreen(),
    player_autoplay_on: player.autoplay(),
    player_preload_on: player.preload(),       // true if preloading (metadata, on, auto)
    video_source_url: player.src().url,        // Playback URL (manifest or MP4 file)
    video_source_mime_type: player.src().mimeType,
    video_source_duration: secondsToMs(player.getDuration()),

    // Optional properties
    video_poster_url: player.poster().url(),
    player_language_code: player.language()    // e.g. 'en', 'en-us'
  };
};
```

### Emit Events

All events are emitted via `mux.emit`. This method takes three arguments:
- The player name (same as used in `mux.init`)
- The event name (e.g. `play`)
- (Optional) Additional data to send with the event

The `viewinit` event does not need to be emitted for custom JavaScript integrations - it is handled by `mux.init` and within `mux.emit('videochange', data)`.

```js
// Emit the `play` event
mux.emit('playerId', 'play');

// Emit an ad event with additional metadata
mux.emit('playerId', 'adrequest', {
  ad_tag_url: "https://pubads.g.doubleclick.net/ads/..."
});

// Changing a video
mux.emit('playerId', 'videochange', {
  video_title: 'New Video Title',
  // ... all other metadata about the video
});
```

### Tearing Down

When tearing down the player:
1. Remove any listeners you have on the player for sending events to `mux`
2. Call `mux.emit('playerId', 'destroy')` so the core library can clean up monitoring and end the view

---

## Java Integration

### Installation

#### Option 1: Gradle (preferred)

Add the Mux Maven repository:

```groovy
repositories {
    maven {
        url "https://muxinc.jfrog.io/artifactory/default-maven-release-local"
    }
}
```

Add the dependency (current version is 7.0.11):

```groovy
api 'com.mux:stats.muxcore:7.0.11'
```

#### Option 2: Maven

Add the repository to pom.xml:

```xml
<repository>
    <id>mux</id>
    <name>Mux Maven Repository</name>
    <url>https://muxinc.jfrog.io/artifactory/default-maven-release-local</url>
    <releases>
        <enabled>true</enabled>
    </releases>
    <snapshots>
        <enabled>false</enabled>
    </snapshots>
</repository>
```

Add the dependency:

```xml
<dependency>
    <groupId>com.mux</groupId>
    <artifactId>stats.muxcore</artifactId>
    <version>7.0.11</version>
</dependency>
```

### Initialize the SDK

Create a class that extends `EventBus` and implements `IPlayerListener`:

```java
import com.mux.stats.sdk.core.events.EventBus;
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.core.model.CustomerVideoData;
import com.mux.stats.sdk.core.model.CustomerViewData;
import com.mux.stats.sdk.muxstats.IPlayerListener;

public class PlayerListener extends EventBus implements IPlayerListener {
    MuxStats muxStats;

    PlayerListener(Context ctx, ExoPlayer player, String playerName,
                   CustomerPlayerData customerPlayerData,
                   CustomerVideoData customerVideoData,
                   CustomerViewData customerViewData) {
        super();
        this.player = new WeakReference<>(player);
        state = PlayerState.INIT;
        MuxStats.setHostDevice(new MuxDevice(ctx));
        MuxStats.setHostNetworkApi(new MuxNetworkRequests());
        muxStats = new MuxStats(this, playerName, customerPlayerData,
                                customerVideoData, customerViewData);
        addListener(muxStats);
    }
}
```

This initialization:
1. Initializes the `EventBus` superclass
2. Sets the host device to an instance implementing `IDevice`
3. Sets the host network API to an instance implementing `INetworkRequest`
4. Instantiates `MuxStats`, passing `IPlayerListener` implementation along with metadata
5. Adds muxStats as a listener for events via EventBus

### Provide Callbacks

#### IDevice Interface

Provides device-specific information used as metadata:

```java
public interface IDevice {
    String getHardwareArchitecture();    // e.g. Build.HARDWARE
    String getOSFamily();                 // e.g. "Android"
    String getOSVersion();
    String getManufacturer();             // e.g. Build.MANUFACTURER
    String getModelName();                // e.g. Build.MODEL
    String getPlayerVersion();
    String getDeviceId();                 // Unique device identifier
    String getAppName();
    String getAppVersion();
    String getPluginName();               // e.g. "exoplayer-mux"
    String getPluginVersion();
    String getPlayerSoftware();           // e.g. "ExoPlayer"
    String getNetworkConnectionType();    // e.g. "wifi", "cellular", "ethernet"
    long getElapsedRealtime();            // Milliseconds since epoch (monotonic clock)
    void outputLog(String tag, String msg);
}
```

Set via `MuxStats.setHostDevice` prior to instantiating `MuxStats`.

#### INetworkRequest Interface

Defines methods for the SDK to make network requests:

```java
public interface INetworkRequest {
    interface IMuxNetworkRequestsCompletion {
        void onComplete(boolean result);
    }

    interface IMuxNetworkRequestsCompletion2 {
        void onComplete(boolean result, Map<String, List<String>> headers);
    }

    void get(URL url);
    void post(URL url, JSONObject body, Hashtable<String, String> headers);
    void postWithCompletion(String domain, String envKey, String body,
        Hashtable<String, String> headers, IMuxNetworkRequestsCompletion callback);
    default void postWithCompletion(String domain, String envKey, String body,
        Hashtable<String, String> headers, IMuxNetworkRequestsCompletion2 callback);
}
```

Set via `MuxStats.setHostNetworkApi` prior to instantiating `MuxStats`.

#### IPlayerListener Interface

Callbacks for retrieving player state information:

```java
public interface IPlayerListener {
    long getCurrentPosition();              // Playhead position in ms (update every 250ms minimum)
    String getMimeType();                   // e.g. "video/mp4", "application/x-mpegUrl"
    Integer getSourceWidth();               // Source width in pixels
    Integer getSourceHeight();              // Source height in pixels
    Integer getSourceAdvertisedBitrate();   // Bits per second
    Float getSourceAdvertisedFramerate();
    String getSourceCodec();
    Long getSourceDuration();               // Duration in milliseconds
    boolean isPaused();                     // True if not actively playing/rebuffering/starting
    boolean isBuffering();                  // True if buffering (not playing)
    int getPlayerViewWidth();               // Player width in logical pixels
    int getPlayerViewHeight();              // Player height in logical pixels
    Long getPlayerProgramTime();            // Position based on PDT tags
    Long getPlayerManifestNewestTime();     // Furthest position based on PDT tags
    Long getVideoHoldback();                // Live stream holdback (ms)
    Long getVideoPartHoldback();            // Low latency part holdback (ms)
    Long getVideoPartTargetDuration();      // Low latency part target duration (ms)
    Long getVideoTargetDuration();          // Segment target duration (ms)
}
```

### Emit Events

Events are emitted via the `dispatch` method inherited from `EventBus`:

```java
import com.mux.stats.sdk.events.playback.PlayEvent;

public class PlayerListener extends EventBus implements IPlayerListener {
    // ... initialization code ...

    // When the player begins trying to play back the video
    public void onPlay() {
        dispatch(new PlayEvent(null));
    }
}
```

#### PlayerData Properties

Optional `PlayerData` can be passed with events:

| Property | Description |
|----------|-------------|
| `playerMuxPluginName` | Name of the integration |
| `playerMuxPluginVersion` | Version of the integration |
| `playerSoftwareName` | Name of player software (e.g. "ExoPlayer") |
| `playerSoftwareLanguageCode` | Language code (e.g. "en-US") |
| `playerWidth` | Player width in logical pixels |
| `playerHeight` | Player height in logical pixels |
| `playerIsFullscreen` | Boolean for fullscreen state |
| `playerIsPaused` | Boolean for paused state |
| `playerPlayheadTime` | Current playhead time in milliseconds |

**Note:** As of v5.0.0, `SeekingEvent` is required. As of v6.0.0, `RebufferStartEvent` and `RebufferEndEvent` are also required.

### Bandwidth Throughput Events

Use `RequestBandwidthEvent` with `BandwidthMetricData`:

```java
RequestBandwidthEvent event = new RequestBandwidthEvent(null);
BandwidthMetricData metricData = new BandwidthMetricData();
metricData.setRequestEventType("requestcompleted"); // Match event names from playback events
event.setBandwidthMetricData(metricData);
dispatch(event);
```

### Ad Events

Emit ad events with `AdData`:

```java
AdData adData = new AdData();
adData.setAdCreativeId(creativeId);
adData.setAdId(adId);
AdPlayEvent adPlayEvent = new AdPlayEvent(null);
adPlayEvent.setAdData(adData);
dispatch(adPlayEvent);
```

### Changing the Video

Use helper methods on `MuxStats`:

- `videoChange(CustomerVideoData)` - Use when loading a new HLS/DASH/MP4 video
- `programChange(CustomerVideoData)` - Use when the underlying program changes within the same stream (e.g., live linear playback)

```java
CustomerVideoData customerVideoData = new CustomerVideoData(null);
customerVideoData.setVideoTitle("New Video Title");
// Add other video metadata
muxStats.videoChange(customerVideoData);
```

### Sending Error Events

```java
// Fatal playback error
public void onPlaybackError(String errorCode, String errorMessage, String errorContext) {
    PlayerData playerData = new PlayerData();
    playerData.setErrorCode(errorCode);
    playerData.setErrorMessage(errorMessage);
    ErrorEvent errorEvent = new ErrorEvent(playerData, errorContext);
    dispatch(errorEvent);
}

// Warning
public void onPlaybackWarning(String errorCode, String errorMessage, String errorContext) {
    PlayerData playerData = new PlayerData();
    playerData.setErrorCode(errorCode);
    playerData.setErrorMessage(errorMessage);
    ErrorEvent errorEvent = new ErrorEvent(playerData, errorContext, ErrorSeverity.ErrorSeverityWarning);
    dispatch(errorEvent);
}

// Business exception
public void onBusinessException(String errorCode, String errorMessage, String errorContext) {
    PlayerData playerData = new PlayerData();
    playerData.setErrorCode(errorCode);
    playerData.setErrorMessage(errorMessage);
    ErrorEvent errorEvent = new ErrorEvent(playerData, errorContext);
    errorEvent.setIsBusinessException(true);
    dispatch(errorEvent);
}
```

### Tearing Down

Call `release()` on `MuxStats` when you release your player instance. After calling `release`, the `muxStats` instance will be unusable.

---

## Objective-C Integration

### Installation

#### Swift Package Manager (Xcode)

1. In Xcode, click "File" > "Add Package"
2. Paste the SDK repository URL: `https://github.com/muxinc/stats-sdk-objc.git`
3. Click `Next`
4. Set "Rules" to "Up to Next Major" (recommended for SemVer)

#### Swift Package Manager (Package.swift)

```swift
.package(
  url: "https://github.com/muxinc/stats-sdk-objc",
  .upToNextMajor(from: "5.0.1")
),
```

#### CocoaPods

```ruby
use_frameworks!
pod "Mux-Stats-Core", "~> 5.0"
```

### Initialize the SDK

There is no need to initialize a player monitor for each player - this happens automatically when events are emitted. Set up environment and viewer data globally:

```objc
MUXSDKEnvironmentData *environmentData = [[MUXSDKEnvironmentData alloc] init];
[environmentData setMuxViewerId:[[[UIDevice currentDevice] identifierForVendor] UUIDString]];

MUXSDKViewerData *viewerData = [[MUXSDKViewerData alloc] init];
NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
if (bundleId) {
  [viewerData setViewerApplicationName:bundleId];
}
// Set additional Viewer data

MUXSDKDataEvent *dataEvent = [[MUXSDKDataEvent alloc] init];
[dataEvent setEnvironmentData:environmentData];
[dataEvent setViewerData:viewerData];
[MUXSDKCore dispatchGlobalDataEvent:dataEvent];
```

#### MUXSDKViewerData Properties

```objc
@property (nullable) NSString *viewerApplicationEngine;
@property (nullable) NSString *viewerApplicationName;
@property (nullable) NSString *viewerApplicationVersion;
@property (nullable) NSString *viewerConnectionType;
@property (nullable) NSString *viewerDeviceCategory;
@property (nullable) NSString *viewerDeviceManufacturer;
@property (nullable) NSString *viewerDeviceName;
@property (nullable) NSString *viewerOsArchitecture;
@property (nullable) NSString *viewerOsFamily;
@property (nullable) NSString *viewerOsVersion;
```

**Note:** If monitoring Mux Video assets, you can opt-in to having Mux Data infer environment details by initializing `MUXSDKCustomerPlayerData` with `environmentKey` set to `nil`.

### Emit Events

#### Data Events

Emit data events via `[MUXSDKCore dispatchEvent: forPlayer:]` when metadata changes:

**MUXSDKVideoData properties:**
- `videoSourceWidth` - Width in pixels
- `videoSourceHeight` - Height in pixels
- `videoSourceIsLive` - Whether video is live
- `videoSourceDuration` - Duration in milliseconds
- `videoSourceAdvertisedBitrate` - Bits per second
- `videoSourceFrameDrops` - Total dropped frames for current view

```objc
// When resolution changes
MUXSDKVideoData *videoData = [[MUXSDKVideoData alloc] init];
[videoData setVideoSourceWidth:[NSNumber numberWithInt:width]];
[videoData setVideoSourceHeight:[NSNumber numberWithInt:height]];

MUXSDKDataEvent *dataEvent = [[MUXSDKDataEvent alloc] init];
[dataEvent setVideoData:videoData];
[MUXSDKCore dispatchEvent:dataEvent forPlayer:_playerName];
```

#### Playback Events

Event naming convention: `MUXSDK` + PascalCasedName + `Event` (e.g., `playerready` becomes `MUXSDKPlayerReadyEvent`).

Include `MUXSDKPlayerData` with each playback event:

| Property | Description |
|----------|-------------|
| `playerMuxPluginName` | Name of the integration |
| `playerMuxPluginVersion` | Version of the integration |
| `playerSoftwareName` | Player software name (e.g., "AVPlayer") |
| `playerSoftwareLanguageCode` | Language code (e.g., "en-US") |
| `playerWidth` | Player width in logical pixels |
| `playerHeight` | Player height in logical pixels |
| `playerIsFullscreen` | Boolean for fullscreen state |
| `playerIsPaused` | Boolean for paused state |
| `playerPlayheadTime` | Current playhead time in milliseconds |

```objc
MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
[playerData setPlayerMuxPluginName:@"Sample Custom Player"];
// ... set all other values

MUXSDKPlayerReadyEvent *event = [[MUXSDKPlayerReadyEvent alloc] init];
[event setPlayerData:playerData];
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];
```

### Sample Event Sequence

A basic playback tracking sequence:

```objc
// 1. Dispatch global data event (usually once per application)
MUXSDKDataEvent *dataEvent = [[MUXSDKDataEvent alloc] init];
[dataEvent setEnvironmentData:environmentData];
[dataEvent setViewerData:viewerData];
[MUXSDKCore dispatchGlobalDataEvent:_dataEvent];

// 2. Prepare the view
MUXSDKViewInitEvent *event = [[MUXSDKViewInitEvent alloc] init];
[event setPlayerData:playerData];
[MUXSDKCore dispatchEvent:event forPlayer:playerName];

// 3. Dispatch data about the view (customerPlayerData must include env key)
MUXSDKDataEvent *dataEvent = [[MUXSDKDataEvent alloc] init];
[dataEvent setCustomerPlayerData:customerPlayerData];
[dataEvent setCustomerVideoData:customerVideoData];
[MUXSDKCore dispatchEvent:dataEvent forPlayer:_playerName];

// 4. Emit playback events
MUXSDKPlayerReadyEvent *event = [[MUXSDKPlayerReadyEvent alloc] init];
[event setPlayerData:playerData];
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];

// When player attempts playback
MUXSDKPlayEvent *event = [[MUXSDKPlayEvent alloc] init];
[event setPlayerData:playerData];
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];

// When first frame displays
MUXSDKPlayingEvent *event = [[MUXSDKPlayingEvent alloc] init];
[event setPlayerData:playerData];
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];

// Continue with other playback events...
```

### Network Throughput Events

Emit as `MUXSDKRequestBandwidthEvent` with `MUXSDKBandwidthMetricData`:

```objc
MUXSDKRequestBandwidthEvent *event = [[MUXSDKRequestBandwidthEvent alloc] init];
MUXSDKBandwidthMetricData *metricData = [[MUXSDKBandwidthMetricData alloc] init];
// Configure metric data
[event setBandwidthMetricData:metricData];
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];
```

Use the `renditionLists` property of `MUXSDKBandwidthMetricData` to track stream renditions with resolution, framerate, bitrate, and RFC CODECS tag.

### Reporting Network Conditions

Use `MUXSDKNetworkChangeEvent` (v5.8.0+) to report network connection type changes:

```objc
// Post after viewinit and whenever connection type changes
MUXSDKNetworkChangeEvent *event = [[MUXSDKNetworkChangeEvent alloc] init];
// Configure with connection type
[MUXSDKCore dispatchEvent:event forPlayer:_playerName];
```

### Changing the Video

Sequence for changing videos:

1. Dispatch a `viewend` event
2. Dispatch a `viewinit` event
3. Dispatch a `MUXSDKDataEvent` with new `MUXSDKCustomerVideoData` and `videoChange` property set to `YES`

For same-stream video changes (separate Data views):
1. Dispatch `viewend`
2. Dispatch `viewinit`
3. Dispatch `MUXSDKDataEvent` with `videoChange` = `YES`
4. Dispatch `play` event
5. Dispatch `playing` event

### Sending Error Events

```objc
// Fatal playback error
- (void)dispatchPlaybackErrorWithPlayerName:(NSString *)playerName
                            playerErrorCode:(NSString *)playerErrorCode
                         playerErrorMessage:(NSString *)playerErrorMessage
                         playerErrorContext:(NSString *)playerErrorContext
                         playerPlayheadTime:(NSNumber *)playerPlayheadTime {
  MUXSDKErrorEvent *errorEvent = [[MUXSDKErrorEvent alloc] initWithContext:playerErrorContext];

  MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
  [playerData setPlayerErrorCode:playerErrorCode];
  [playerData setPlayerErrorMessage:playerErrorMessage];
  [playerData setPlayerPlayheadTime:playerPlayheadTime];

  [MUXSDKCore dispatchEvent:errorEvent forPlayer:playerName];
}

// Warning
- (void)dispatchPlaybackWarningWithPlayerName:(NSString *)playerName
                              playerErrorCode:(NSString *)playerErrorCode
                           playerErrorMessage:(NSString *)playerErrorMessage
                           playerErrorContext:(NSString *)playerErrorContext
                           playerPlayheadTime:(NSNumber *)playerPlayheadTime {
  MUXSDKErrorEvent *errorEvent = [[MUXSDKErrorEvent alloc] initWithSeverity:MUXSDKErrorSeverityWarning
                                                                    context:playerErrorContext];

  MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
  [playerData setPlayerErrorCode:playerErrorCode];
  [playerData setPlayerErrorMessage:playerErrorMessage];
  [playerData setPlayerPlayheadTime:playerPlayheadTime];

  [MUXSDKCore dispatchEvent:errorEvent forPlayer:playerName];
}

// Business exception
- (void)dispatchBusinessExceptionWithPlayerName:(NSString *)playerName
                                playerErrorCode:(NSString *)playerErrorCode
                             playerErrorMessage:(NSString *)playerErrorMessage
                             playerErrorContext:(NSString *)playerErrorContext
                             playerPlayheadTime:(NSNumber *)playerPlayheadTime {
  MUXSDKErrorEvent *errorEvent = [[MUXSDKErrorEvent alloc] initWithContext:playerErrorContext];
  [errorEvent setIsBusinessException:YES];

  MUXSDKPlayerData *playerData = [[MUXSDKPlayerData alloc] init];
  [playerData setPlayerErrorCode:playerErrorCode];
  [playerData setPlayerErrorMessage:playerErrorMessage];
  [playerData setPlayerPlayheadTime:playerPlayheadTime];

  [MUXSDKCore dispatchEvent:errorEvent forPlayer:playerName];
}
```

### Destroying the Monitor

When tearing down the player:
1. Remove any listeners you have on the player for sending events to `MUXSDKCore`
2. Call `[MUXSDKCore destroyPlayer:_name]` to clean up monitoring and end the view session

---

## Reference Implementations

Mux provides open-source reference implementations for each SDK:

| SDK | Reference Repository |
|-----|---------------------|
| JavaScript | [web-player-framework](https://github.com/muxinc/web-player-framework) |
| Java | [mux-stats-sdk-exoplayer](https://github.com/muxinc/mux-stats-sdk-exoplayer) |
| Objective-C | [mux-stats-sdk-avplayer](https://github.com/muxinc/mux-stats-sdk-avplayer) |

These repositories provide working examples of custom integrations and can serve as templates for building your own.
