# Mobile Player Integration Examples

Practical code examples for integrating Mux Data with ExoPlayer on Android and AVPlayer on iOS/tvOS, including SDK initialization, metadata configuration, Google IMA ads integration, and video change handling.

## ExoPlayer (Android)

### Installation

Add the Mux Maven repository to your Gradle file:

```gradle
repositories {
    maven {
        url "https://muxinc.jfrog.io/artifactory/default-maven-release-local"
    }
}
```

Add a dependency on the Mux Data ExoPlayer SDK. The format is:

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_(ExoPlayer SDK version with underscores):(Mux SDK version)'
```

Example using Mux ExoPlayer SDK 2.7.2 and ExoPlayer version r2.16.1:

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_r2_16_1:2.7.2'
```

Supported ExoPlayer versions include: r2.10.6, r2.11.1, r2.12.1, r2.13.1, r2.14.1, r2.15.1, r2.16.1, r2.17.1, r2.18.1, r2.19.1, and `amznPort` for Amazon devices.

#### Amazon ExoPlayer Port

For Amazon devices using the official ExoPlayer port:

```gradle
api 'com.mux.stats.sdk.muxstats:MuxExoPlayer_amznPort:(Mux SDK version)'
```

#### ProGuard/R8 Configuration

Add this line to your app's proguard rules file:

```
-dontwarn com.google.ads.interactivemedia.v3.api.**
```

### Initialize the Monitor with Customer Data

```kotlin
val customerData = CustomerData().apply {
        customerVideoData = CustomerVideoData().apply {
          // Data about this video
          // Add or change properties here to customize video metadata such as title,
          //   language, etc
          videoTitle = "Mux ExoPlayer Android Example"
          // ExoPlayer doesn't provide an API to obtain this, so it must be set manually
          videoSourceUrl = videoUrl
        }
        customerViewData = CustomerViewData().apply {
          // Data about this viewing session
          viewSessionId = UUID.randomUUID().toString()
        }
        customerViewerData = CustomerViewerData().apply {
          // Data about the Viewer and the device they are using
          muxViewerDeviceCategory = "kiosk"
          muxViewerDeviceManufacturer = "Example Display Systems"
          muxViewerOsVersion = "1.2.3-dev"
        }
        customData = CustomData().apply {
          // Add values for your Custom Dimensions.
          // Up to 5 strings can be set to track your own data
          customData1 = "Hello"
          customData2 = "World"
          customData3 = "From"
          customData4 = "Mux"
          customData5 = "Data"
        }
```

Initialize the monitor with your ExoPlayer instance:

```kotlin
muxStatsExoPlayer = exoPlayer.monitorWithMuxData(
      context = requireContext(),
      envKey = "YOUR_ENV_KEY_HERE",
      playerView = playerView,
      customerData = customerData
    )
```

Java alternative:

```java
// Make sure to monitor the player before calling `prepare` on the ExoPlayer instance
muxStatsExoPlayer = new MuxStatsExoPlayer(this, "YOUR_ENV_KEY_HERE", player, playerView, customerData);
```

Set the player view for view dimension tracking:

```java
muxStatsExoPlayer.setPlayerView(simpleExoPlayerView.getVideoSurfaceView());
```

Release the monitor when destroying the player:

```java
muxStatsExoPlayer.release()
```

### Changing the Video

#### New Source

When changing to a new video in the same player (playlist advancement, user selection):

```kotlin
muxStatsExoPlayer.videoChange(CustomerVideoData)
```

Call this immediately after telling the player which new source to play.

#### New Program (Single Stream)

For live streams with program changes within a single stream:

```kotlin
muxStatsExoPlayer.programChange(CustomerVideoData)
```

### Full-Screen Detection

