# Social Media Sharing and Special Features

This guide covers embedding videos for social media platforms using Open Graph and Twitter cards, plus special features like Google Cast with DRM-protected content.

## Embedding Videos for Social Media

### Introduction to Open Graph

The Open Graph protocol uses HTML meta tags in the `<head>` section of a webpage to define objects from your page as thumbnails. These appear in social media posts and search results. Open Graph also helps search engines discover videos that might otherwise be hidden due to JavaScript.

### Open Graph Properties for Video

| Property | Description |
|:---------|:------------|
| `og:type` | The object's type (e.g., video, audio) |
| `og:url` | The URL of the webpage |
| `og:title` | Title of the video |
| `og:description` | Description of the video |
| `og:image` | Thumbnail of the video |
| `og:video` | The URL of the video |
| `og:video:width` | Width of the video in pixels |
| `og:video:height` | Height of the video in pixels |
| `og:site_name` | The website name that contains the video |

### Object Types

You can use sub-types for more specific content classification:

```html
<meta property="og:type" content="video.episode">
<meta property="og:type" content="video.movie">
<meta property="og:type" content="video.tv_show">
```

### Optional Video Meta Tags

These additional properties provide extended metadata about video content:

| Property | Description |
|:---------|:------------|
| `video:actor` | Profile array - Actors in the movie |
| `video:actor:role` | String - The role they played |
| `video:director` | Profile array - Directors of the movie |
| `video:writer` | Profile array - Writers of the movie |
| `video:duration` | Integer >= 1 - The movie's length in seconds |
| `video:release_date` | Datetime - The date the movie was released |
| `video:tag` | String array - Tag words associated with this movie |

### Complete Open Graph Implementation Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta property="og:title" content="Mux Video" />
    <meta property="og:type" content="video.episode" />
    <meta property="og:description" content="MP4 video asset for Open Graph Cards" />
    <meta property="og:image" content="https://image.mux.com/aYKMM7VxaD2InrbhrKlhi00V6R9EpRmQNmBJ10200AK02bE/thumbnail.png" />
    <meta property="og:video" content="https://stream.mux.com/F9cP5Xgdcp7028hN4gQrOmlF62ZDHNloCTQQao8Pk00kk/medium.mp4" />
    <meta property="og:video:width" content="350">
    <meta property="og:video:height" content="200">
    <meta property="og:video:duration" content="300">
    <meta property="og:url" content="http://mux.com">
  </head>
  <body>
    <video
      id="my-player"
      controls
      style="width: 100%; max-width: 500px;"
    />
  </body>
</html>
```

## Twitter/X Cards

Twitter cards use meta tags with different property names than Open Graph. There are four card types defined in the `twitter:card` meta tag:

- **photo card** - For image content
- **player card** - For external media playback inside Twitter
- **summary card** - For article/content summaries
- **app card** - For app promotion

The player card provides functionality to play external media files directly within Twitter.

### Twitter/X Meta Tags

| Property | Description |
|:---------|:------------|
| `twitter:card` | Type of Twitter card (e.g., "player") |
| `twitter:title` | The title of your content as it should appear in the card |
| `twitter:site` | The Twitter @username the card should be attributed to |
| `twitter:description` | Description of the content (optional) |
| `twitter:player` | HTTPS URL to iframe player; must not generate mixed content warnings |
| `twitter:player:width` | Width of iframe specified in twitter:player in pixels |
| `twitter:player:height` | Height of iframe specified in twitter:player in pixels |
| `twitter:image` | Image displayed in place of the player on platforms that don't support iframe or inline players; should match player dimensions |

### Twitter Player Card Example

```html
<meta name="twitter:card" content="player" />
<meta name="twitter:title" content="Some great video" />
<meta name="twitter:site" content="@twitter_username">
<meta name="twitter:description" content="Great video by @twitter_username" />
<meta name="twitter:player" content="https://link-to-a-videoplayer.com" />
<meta name="twitter:player:width" content="360" />
<meta name="twitter:player:height" content="200" />
<meta name="twitter:image" content="https://link-to-a-image.com/image.jpg" />
```

## Previewing Open Graph Cards

You can preview Open Graph cards using services like [Opengraph.xyz](https://opengraph.xyz), which allows you to enter a URL and see a preview of your configured cards. This tool also helps generate additional Open Graph meta tags.

---

## Google Cast with DRM-Protected Videos

Google Cast is a popular method for sending video from one device (like a phone) to another (like a TV). While most players support Google Cast out of the box, DRM-protected video requires additional configuration.

### Overview

Google Cast integrations consist of two parts:
- **Sender**: The player initiating the cast (e.g., mobile browser)
- **Receiver**: A webpage sent to the destination device (e.g., TV)

### Implementation Steps

1. Create a sender (using Mux Player or custom implementation)
2. Create playback ID, playback token, and DRM token, then add them to the sender
3. Register your test device in the Google Cast dashboard
4. Create a custom receiver and register it on the Google Cast dashboard
5. Add the registered receiver ID to the sender

### Sender Setup

A Google Cast sender is an app with a "cast" button that:
1. Sets up connection to another device (if not connected)
2. Sends everything needed to play a video to the receiver (once connected)

#### Using Mux Player (Recommended)

The easiest approach uses Mux Player for Web. In addition to the usual `playback-id`, include these security and Google Cast fields:

- `playback-token`: A signed playback token for secured video playback
- `drm-token`: A signed DRM token for license verification
- `cast-receiver`: The application ID of your custom receiver

**Note:** This requires Mux Player version 3.4.1 or greater.

```html
<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player" defer></script>
<mux-player
  id="player"
  playback-id="your-playback-id"
  playback-token="your-playback-token"
  drm-token="your-drm-token"
  cast-receiver="your-cast-receiver-app-id"
