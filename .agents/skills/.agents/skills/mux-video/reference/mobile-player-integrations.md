# Mobile Player Integrations

Guide for integrating Mux Data with mobile video players on iOS, tvOS, and Android platforms. Covers ExoPlayer, AVPlayer, AndroidX Media3, and various third-party player SDKs.

## Platform Overview

Mux Data provides native SDKs for mobile platforms that integrate with various video players:

| Platform | Players Supported |
|----------|-------------------|
| Android | ExoPlayer, AndroidX Media3, MediaPlayer, Bitmovin Player, Brightcove |
| iOS/tvOS | AVPlayer, Brightcove |
| visionOS | AVPlayer (AVPlayerViewController) |

---

## Android: ExoPlayer Integration

The Mux integration with ExoPlayer supports version 2.10.x and higher. The full source is available at [muxinc/mux-stats-sdk-exoplayer](https://github.com/muxinc/mux-stats-sdk-exoplayer).

### Installation

Add the Mux Maven repository to your Gradle file:

```gradle
repositories {
    maven {
        url "https://muxinc.jfrog.io/artifactory/default-maven-release-local"
    }
}
```

Add a dependency using the format that matches your ExoPlayer version:

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_(ExoPlayer SDK version with underscores):(Mux SDK version)'
```

Example using Mux ExoPlayer SDK 2.7.2 and ExoPlayer version r2.16.1:

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_r2_16_1:2.7.2'
```

**Supported ExoPlayer versions:**
- r2.10.6, r2.11.1, r2.12.1, r2.13.1, r2.14.1, r2.15.1, r2.16.1, r2.17.1, r2.18.1, r2.19.1
- `amznPort` (Amazon ExoPlayer Port)

**Amazon ExoPlayer Port:**

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_amznPort:(Mux SDK version)'
```

### ProGuard/R8 Configuration

Add this line to your proguard rules file:

```
-dontwarn com.google.ads.interactivemedia.v3.api.**
```

### Initialize the Monitor

Create customer data objects and initialize the monitor:

```kotlin
val customerData = CustomerData().apply {
    customerVideoData = CustomerVideoData().apply {
        videoTitle = "Mux ExoPlayer Android Example"
        videoSourceUrl = videoUrl  // ExoPlayer doesn't provide API for this
    }
    customerViewData = CustomerViewData().apply {
        viewSessionId = UUID.randomUUID().toString()
    }
    customerViewerData = CustomerViewerData().apply {
        muxViewerDeviceCategory = "kiosk"
        muxViewerDeviceManufacturer = "Example Display Systems"
        muxViewerOsVersion = "1.2.3-dev"
    }
    customData = CustomData().apply {
        customData1 = "Hello"
        customData2 = "World"
        customData3 = "From"
        customData4 = "Mux"
        customData5 = "Data"
    }
}

muxStatsExoPlayer = exoPlayer.monitorWithMuxData(
    context = requireContext(),
    envKey = "YOUR_ENV_KEY_HERE",
    playerView = playerView,
    customerData = customerData
)
```

Java alternative:

```java
muxStatsExoPlayer = new MuxStatsExoPlayer(this, "YOUR_ENV_KEY_HERE", player, playerView, customerData);
```

Set the player view for viewer context values:

```java
muxStatsExoPlayer.setPlayerView(simpleExoPlayerView.getVideoSurfaceView());
```

Release when destroying the player:

```java
muxStatsExoPlayer.release()
```

### Changing Videos

**New source** (playlist advancement or user selection):

```kotlin
muxStatsExoPlayer.videoChange(CustomerVideoData)
```

**New program** (within a single stream like a live broadcast):

```kotlin
muxStatsExoPlayer.programChange(CustomerVideoData)
```

### Full-Screen Detection

```kotlin
playerView.setFullscreenButtonClickListener { isFullScreen ->
    if(isFullScreen) {
        muxStats.presentationChange(MuxSDKViewPresentation.FULLSCREEN)
    } else {
        muxStats.presentationChange(MuxSDKViewPresentation.NORMAL)
    }
}
```

### Error Tracking

Manual error tracking:

```kotlin
val errorCode = 1
val errorMessage = "A fatal error was encountered during playback"
val errorContext = "Additional information about the error such as a stack trace"
val error = MuxErrorException(errorCode, errorMessage, errorContext)
muxStatsExoPlayer.error(error)
```

Disable automatic error tracking (for apps with retry logic):

```kotlin
muxStatsExoPlayer.setAutomaticErrorTracking(false)
```

### Google IMA Ads Integration

**ExoPlayer r2.12.x and up:**

```kotlin
adsLoader = ImaAdsLoader.Builder(context = this)
    .setAdErrorListener(muxStats.getAdErrorEventListener())
    .setAdEventListener(muxStats.getAdEventListener())
    .build()
```

**ExoPlayer pre-r2.12.x:**

```kotlin
sdkFactory = ImaSdkFactory.getInstance()
adsLoader = sdkFactory.createAdsLoader(this)
muxStatsExoPlayer.monitorImaAdsLoader(adsLoader)
```

### Build Requirements

Starting with version 2.6.0, the SDK requires:
- JDK 11
- Android Gradle Plugin 7.0 or greater
- Gradle 7.0.2 or greater

---

## Android: AndroidX Media3 Integration

The Mux Data SDK for Media3 integrates with Google's AndroidX Media3 SDK. Source available at [muxinc/mux-stats-sdk-media3](https://github.com/muxinc/mux-stats-sdk-media3).

### Installation

Add Mux's maven repository:

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        maven { url = uri("https://muxinc.jfrog.io/artifactory/default-maven-release-local") }
    }
}
```

```groovy
// settings.gradle (Groovy)
dependencyResolutionManagement {
    repositories {
        maven { url "https://muxinc.jfrog.io/artifactory/default-maven-release-local" }
    }
}
```

Add the dependency:

```kotlin
implementation("com.mux.stats.sdk.muxstats:data-media3:[Current Version]")
```

**Supported Media3 versions:** 1.0.x through 1.9.x

To pin to a specific Media3 version:

```kotlin
// Stay on media3 1.0 while getting the most-recent mux data
implementation("com.mux.stats.sdk.muxstats:data-media3-at_1_0:[Current Version]")
```

### Initialize the Monitor

```kotlin
val muxStats = exoPlayer.monitorWithMuxData(
    context = this,
    envKey = "YOUR_ENV_KEY_HERE",
    customerData = customerData,
    playerView = playerView
)
```

Java:

```java
MuxStatsSdkMedia3<ExoPlayer> muxStats = new MuxStatsSdkMedia3<>(
    /* context = */ this,
    /* envKey = */ "YOUR MUX DATA ENV KEY HERE",
    /* customerData = */ myCustomerData,
    /* player = */ player,
    /* playerView = */ playerView,
    /* playerBinding = */ new ExoPlayerBinding()
);
```

### Adding Metadata

```kotlin
val customerData = CustomerData().apply {
    customerVideoData = CustomerVideoData().apply {
        videoTitle = "My Video Title"
        videoId = "video-123"
    }
    customerPlayerData = CustomerPlayerData().apply {
        playerName = "My Player"
    }
}
```

### Google IMA Ads Integration

Add the IMA extension:

```kotlin
implementation("com.mux.stats.sdk.muxstats:data-media3-ima:0.7.1")
```

Monitor your IMA integration:

```kotlin
val muxStats = newPlayer.monitorWithMuxData(context, DATA_ENV_KEY, customerData)
adsLoader = ImaAdsLoader.Builder(this)
    .monitorWith(
        muxStats = muxStats!!,
        customerAdErrorListener = { /* your custom logic */ },
        customerAdEventListener = { /* your custom logic */ },
    )
    .build()
adsLoader.setPlayer(newPlayer)
```

### Migrating from ExoPlayer SDK

1. Change dependency to `implementation "com.mux.stats.sdk.muxstats:data-media3:1.0.0"`
2. Change `MuxStatsExoPlayer` to `MuxStatsSdkMedia3<ExoPlayer>`
3. For Java: add `new ExoPlayerBinding()` to constructor parameters
4. Rewrite IMA Ads integration as shown above

---

## Android: MediaPlayer Integration

The Mux integration with Android's MediaPlayer class supports Android 4.2 (API level 17) and newer. Source: [muxinc/mux-stats-sdk-mediaplayer](https://github.com/muxinc/mux-stats-sdk-mediaplayer).

### Installation

Download the AAR from [releases](https://github.com/muxinc/mux-stats-sdk-mediaplayer/releases) or build from source:

```sh
./gradlew :MuxMediaPlayer:assembleRelease
```

Import via Android Studio: `File > New > New Module... > Import .JAR/.AAR Package`

### Initialize the Monitor

```java
import com.mux.stats.core.models.CustomerPlayerData;
import com.mux.stats.core.models.CustomerVideoData;

CustomerPlayerData customerPlayerData = new CustomerPlayerData();
customerPlayerData.setEnvironmentKey("ENV_KEY");
CustomerVideoData customerVideoData = new CustomerVideoData();
customerVideoData.setVideoTitle("My great video");

muxStatsMediaPlayer = new MuxStatsMediaPlayer(this, player, "demo-player", customerPlayerData, customerVideoData);
```

Set screen size for full-screen monitoring:

```java
Point size = new Point();
getWindowManager().getDefaultDisplay().getSize(size);
muxStatsMediaPlayer.setScreenSize(size.x, size.y);
```

Set player view:

```java
muxStatsMediaPlayer.setPlayerView(playerView);
```

### Set Up Required Event Listeners

MediaPlayer requires explicit method calls since it lacks listener callbacks for all events:

```java
player.setOnCompletionListener(muxStatsMediaPlayer.getOnCompletionListener(myCompletionListener));
player.setOnErrorListener(muxStatsMediaPlayer.getOnErrorListener(myErrorListener));
player.setOnPreparedListener(muxStatsMediaPlayer.getOnPreparedListener(this));
player.setOnInfoListener(muxStatsMediaPlayer.getOnInfoListener(null));
player.setOnSeekCompleteListener(muxStatsMediaPlayer.getOnSeekCompleteListener(null));
player.setOnVideoSizeChangedListener(muxStatsMediaPlayer.getOnVideoSizeChangedListener(myVideoSizeChangedListener));
```

Invoke MuxStatsMediaPlayer methods when controlling playback:

```java
private class MediaPlayerControl implements MediaController.MediaPlayerControl {
    @Override
    public void start() {
        if (player != null) {
            player.start();
            muxStats.play();
        }
    }

    @Override
    public void pause() {
        if (player != null) {
            player.pause();
            muxStats.pause();
        }
    }

    @Override
    public void seekTo(int pos) {
        if (player != null) {
            player.seekTo(pos);
            muxStats.seeking();
        }
    }
}
```

Release when done:

```java
muxStatsMediaPlayer.release()
```

---

## Android: Bitmovin Player Integration

Supports Bitmovin Player version 3.x and 2.x. Source: [muxinc/mux-stats-sdk-bitmovin-android](https://github.com/muxinc/mux-stats-sdk-bitmovin-android).

### Installation

```groovy
repositories {
    maven {
        url "https://muxinc.jfrog.io/artifactory/default-maven-release-local"
    }
}

implementation 'com.mux.stats.sdk.muxstats:muxstatssdkbitmovinplayer_r3_11_1:[CurrentVersion]'
```

### Initialize the Monitor

```java
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.core.model.CustomerVideoData;
import com.mux.stats.sdk.core.model.CustomerViewData;
import com.mux.stats.sdk.core.model.CustomData;
import com.mux.stats.sdk.core.model.CustomerData;

CustomerPlayerData customerPlayerData = new CustomerPlayerData();
customerPlayerData.setEnvironmentKey("YOUR_ENVIRONMENT_KEY_HERE");

CustomerVideoData customerVideoData = new CustomerVideoData();
customerVideoData.setVideoTitle(intent.getStringExtra("YOUR_VIDEO_TITLE"));

CustomerViewData customerViewData = new CustomerViewData();
customerViewData.setViewSessionId("A26C4C2F-3C8A-46FB-885A-8D973F99A998");

CustomData customData = new CustomData();
customData.setCustomData1("YOUR_CUSTOM_STRING_HERE");

CustomerData customerData = new CustomerData(customerPlayerData, customerVideoData, customerViewData);
customerData.setCustomData(customData);

// Create monitor before calling prepare on Bitmovin Player
muxStatsBitmovinPlayer = new MuxStatsSDKBitmovinPlayer(
    this, player, "demo-player", customerData);
```

Set screen size and player view:

```java
Point size = new Point();
getWindowManager().getDefaultDisplay().getSize(size);
muxStatsBitmovinPlayer.setScreenSize(size.x, size.y);
muxStatsBitmovinPlayer.setPlayerView(playerView);
```

Release when done:

```java
muxStatsBitmovinPlayer.release()
```

---

## Android: Brightcove Integration

Brightcove's Android SDK supports both MediaPlayer and ExoPlayer. For ExoPlayer-based players, use the MuxStatsExoPlayer integration.

**Requirements:**
- Brightcove SDK for Android 6.x
- ExoPlayer-based Brightcove Player (e.g., `BrightcoveExoPlayerVideoView`)

### Integration

Listen for the `didSetVideo` event to create the Mux monitor:

```java
import com.mux.stats.sdk.core.model.CustomerPlayerData;
import com.mux.stats.sdk.core.model.CustomerVideoData;
import com.mux.stats.sdk.muxstats.MuxStatsExoPlayer;

public class MainFragment extends BrightcovePlayerFragment implements EventListener {
    private MuxStatsExoPlayer muxStatsExoPlayer;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View result = inflater.inflate(R.layout.fragment_main, container, false);
        baseVideoView = (BrightcoveExoPlayerVideoView) result.findViewById(R.id.brightcove_video_view);
        super.onCreateView(inflater, container, savedInstanceState);
        baseVideoView.getEventEmitter().on("didSetVideo", this);

        Video video = Video.createVideo("https://path/to/video.mp4", DeliveryType.HLS);
        baseVideoView.add(video);
        baseVideoView.start();
        return result;
    }

    @Override
    public void processEvent(Event event) {
        ExoPlayerVideoDisplayComponent videoDisplayComponent =
            (ExoPlayerVideoDisplayComponent) baseVideoView.getVideoDisplay();
        Video video = baseVideoView.getCurrentVideo();
        ExoPlayer exoPlayer = videoDisplayComponent.getExoPlayer();

        CustomerPlayerData customerPlayerData = new CustomerPlayerData();
        CustomerVideoData customerVideoData = new CustomerVideoData();
        customerVideoData.setVideoTitle(video.getId());
        CustomerData customerData = new CustomerData(customerPlayerData, customerVideoData, null);

        if (muxStatsExoPlayer != null) {
            muxStatsExoPlayer.release();
            muxStatsExoPlayer = null;
        }

        muxStatsExoPlayer = new MuxStatsExoPlayer(
            this, "YOUR_ENV_KEY_HERE", exoPlayer, baseVideoView, customerData);
    }
}
```

---

## iOS/tvOS: AVPlayer Integration

Supports iOS 12.0+, tvOS 12.0+, Mac Catalyst, and visionOS 1.0+. Source: [muxinc/mux-stats-sdk-avplayer](https://github.com/muxinc/mux-stats-sdk-avplayer).

### Installation

**Swift Package Manager (Xcode):**
1. File > Swift Packages > Add Package Dependency...
2. URL: `https://github.com/muxinc/mux-stats-sdk-avplayer.git`
3. Set Rules to "Up to Next Major" starting from `4.0.0`

**Package.swift:**

```swift
.package(
    url: "https://github.com/muxinc/mux-stats-sdk-avplayer",
    .upToNextMajor(from: "4.0.0")
),
```

**CocoaPods:**

```ruby
pod 'Mux-Stats-AVPlayer', '~>4.0'
```

### Initialize the Monitor

For `AVPlayerViewController`:

```swift
import MUXSDKStats

let playerData = MUXSDKCustomerPlayerData(environmentKey: "ENV_KEY")
playerData?.playerName = "My Player"

let videoData = MUXSDKCustomerVideoData()
videoData.videoTitle = "My Video"
videoData.videoId = "video-123"

MUXSDKStats.monitorAVPlayerViewController(
    self,
    withPlayerName: "myPlayer",
    playerData: playerData!,
    videoData: videoData
)
```

For `AVPlayerLayer`:

```swift
MUXSDKStats.monitorAVPlayerLayer(
    playerLayer,
    withPlayerName: "myPlayer",
    playerData: playerData!,
    videoData: videoData
)
```

**SwiftUI note:** Attach the monitor in the `onAppear` action to ensure view dimensions are available.

### Updating Metadata

Update metadata after initialization:

```swift
let newVideoData = MUXSDKCustomerVideoData()
newVideoData.videoTitle = "Updated Title"
MUXSDKStats.setCustomerData(forPlayer: "myPlayer", videoData: newVideoData)
```

### Changing Videos

**New source:**

```swift
let videoData = MUXSDKCustomerVideoData()
videoData.videoId = "abcd123"
videoData.videoTitle = "My Great Video"
videoData.videoSeries = "Weekly Great Videos"
videoData.videoDuration = 120000 // milliseconds
videoData.videoIsLive = false
videoData.videoCdn = "cdn"
MUXSDKStats.videoChange(forPlayer: "AVPlayer", with: videoData)

player.replaceCurrentItem(with: AVPlayerItem(url: url!))
player.play() // Required after replaceCurrentItem
```

**New program:**

```swift
MUXSDKStats.programChange(forPlayer: "AVPlayer", withCustomerData: customerData)
```

### AVQueuePlayer Usage

Listen for item completion and call `videoChangeForPlayer`:

```swift
let playName = "iOS AVPlayer"

override func viewDidLoad() {
    super.viewDidLoad()

    let item1 = AVPlayerItem(url: URL(string: "https://stream.mux.com/example1.m3u8")!)
    let item2 = AVPlayerItem(url: URL(string: "https://stream.mux.com/example2.m3u8")!)

    NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.playerItemDidReachEnd),
        name: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
        object: item1
    )

    player = AVQueuePlayer(items: [item1, item2])

    let playerData = MUXSDKCustomerPlayerData(environmentKey: "ENV_KEY")
    playerData?.playerName = "AVPlayer"
    let videoData = MUXSDKCustomerVideoData()
    videoData.videoIsLive = false
    videoData.videoTitle = "Title1"

    MUXSDKStats.monitorAVPlayerViewController(
        self,
        withPlayerName: playName,
        playerData: playerData!,
        videoData: videoData
    )
    player!.play()
}

@objc func playerItemDidReachEnd(notification: NSNotification) {
    let videoData = MUXSDKCustomerVideoData()
    videoData.videoTitle = "Title2"
    videoData.videoId = "video-id-2"
    MUXSDKStats.videoChange(forPlayer: playName, with: videoData)
}
```

### Google IMA Ads Integration

**Installation:**

```swift
// Package.swift
.package(
    url: "https://github.com/muxinc/mux-stats-google-ima",
    .upToNextMajor(from: "0.14.0")
)
```

```ruby
# CocoaPods
pod 'Mux-Stats-Google-IMA'
```

**Integration:**

```swift
import MuxStatsGoogleIMAPlugin

// After monitorAVPlayerViewController or monitorAVPlayerLayer
let playerBinding = MUXSDKStats.monitorAVPlayerViewController(...)

let adListener = MUXSDKIMAAdListener(
    playerBinding: playerBinding!,
    monitoringAdsLoader: yourAdsLoader
)

// Add ads manager monitoring
adListener.monitorAdsManager(yourIMAAdsManager)

// Notify on ad requests
imaListener.clientAdRequest(yourIMAAdsRequest)  // Client-side ads
// OR
imaListener.daiAdRequest(yourIMAStreamRequest)  // Server-side DAI
```

### Orientation Change Events

```swift
MUXSDKStats.orientationChange(
    forPlayer: "myPlayer",
    with: MUXSDKViewOrientation.landscape
)
```

### Overriding Device Metadata

```swift
let viewerData = MUXSDKCustomerViewerData()
viewerData.viewerApplicationName = "My App"
// Set additional viewer data properties
```

### Error Handling

Disable automatic error tracking:

```swift
MUXSDKStats.monitorAVPlayerViewController(
    self,
    withPlayerName: "myPlayer",
    playerData: playerData!,
    videoData: videoData,
    automaticErrorTracking: false
)
```

Dispatch errors manually:

```swift
MUXSDKStats.dispatchError(
    "error_code",
    withMessage: "Error message",
    severity: MUXSDKErrorSeverityWarning,
    isBusinessException: false,
    errorContext: "Additional context",
    forPlayer: "myPlayer"
)
```

---

## iOS: Brightcove Integration

Brightcove's iOS SDK is based on AVPlayerLayer. Requires Brightcove iOS player version 6.x.

### Installation

```ruby
pod 'Mux-Stats-AVPlayer', '~>3.0'
```

### Integration

Hook into Brightcove's SDK lifecycle events:

```objc
@import BrightcovePlayerSDK;
@import MUXSDKStats;

@property (nonatomic, copy) NSString *trackedPlayerName;

- (void)playbackController:(id<BCOVPlaybackController>)controller
  didAdvanceToPlaybackSession:(id<BCOVPlaybackSession>)session
{
    // Destroy previous MUXSDKStats if needed
    if (self.trackedPlayerName != nil) {
        [MUXSDKStats destroyPlayer:self.trackedPlayerName];
    }

    MUXSDKCustomerPlayerData *playerData =
        [[MUXSDKCustomerPlayerData alloc] initWithEnvironmentKey:@"ENV_KEY"];
    [playerData setPlayerName:@"Brightcove SDK w/ Mux"];

    MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
    [videoData setVideoId:@"EXAMPLE ID"];

    self.trackedPlayerName = @"example_player_name";
    [MUXSDKStats monitorAVPlayerLayer:session.playerLayer
                       withPlayerName:self.trackedPlayerName
                           playerData:playerData
                            videoData:videoData];
}
```

---

## Common Patterns Across All SDKs

### Video Change vs Program Change

- **videoChange**: Use when loading a completely new video (playlist advancement, user selection)
- **programChange**: Use when the program changes within the same stream (live stream with multiple programs)

### Error Tracking Best Practices

- Only track fatal errors that require abandoning playback
- Use error codes and messages consistently
- Consider disabling automatic tracking if implementing retry logic
- Include error context for debugging

### Metadata Guidelines

All metadata is optional except `env_key`, but more metadata enables:
- Better filtering and searching in the dashboard
- More actionable insights
- Comparison across different dimensions

Key metadata to include:
- `videoTitle`: Human-readable title
- `videoId`: Unique identifier
- `videoSourceUrl`: Source URL (required manually for ExoPlayer)
- `videoCdn`: CDN provider
- `videoIsLive`: Whether content is live
- `videoDuration`: Duration in milliseconds

### Release/Cleanup

Always call `release()` or `destroyPlayer()` when:
- The player is being destroyed
- The view is being dismissed
- Switching to a new video (handled automatically by videoChange in most SDKs)