For custom full-screen handling with SimplePlayerView or similar components:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // If you are using SimplePlayerView, StyledPlayerView, etc
    playerView = findViewById(R.id.my_player_view)

    playerView.setFullscreenButtonClickListener { isFullScreen ->
      // Set presentation based on which mode is requested
      if(isFullScreen) {
        muxStats.presentationChange(MuxSDKViewPresentation.FULLSCREEN)
      } else {
        muxStats.presentationChange(MuxSDKViewPresentation.NORMAL)
      }
      // Handle moving to fullscreen playback with your code
    }
}
```

### Error Tracking

The SDK automatically tracks fatal errors from ExoPlayer. For manual error tracking:

```kotlin
// Error code: integer value for the generic type of error that
// occurred.
// Error message: String providing more information on the error
// that occurred.
val errorCode = 1
val errorMessage = "A fatal error was encountered during playback"
val errorContext = "Additional information about the error such as a stack trace"
val error = MuxErrorException(errorCode, errorMessage, errorContext)
muxStatsExoPlayer.error(error)
```

Disable automatic error tracking if you have retry logic:

```kotlin
muxStatsExoPlayer.setAutomaticErrorTracking(false)
```

### Google IMA Ads Integration (Android)

#### ExoPlayer r2.12.x and Up

```kotlin
// For example, within the r2.12.x demo application
// PlayerActivity.getAdsLoader
adsLoader = ImaAdsLoader.Builder(context = this)
    /*
     * This replaces `monitorImaAdsLoader` method because in r2.12.x ImaAdsLoader
     * will create google.v3.AdsLoader on adRequest, which means that monitorImaAdsLoader
     * Will always receive null pointer and will be unable to recieve add events.
     */
    .setAdErrorListener(muxStats.getAdErrorEventListener())
    .setAdEventListener(muxStats.getAdEventListener())
    .build()
```

#### ExoPlayer pre-r2.12.x

```kotlin
// Within setting up the AdsMediaSource
sdkFactory = ImaSdkFactory.getInstance()
adsLoader = sdkFactory.createAdsLoader(this)
muxStatsExoPlayer.monitorImaAdsLoader(adsLoader)
```

### Orientation Change Tracking

```kotlin
muxStatsExoPlayer.orientationChange(MuxSDKViewOrientation orientation)
```

Pass either `MuxSDKViewOrientation.LANDSCAPE` or `MuxSDKViewOrientation.PORTRAIT`.

---

## AVPlayer (iOS/tvOS)

Mux Data integration for AVPlayer supports iOS 12.0+, tvOS 12.0+, Mac Catalyst, and visionOS 1.0+.

### Installation

#### Swift Package Manager (Xcode)

1. In Xcode click "File" > "Swift Packages" > "Add Package Dependency..."
2. Enter the repository URL:

```
https://github.com/muxinc/mux-stats-sdk-avplayer.git
```

#### Swift Package Manager (Package.swift)

```swift
.package(
  url: "https://github.com/muxinc/mux-stats-sdk-avplayer",
  .upToNextMajor(from: "4.0.0")
),
```

#### CocoaPods

```ruby
pod 'Mux-Stats-AVPlayer', '~>4.0'
```

### Import Statements

**Swift:**
```swift
import MUXSDKStats
```

**Objective-C:**
```objc
@import MUXSDKStats;
```

### Initialize the Monitor

**Swift:**
```swift
let playerData = MUXSDKCustomerPlayerData(environmentKey: "ENV_KEY");
// insert player metadata
playerData?.playerName = "AVPlayer"

let videoData = MUXSDKCustomerVideoData()
// insert videoData metadata
videoData.videoTitle = "Title1"
videoData.videoSeries = "animation"

guard let customerData = MUXSDKCustomerData(customerPlayerData: playerData, videoData: videoData, viewData: nil, customData: nil, viewerData: nil) else {
    return
}