></mux-player>
```

#### Custom Web Sender

For custom implementations, Google offers SDKs for Web, Android, and iOS.

**Requirements:**
- A playback token
- A DRM license token
- Secure context (HTTPS or localhost)

**Step 1: Import Cast SDK**

```html
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

**Step 2: Configure Cast SDK**

```javascript
window['__onGCastApiAvailable'] = function(isAvailable) {
  if (isAvailable) {
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: 'your-receiver-app-id',
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
  }
};
```

**Step 3: Send Video to Receiver**

```javascript
function playVideo(context) {
  const playbackId = 'your-playback-id';
  const playbackToken = 'your-playback-token';
  const drmToken = 'your-drm-token';
  const mediaUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${playbackToken}`;

  let mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl, 'application/x-mpegurl');

  // Mux HLS URLs with DRM always use fmp4 segments
  mediaInfo.hlsSegmentFormat = chrome.cast.media.HlsSegmentFormat.FMP4;
  mediaInfo.hlsVideoSegmentFormat = chrome.cast.media.HlsVideoSegmentFormat.FMP4;

  // Send information needed to create a new license URL
  mediaInfo.customData = {
    mux: {
      playbackId,
      tokens: {
        drm: drmToken
      }
    }
  }

  const request = new chrome.cast.media.LoadRequest(mediaInfo);

  // Cast the video
  context.getCurrentSession().loadMedia(request).then(() => {
    console.log('Successfully loaded the media');
  }).catch((err) => {
    console.log(`Media playback error code: ${err}`);
  });
}
```

**Step 4: Hook Up Cast Session**

```javascript
let context = cast.framework.CastContext.getInstance();
context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function(event) {
  switch (event.sessionState) {
    case cast.framework.SessionState.SESSION_STARTED:
    case cast.framework.SessionState.SESSION_RESUMED:
      playVideo(context);
      break;
  }
});
```

**Step 5: Add Cast Button**

```html
<google-cast-launcher>Launch</google-cast-launcher>
```

### Receiver Setup

A Google Cast receiver is a webpage (HTML and JavaScript) that receives data from a sender and plays the video.

#### Receiver Prerequisites

1. Host the receiver webpage at a public URL (or use ngrok during development)
2. Register the receiver URL with Google in the Google Cast SDK Developer Console
3. Get the unique Application ID from the dashboard for use in your sender
4. Register test devices (using serial numbers) for development testing

#### Receiver HTML

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title></title>
        <!-- Web Receiver SDK -->
        <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
        <!-- Cast Debug Logger -->
        <script src="//www.gstatic.com/cast/sdk/libs/devtools/debug_layer/caf_receiver_logger.js"></script>
    </head>

    <body>
        <cast-media-player></cast-media-player>
        <footer>
            <script src="js/receiver.js"></script>
        </footer>
    </body>
</html>
```

#### Receiver JavaScript

```javascript
const context = cast.framework.CastReceiverContext.getInstance();

/**
 * DEBUGGING
 */
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
const LOG_TAG = 'MUX';
castDebugLogger.setEnabled(true);

// Debug overlay on TV screen
castDebugLogger.showDebugLogs(true);

castDebugLogger.loggerLevelByTags = {
  [LOG_TAG]: cast.framework.LoggerLevel.DEBUG,
};

/**
 * DRM SUPPORT
 */
context.getPlayerManager().setMediaPlaybackInfoHandler((loadRequest, playbackConfig) => {
  const customData = loadRequest.media.customData || {};

  if(customData.mux && customData.mux.tokens.drm){
    castDebugLogger.debug(LOG_TAG, 'Setting license URL.');
    playbackConfig.licenseUrl = `https://license.mux.com/license/widevine/${customData.mux.playbackId}?token=${customData.mux.tokens.drm}`;
  }

  playbackConfig.protectionSystem = cast.framework.ContentProtection.WIDEVINE;

  castDebugLogger.debug(LOG_TAG, 'license url', playbackConfig.licenseUrl);

  return playbackConfig;
});

/**
 * START LISTENING FOR CASTS
 */
context.start();
```

### Testing Google Cast

After completing all setup steps:

1. Load your sender application
2. Click the cast button
3. Choose to cast to your registered test device
4. After loading, your DRM-protected video will start playing

To remove the debug overlay in production, comment out `castDebugLogger.setEnabled(true);` in the custom receiver.

### Additional Resources

**Google Cast SDKs:**
- JavaScript SDK: https://developers.google.com/cast/docs/web_sender
- iOS SDK: https://developers.google.com/cast/docs/ios_sender
- Android SDK: https://developers.google.com/cast/docs/android_sender

**Google Cast Documentation:**
- Custom receiver docs: https://developers.google.com/cast/codelabs/cast-receiver
- Debug logger docs: https://developers.google.com/cast/docs/debugging/cast_debug_logger
