# Player Advanced Features

Advanced Mux Player features including event handling, preloading, custom domains, chapters and cue points, playback synchronization, quality selection, and debugging options.

## Event Handling

Mux Player emits all events available on the HTML5 video element. Events are unavailable when using the Mux Player HTML embed through player.mux.com.

### HTML Web Component

```javascript
const muxPlayer = document.querySelector('mux-player');

muxPlayer.addEventListener('timeupdate', (event) => {
  // Track watch progress
  console.log('Current time:', muxPlayer.currentTime);
});
```

### React Component

In React, events are camel-cased and prefixed with `on*`. For example `timeupdate` becomes `onTimeUpdate`:

```jsx
function saveWatchProgress(event) {
  /* event */
}

<MuxPlayer onTimeUpdate={saveWatchProgress} />;
```

### Common Events

| Event | Description |
|-------|-------------|
| `play` | Fired when playback starts |
| `pause` | Fired when playback is paused |
| `timeupdate` | Fired periodically as currentTime updates |
| `ended` | Fired when playback completes |
| `loadedmetadata` | Fired when metadata has loaded |
| `durationchange` | Fired when the duration changes |
| `chapterchange` | Fired when the active chapter changes |
| `cuepointchange` | Fired when the active cue point changes |

## Preloading Assets

By default, `preload` behaves similar to the HTML5 `<video>` element. Use the `preload` attribute with values:

| Value | Behavior |
|-------|----------|
| `none` | Load nothing until the user tries to play |
| `metadata` | Load minimum data for basic info like duration |
| `auto` | Start loading the video as soon as possible |

Most browsers default to `auto`, but Chrome uses `metadata`. On mobile devices, `preload` is always `none`.

### Preload Recommendations

- **Best startup time**: Use `preload="auto"` for shortest video startup time
- **Preserve bandwidth**: Use `preload="none"` or `preload="metadata"` to reduce delivery costs
- **Consistent experience**: Always provide the `preload` attribute explicitly

The tradeoff with `preload="metadata"` or `preload="none"` is slower startup time when the user plays the video. This will be reflected in your Mux Data dashboard and may negatively impact the Overall Viewer Experience metric.

## Custom Video Domains

By default, all Mux Video assets are hosted on mux.com. Custom Domains allow you to stream assets from your own domain.

### Configuration

```html
<!-- HTML -->
<mux-player
  playback-id="your-playback-id"
  custom-domain="media.example.com"
></mux-player>
```

```jsx
// React
<MuxPlayer
  playbackId="your-playback-id"
  customDomain="media.example.com"
/>
```

```javascript
// JavaScript
const muxPlayer = document.querySelector('mux-player');
muxPlayer.customDomain = 'media.example.com';
```

Mux Player automatically expands the custom domain to:
- `image.media.example.com` for images (posters, storyboards)
- `stream.media.example.com` for video

## Chapters and Time-Based Metadata

Mux Player supports both chapters and time-based metadata (cue points). Chapters visually split the timeline into sections with titles. Cue points associate custom metadata with time ranges.

Both chapters and cue points are removed when you unload media or change the playback ID.

### Chapters

A chapter is defined as: `{startTime: number; endTime?: number; value: string}`

- `startTime` and `endTime` are in seconds
- `endTime` is optional; if omitted, the chapter ends when the next one begins
- `value` contains the chapter title

```javascript
const muxPlayerEl = document.querySelector('mux-player');

function addChaptersToPlayer() {
  muxPlayerEl.addChapters([
    { startTime: 1, value: 'Chapter 1' },
    { startTime: 3, value: 'Chapter 2' },
    { startTime: 10, value: 'Chapter 3 - will span to the end' },
  ]);
}

// Wait until the player has loaded data
if (muxPlayerEl.readyState >= 1) {
  addChaptersToPlayer();
} else {
  muxPlayerEl.addEventListener('loadedmetadata', addChaptersToPlayer, { once: true });
}

// Listen for chapter changes
muxPlayerEl.addEventListener('chapterchange', () => {
  console.log(muxPlayerEl.activeChapter);
  console.log(muxPlayerEl.chapters);
});
```

Chapters work with streaming assets (video on demand) and audio, but not live content.

### Cue Points (Time-Based Metadata)

A cue point is defined as: `{startTime: number; endTime?: number; value: any}`

- `value` can be any JSON-serializable value
- Start and end times are in seconds
- `endTime` is optional

```javascript
const muxPlayerEl = document.querySelector('mux-player');

function addCuePointsToPlayer() {
  const cuePoints = [
    { startTime: 1, value: 'Simple Value' },
    { startTime: 3, value: { complex: 'Complex Object', duration: 2 } },
    { startTime: 10, value: true },
    { startTime: 15, value: { anything: 'That can be serialized to JSON' } }
  ];

  muxPlayerEl.addCuePoints(cuePoints);
}

// Wait for media to load
if (muxPlayerEl.duration) {
  addCuePointsToPlayer();
} else {
  muxPlayerEl.addEventListener('durationchange', addCuePointsToPlayer, { once: true });
}

// Listen for cue point changes
muxPlayerEl.addEventListener('cuepointchange', () => {
  console.log(muxPlayerEl.activeCuePoint);
  console.log(muxPlayerEl.cuepoints);
});
```