let playerBinding = MUXSDKStats.monitorAVPlayerViewController(self, withPlayerName: "mainPlayer", customerData: customerData)
// if you're using AVPlayerLayer instead of AVPlayerViewController use this instead:
// MUXSDKStats.monitorAVPlayerLayer(self, withPlayerName: "mainPlayer", customerData:customerData)
```

**Objective-C:**
```objc
MUXSDKCustomerPlayerData *playerData = [[MUXSDKCustomerPlayerData alloc] initWithPropertyKey:@"ENV_KEY"];

MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
// insert videoData metadata
videoData.videoTitle = @"Title1";
videoData.videoSeries = @"animation";

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] initWithCustomerPlayerData:playerData
                                                                                videoData:videoData
                                                                                 viewData:nil
                                                                               customData:nil
                                                                               viewerData:nil];

_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
                                             withPlayerName:@"mainPlayer"
                                               customerData:customerData];
```

### Add Metadata

**Swift:**
```swift
let playerData = MUXSDKCustomerPlayerData(environmentKey: "ENV_KEY")
playerData.playerName = "AVPlayer"
playerData.viewerUserId = "1234"
playerData.experimentName = "player_test_A"
playerData.playerVersion = "1.0.0"

let videoData = MUXSDKCustomerVideoData()
videoData.videoId = "abcd123"
videoData.videoTitle = "My Great Video"
videoData.videoSeries = "Weekly Great Videos"
videoData.videoDuration = 120000 // in milliseconds
videoData.videoIsLive = false
videoData.videoCdn = "cdn"

let viewerData = MUXSDKCustomerViewerData()
viewerData.viewerApplicationName = "MUX video-demo"

guard let customerData = MUXSDKCustomerData(customerPlayerData: playerData, videoData: videoData, viewData: nil, customData: nil, viewerData: viewerData) else {
    return
}
let playerBinding = MUXSDKStats.monitorAVPlayerViewController(self, withPlayerName: "mainPlayer", customerData: customerData)
```

**Objective-C:**
```objc
MUXSDKCustomerPlayerData *playerData = [[MUXSDKCustomerPlayerData alloc] initWithPropertyKey:@"ENV_KEY"];
playerData.viewerUserId = @"1234";
playerData.experimentName = @"player_test_A";
playerData.playerName = @"iOS AVPlayer";
playerData.playerVersion = @"1.0.0";

MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
videoData.videoTitle = @"Big Buck Bunny";
videoData.videoId = @"bigbuckbunny";
videoData.videoSeries = @"animation";
videoData.videoDuration = @(120000); // in milliseconds
videoData.videoIsLive = @NO;
videoData.videoCdn = @"cdn";

MUXSDKCustomerViewData *viewData= [[MUXSDKCustomerViewData alloc] init];
viewData.viewSessionId = @"some session id";

MUXSDKCustomData *customData = [[MUXSDKCustomData alloc] init];
[customData setCustomData1:@"my-data-string"];
[customData setCustomData2:@"my-custom-dimension-2"];

MUXSDKCustomerViewerData *viewerData = [[MUXSDKCustomerViewerData alloc] init];
viewerData.viewerApplicationName = @"MUX DemoApp";

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] initWithCustomerPlayerData:playerData
                                                                                videoData:videoData
                                                                                 viewData:viewData
                                                                               customData:customData
                                                                               viewerData:viewerData];

_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
                                             withPlayerName:@"mainPlayer"
                                               customerData:customerData];
```

### Update Metadata After Monitor Initialization

**Swift:**
```swift
// Example: after monitoring, you need to update `customerData` with new metadata.
// All values in customerData passed as nil will keep previously set data.
// Note: `viewerData` object cannot be updated.

let videoData = MUXSDKCustomerVideoData()
videoData.videoTitle = "Big Buck Bunny"
videoData.videoId = "bigbuckbunny"

guard let customerData = MUXSDKCustomerData(
    customerPlayerData: nil,
    videoData: videoData,
    viewData: nil,
    customData: nil,
    viewerData: nil
) else {
    return
}

MUXSDKStats.setCustomerData(customerData, forPlayer: "mainPlayer")
```

**Objective-C:**
```objc
// The player name ("mainPlayer" in this example) should be a player that
// you have already called one of the `monitorAVPlayer` methods with
// Note that the values in customerData passed as nil will keep previously set data
// Note that viewerData can't be updated

MUXSDKCustomerVideoData *videoData = [MUXSDKCustomerVideoData new];
videoData.videoTitle = @"Big Buck Bunny";
videoData.videoId = @"bigbuckbunny";

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] init];
customerData.customerVideoData = videoData;

[MUXSDKStats setCustomerData:customerData
                   forPlayer:@"mainPlayer"];
```

### Changing the Video

#### New Source

Call `videoChangeForPlayer:` immediately before telling the player which new source to play:

```swift
// Example of changing the AVPlayerItem
let videoData = MUXSDKCustomerVideoData()
videoData.videoId = "abcd123"
videoData.videoTitle = "My Great Video"
videoData.videoSeries = "Weekly Great Videos"
videoData.videoDuration = 120000 // in milliseconds
videoData.videoIsLive = false
videoData.videoCdn = "cdn"
MUXSDKStats.videoChange(forPlayer: "AVPlayer", with: videoData)

player.replaceCurrentItem(with: AVPlayerItem(url: url!))
// calling `play()` here is necessary
player.play()
```

#### New Program (Single Stream)

For live streams with program changes:

```swift
MUXSDKStats.programChange(forPlayer: "playerName", withCustomerData: customerData)
```

### AVQueuePlayer Usage

```swift
let playName = "iOS AVPlayer"

override func viewDidLoad() {
    super.viewDidLoad()

    let item1 = AVPlayerItem(url: URL(string: "https://stream.mux.com/jY02nK1sxQKmJiQ7ltXY01w9LZQWdtNetE.m3u8")!)
    let item2 = AVPlayerItem(url: URL(string: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8")!)
    NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.playerItemDidReachEnd),
        name: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
        object: item1
    )
    player = AVQueuePlayer(items: [item1, item2])

    let playerData = MUXSDKCustomerPlayerData(environmentKey: "ENV_KEY");
    playerData?.playerName = "AVPlayer"
    let videoData = MUXSDKCustomerVideoData();
    videoData.videoIsLive = false;
    videoData.videoTitle = "Title1"
    MUXSDKStats.monitorAVPlayerViewController(self, withPlayerName: playName, playerData: playerData!, videoData: videoData);
    player!.play()
}

@objc func playerItemDidReachEnd (notification: NSNotification) {
    let videoData = MUXSDKCustomerVideoData();
    videoData.videoTitle = "Title2"
    videoData.videoId = "applekeynote2010-2"
    MUXSDKStats.videoChange(forPlayer: playName, with: videoData)
}
```

### Overriding Device Metadata

**Swift:**
```swift
// ... set up videoData, playerData, etc

let viewerData = MUXSDKCustomerViewerData()
viewerData.viewerDeviceCategory = "kiosk"
viewerData.viewerDeviceModel = "ABC-12345"
viewerData.viewerDeviceManufacturer = "Example Display Systems, Inc"

return MUXSDKCustomerData(customerPlayerData: playerData, videoData: videoData, viewData: viewData, customData: MUXSDKCustomData(), viewerData: viewerData)!
```

**Objective-C:**
```objc
// ... set up videoData, playerData, etc

MUXSDKCustomerViewerData *viewerData = [[MUXSDKCustomerViewerData alloc] init];
viewerData.viewerApplicationName = @"MUX DemoApp";
viewerData.viewerDeviceCategory = "kiosk";
viewerData.viewerDeviceModel = "ABC-12345";
viewerData.viewerDeviceManufacturer = "Example Display Systems, Inc";
MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] initWithCustomerPlayerData:playerData
                                                                                videoData:videoData
                                                                                  viewData:viewData
                                                                                customData:customData
                                                                                viewerData:viewerData];