### Cue Point Proximity Detection

If you only want to act on cue points when playback is near the start time:

```javascript
function cuePointChangeListener() {
  const cuePointBuffer = 1; // seconds
  if (Math.abs(muxPlayerEl.currentTime - muxPlayerEl.activeCuePoint.startTime) <= cuePointBuffer) {
    console.log('Active CuePoint playing near its time!', muxPlayerEl.activeCuePoint);
  }
}
```

## Playback Synchronization

For synchronizing video playback across players, Mux Player exposes `currentPdt` and `getStartDate()` based on Program Date Time (PDT) tags in the stream.

**Note**: These features require that Slates are enabled on your stream for accurate times.

### currentPdt

Returns a JavaScript Date object based on the current playback time:

```javascript
const player = document.querySelector('mux-player');

// Initial currentPdt
player.currentPdt;
// Mon Jun 28 2021 13:53:25 GMT-0400

player.currentPdt.getTime();
// 1624902805533

// After seeking forward 10 seconds
player.currentTime = 10;

player.currentPdt;
// Mon Jun 28 2021 13:53:35 GMT-0400

player.currentPdt.getTime();
// 1624902815533
```

### getStartDate()

Returns a JavaScript Date object based on the beginning of the stream:

```javascript
const player = document.querySelector('mux-player');

// Returns the start date (same as currentPdt when currentTime is 0)
player.getStartDate();
// Mon Jun 28 2021 13:53:25 GMT-0400

player.getStartDate().getTime();
// 1624902805533

// Value remains constant regardless of seeking
player.currentTime = 10;
player.getStartDate().getTime();
// 1624902805533 (unchanged)
```

If there is no PDT in the stream, or if video has not loaded, both methods return an Invalid Date object.

## Playback Engine Selection

Mux Player automatically handles Adaptive Bitrate Streaming using HLS.js on most platforms. On iOS, iPadOS, and macOS, the native HLS streaming engine is used. On Android, HLS.js is used.

### Overriding Playback Engine

Use `prefer-playback` to control the playback strategy (not recommended unless necessary):

```html
<!-- HTML -->
<mux-player prefer-playback="mse"></mux-player>
<mux-player prefer-playback="native"></mux-player>
```

```jsx
// React
<MuxPlayer preferPlayback="mse" />
<MuxPlayer preferPlayback="native" />
```

| Value | Description |
|-------|-------------|
| `mse` | Use Media Source Extensions (HLS.js) |
| `native` | Use native HLS playback |

**Warning**: Test thoroughly across operating systems and browsers when overriding this setting. Monitor Mux Data to verify playback metrics.

## Re-using Player Instances

Player instances can be reused by changing the playback ID:

### React

```jsx
// Change the playbackId prop
<MuxPlayer playbackId={currentPlaybackId} />
```

### Web Component

```javascript
const muxPlayer = document.querySelector('mux-player');

// Using setAttribute
muxPlayer.setAttribute('playback-id', 'new-playback-id-xxx');

// Using the playbackId property
muxPlayer.playbackId = 'new-playback-id-xxx';
```

## Accessing the Underlying Video Element

Access the native video element through `media.nativeEl`:

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

## Custom Storyboards

By default, Mux Player uses the storyboard WebVTT track corresponding to your playback ID:

```
https://image.mux.com/{PLAYBACK_ID}/storyboard.vtt?format=webp
```

Override with a custom source:

```html
<!-- HTML -->
<mux-player storyboard-src="https://example.com/custom-storyboard.vtt"></mux-player>
```

```jsx
// React
<MuxPlayer storyboardSrc="https://example.com/custom-storyboard.vtt" />
```

The custom WebVTT file must conform to Mux storyboard expectations.

## Debugging

Enable verbose logging with the `debug` attribute:

```html
<!-- HTML -->
<mux-player debug></mux-player>
```

```jsx
// React
<MuxPlayer debug />
```

Debug logging includes:
- Mux Player logs (prefixed with `[mux-player]`)
- HLS.js logs
- Mux Data logs

**Note**: Set the debug attribute before setting a playback ID for full logging.

## Disabling Cookies

Disable Mux Data cookies when needed (cookies do not contain PII):

```html
<!-- HTML -->
<mux-player disable-cookies></mux-player>
```

```jsx
// React
<MuxPlayer disableCookies />
```

**Note**: Set this attribute before setting a playback ID.

## Autoplay Best Practices

Browser vendors frequently change autoplay policies. Your application should be prepared for autoplay to fail.

### Conditions That Increase Autoplay Success

- Video is muted with the `muted` attribute
- User has interacted with the page (click or tap)
- Chrome desktop: User's Media Engagement Index threshold crossed
- Chrome mobile: User has added site to home screen
- Safari: Device is not in power-saving mode