_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController withPlayerName:DEMO_PLAYER_NAME customerData:customerData];
```

### Error Handling

#### Manual Error Dispatch (with automatic error tracking disabled)

**Swift:**
```swift
let playName = "iOS AVPlayer"
let environmentKey = "yourEnvironmentKey"
let playerData = MUXSDKCustomerPlayerData(environmentKey: environmentKey);
let videoData = MUXSDKCustomerVideoData();
videoData.videoTitle = "Your Video Title";

let viewerData = MUXSDKCustomerViewerData();

guard let customerData = MUXSDKCustomerData(playerData, videoData: videoData, viewData: nil, customData: nil, viewerData: viewerData) else {
  return
}

// insert video metadata
let playerBinding = MUXSDKStats.monitorAVPlayerViewController(
              self,
              withPlayerName: playName,
              customerData: customerData
              automaticErrorTracking: false)

// Later, you can dispatch an error yourself
MUXSDKStats.dispatchError("1234",
                          withMessage: "Something is not right",
                          forPlayer: playName)
```

**Objective-C:**
```objc
NSString *playerName = @"iOS AVPlayer"
NSString *environmentKey = @"yourEnvironmentKey";

MUXSDKCustomerPlayerData *playerData = [[MUXSDKCustomerPlayerData alloc] initWithEnvironmentKey:environmentKey];

MUXSDKCustomerVideoData *videoData = [[MUXSDKCustomerVideoData alloc] init];
videoData.videoTitle = @"Your Video Title";

MUXSDKCustomerData *customerData = [[MUXSDKCustomerData alloc] initWithCustomerPlayerData:playerData
                                                                                videoData:videoData
                                                                                 viewData:viewData
                                                                               customData:customData
                                                                               viewerData:viewerData];

_playerBinding = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
                                             withPlayerName:playerName
                                               customerData:customerData
                                               automaticErrorTracking: NO];

// later you can dispatch an error yourself
[MUXSDKStats dispatchError: @"1234"
               withMessage: @"Something is not right"
                 forPlayer: playerName];
```

#### Categorized Error Dispatch (Warning)

**Swift:**
```swift
// Later, you can dispatch an error yourself
MUXSDKStats.dispatchError(
  "1234",
  withMessage: "Something is not right",
  severity: MUXSDKErrorSeverity.warning,
  errorContext: "Error Context",
  forPlayer: playName
)
```

**Objective-C:**
```objc
[MUXSDKStats dispatchError: @"1234"
               withMessage: @"Something is not right"
                  severity: MUXSDKErrorSeverityWarning
              errorContext: @"Error context"
                 forPlayer: playerName];
```

#### Business Exception Error

```objc
// Call this method from the source of the business exception with parameters appropriate to your integration.
- (void)dispatchBusinessExceptionWithPlayerName:(NSString *)playerName
                                  playerErrorSeverity:(MUXSDKErrorSeverity)errorSeverity
                                  playerErrorCode:(NSString *)playerErrorCode
                                  playerErrorMessage:(NSString *)playerErrorMessage
                                  playerErrorContext:(NSString *)playerErrorContext {
  [MUXSDKStats dispatchError: playerErrorCode,
                 withMessage: playerErrorMessage,
                    severity: MUXSDKErrorSeverityWarning,
         isBusinessException: YES,
                errorContext: playerErrorContext,
                   forPlayer: playerName];
}
```

### Orientation Change Tracking

**Swift:**
```swift
class VideoPlayerController: AVPlayerViewController {
    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        MUXSDKStats.orientationChange(forPlayer: playName, with: self.viewOrientationForSize(size: size))
    }

    func viewOrientationForSize(size: CGSize) -> MUXSDKViewOrientation {
        return (size.width > size.height) ? MUXSDKViewOrientation.landscape : MUXSDKViewOrientation.portrait
    }
}
```

**Objective-C:**
```objc
@implementation ViewController

  - (void)viewWillTransitionToSize:(CGSize)size
       withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
    [coordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> context) {} completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
        [MUXSDKStats orientationChangeForPlayer:DEMO_PLAYER_NAME withOrientation:[self viewOrientationForSize:size]];

    }];
    }

  - (MUXSDKViewOrientation) viewOrientationForSize:(CGSize)size {
      return (size.width > size.height) ? MUXSDKViewOrientationLandscape : MUXSDKViewOrientationPortrait;
  }