### Avoid the autoplay Attribute

Using `<video autoplay>` provides no way to know if autoplay was blocked. Use `video.play()` instead:

```javascript
const video = document.querySelector('#my-video');

video.play().then(function () {
  // autoplay was successful!
}).catch(function (error) {
  // handle or track the autoplay failure
  // Note: don't report to Mux custom error tracking
  // as it's for fatal errors only
});
```

**Important**: Autoplay will never work 100% of the time. Always prepare for autoplay to fail.

## Client-Side Ad Insertion with Google IMA SDK

Mux Player does not have built-in ad integration but supports client-side ad insertion with the Google IMA SDK for preroll, midroll, and postroll ads.

### Setup Overview

1. Set up Mux Player within a container div
2. Include the Google IMA SDK
3. Create an ad container overlay
4. Initialize the IMA SDK
5. Link player events with IMA SDK

### HTML Structure

```html
<div id="mainContainer">
  <mux-player
    playback-id="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
    metadata-video-title="Test VOD"
    metadata-viewer-user-id="user-id-007"
  ></mux-player>
  <div id="ad-container"></div>
</div>
```

### CSS Styling

```css
mux-player {
  width: 640px;
  height: 360px;
}

#mainContainer {
  position: relative;
  width: 640px;
  height: 360px;
}

#ad-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}
```

### IMA SDK Initialization

```javascript
let muxPlayer = document.querySelector('mux-player');

const adDisplayContainer = new google.ima.AdDisplayContainer(
  document.getElementById('ad-container')
);
const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
let adsManager;

adsLoader.addEventListener(
  google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
  onAdsManagerLoaded,
  false
);
adsLoader.addEventListener(
  google.ima.AdErrorEvent.Type.AD_ERROR,
  onAdError,
  false
);

let adsRequest = new google.ima.AdsRequest();
adsRequest.adTagUrl = 'YOUR_AD_TAG_URL';
adsRequest.linearAdSlotWidth = 640;
adsRequest.linearAdSlotHeight = 360;
adsRequest.nonLinearAdSlotWidth = 640;
adsRequest.nonLinearAdSlotHeight = 150;

adsLoader.requestAds(adsRequest);
```

### Event Handlers

```javascript
function onAdsManagerLoaded(adsManagerLoadedEvent) {
  let adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsManager = adsManagerLoadedEvent.getAdsManager(muxPlayer, adsRenderingSettings);

  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
    onContentPauseRequested
  );
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested
  );

  try {
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    adsManager.start();
  } catch (adError) {
    muxPlayer.play(); // If ad fails, continue with content
  }
}

function onAdError(adErrorEvent) {
  console.log(adErrorEvent.getError());
  if (adsManager) {
    adsManager.destroy();
  }
  muxPlayer.play(); // Continue with content
}

function onContentPauseRequested() {
  muxPlayer.pause();
}

function onContentResumeRequested() {
  muxPlayer.play();
}
```

### Link Player Events

```javascript
muxPlayer.addEventListener('play', function () {
  adDisplayContainer.initialize();
});

muxPlayer.addEventListener('pause', function () {
  if (adsManager) {
    adsManager.pause();
  }
});

muxPlayer.addEventListener('playing', function () {
  if (adsManager) {
    adsManager.resume();
  }
});
```

**Note**: When developing locally, newer Chrome versions may block the IMA SDK script due to lack of HTTPS support. Disable ad blockers when testing.

## Iframe Embed Control with Player.js

Mux Player embedded via iframe (player.mux.com) supports the Player.js specification for cross-window control. See the Player.js documentation for implementation details.

## Secure Playback with Signed URLs

For signed URL playback, generate JWT tokens for each resource:

| Token Type | Purpose |
|------------|---------|
| `playback` | Access the video content |
| `thumbnail` | Access poster images |
| `storyboard` | Access timeline hover previews (VOD only) |
| `drm` | Access DRM-protected content |

### Passing Tokens

```javascript
const muxPlayer = document.querySelector('mux-player');
muxPlayer.tokens = {
  playback: 'eyJhbGciOiJSUzI1NiI...',
  thumbnail: 'eyJhbGciOiJSUzI1N...',
  storyboard: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsI...',
};
```

For DRM-protected content, include the drm token:

```javascript
muxPlayer.tokens = {
  playback: 'eyJhbGciOiJSUzI1NiI...',
  drm: 'eyJhbGciOiJSUzI1NiIs...',
  thumbnail: 'eyJhbGciOiJSUzI1N...',
  storyboard: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsI...',
};
```

### Common Token Errors

Mux Player detects and reports these errors to Mux Data:
- Playback ID mismatch
- Expired token
- Malformatted token

**DRM Note**: For DRM-protected content on iOS/iPadOS, devices should run the current minor and patch version. iOS/iPadOS 17 or 18 (latest version) is strongly recommended.