@end
```

### Google IMA Ads Integration (iOS/tvOS)

#### Installation

**Swift Package Manager:**

```swift
.package(
  url: "https://github.com/muxinc/mux-stats-google-ima",
  .upToNextMajor(from: "0.14.0")
)
```

**CocoaPods:**

```ruby
pod 'Mux-Stats-Google-IMA'
```

#### Integration Steps

**Swift:**
```swift
import MuxCore
import MUXSDKStats
import GoogleInteractiveMediaAds
import MuxStatsGoogleIMAPlugin

var adsListener: MUXSDKIMAAdListener?

override func viewDidLoad() {
  super.viewDidLoad()
  // Follow the instructions from pod 'GoogleAds-IMA-iOS-SDK' to set up
  // your adsLoader and set your ViewController as the delegate
  //
  // From your ViewController, when you call either
  //    monitorAVPlayerViewController
  //    monitorAVPlayerLayer
  //
  // You will get back a MUXSDKPlayerBinding object

  // Configure your ads loader delegate before initializing MUXSDKIMAAdListener
  adsLoader.delegate = self

  // Setup your content players AVPlayerViewController or AVPlayerLayer
  let playerViewController = AVPlayerViewController()

  let playerBinding = MUXSDKStats.monitorAVPlayerViewController(
    self,
    withPlayerName: playName,
    customerData: customerData
  )

  // Use the MUXSDKPlayerBinding object to initialize the MuxImaListener class
  // Save a reference to adsListener, we'll use a property
  let adsListener = MUXSDKIMAAdListener(
    playerBinding: playerBinding!,
    monitorAdsLoader: adsLoader
  )
  self.adsListener = adsListener
  // ...

  // When you send your ad request, you must report it to the IMA listener so it can properly track state
  adsListener.clientAdRequest(request) // for Client-Side Ads (the usual case)
  // OR
  adsListener.daiAdRequest(daiAdRequest) // for Dynamic Server-Side Ads (SSAI)
}

// the adsLoader delegate will fire this and give access to the adsManager
// the application needs to register as a delegate for the adsManager too
func adsLoader(_ loader: IMAAdsLoader!, adsLoadedWith adsLoadedData: IMAAdsLoadedData!) {
    adsManager = adsLoadedData.adsManager;
    adsManager.delegate = self;
    adsListener?.monitorAdsManager(adsManager)
}

// all of these events get fired by the adsManager delegate
func adsManager(_ adsManager: IMAAdsManager!, didReceive event: IMAAdEvent!) {
    if (event.type == kIMAAdEvent_LOADED) {
      adsManager.start()
    }
}

func adsManager(_ adsManager: IMAAdsManager!, didReceive error: IMAAdError!)
    avPlayer.play()
}

func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager!) {
    avPlayer.pause()
}

func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager!) {
    avPlayer.play()
}
```

**Objective-C:**
```objc
#import<MuxStatsGoogleIMAPlugin/MuxStatsGoogleIMAPlugin.h>

- (void)viewDidLoad {
  // Follow the instructions from pod 'GoogleAds-IMA-iOS-SDK' to set up
  // your adsLoader and set your ViewController as the delegate
  //
  // From your ViewController, when you call either
  //    monitorAVPlayerViewController:withPlayerName:playerData:videoData:
  //    monitorAVPlayerLayer:withPlayerName:playerData:videoData:
  //
  // You will get back a MUXSDKPlayerBinding object
  [MUXSDKPlayerBinding *playerBinding] = [MUXSDKStats monitorAVPlayerViewController:_avplayerController
                                                                     withPlayerName:DEMO_PLAYER_NAME
                                                                       customerData:customerData];
  //
  // Use the MUXSDKPlayerBinding object to initialize the MuxImaListener class
  //
  _adsListener = [[MUXSDKIMAAdListener alloc] initWithPlayerBinding:playerBinding
                                                   monitorAdsLoader:adsLoader];

  //...

  // When you send your ad request, you must report it to the IMA listener so it can properly track state
  [_adsListener clientAdRequest:request]; // for Client-Side Ads (the usual case)
  // OR
  [_adsListener daiAdRequest:daiRequest]; // for Dynamic Server-Side Ads (DAI/SSAI)
}
// when the adsLoader fires adsLoadedWithData you get a
// reference to the adsManager. Set your ViewController as the delegate
// for the adsManager
- (void)adsLoader:(IMAAdsLoader *)loader adsLoadedWithData:(IMAAdsLoadedData *)adsLoadedData {
    _adsManager = adsLoadedData.adsManager;
    // Set your adsManager delegate before passing it to adsListener for monitoring
    _adsManager.delegate = self;
    IMAAdsRenderingSettings *adsRenderingSettings = [[IMAAdsRenderingSettings alloc] init];
    adsRenderingSettings.webOpenerPresentingController = self;
    [_adsManager initializeWithAdsRenderingSettings:adsRenderingSettings];
    [_adsListener monitorAdsManager: _adsManager];
}

- (void)adsManager:(IMAAdsManager *)adsManager didReceiveAdEvent:(IMAAdEvent *)event {
    // When the SDK notified us that ads have been loaded, play them.
    if (event.type == kIMAAdEvent_LOADED) {
        [_adsManager start];
    }
}

- (void)adsManager:(IMAAdsManager *)adsManager didReceiveAdError:(IMAAdError *)error {
    [_avplayer play];
}

- (void)adsManagerDidRequestContentPause:(IMAAdsManager *)adsManager {
    [_avplayer pause];
}

- (void)adsManagerDidRequestContentResume:(IMAAdsManager *)adsManager {
    [_avplayer play];
}
```

#### Picture in Picture Support

If using `IMAPictureInPictureProxy`, add an additional step:

**Swift:**
```swift
let adsListener = MUXSDKIMAAdListener(
    playerBinding: playerBinding!,
    monitorAdsLoader: adsLoader
)
adsListener.setPictureInPicture(true)
self.adsListener = adsListener
```

**Objective-C:**
```objc
_adsListener = [[MUXSDKIMAAdListener alloc] initWithPlayerBinding:playerBinding
                                                 monitorAdsLoader:adsLoader];
[_adsListener setPictureInPicture:YES];
```

---

## Key Differences Between Platforms

| Feature | ExoPlayer (Android) | AVPlayer (iOS/tvOS) |
|---------|---------------------|---------------------|
| SDK Import | Gradle dependency | Swift PM / CocoaPods |
| Monitor Init | `monitorWithMuxData()` extension | `MUXSDKStats.monitorAVPlayerViewController()` |
| Video Change | `muxStatsExoPlayer.videoChange()` | `MUXSDKStats.videoChange(forPlayer:)` |
| Program Change | `muxStatsExoPlayer.programChange()` | `MUXSDKStats.programChange(forPlayer:)` |
| Release | `muxStatsExoPlayer.release()` | `MUXSDKStats.destroyPlayer()` |
| IMA Integration | `monitorImaAdsLoader()` or event listeners | `MUXSDKIMAAdListener` class |
| Source URL | Must be set manually via `CustomerVideoData` | Automatically detected |
