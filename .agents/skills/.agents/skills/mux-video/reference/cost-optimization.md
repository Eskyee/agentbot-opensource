# Optimizing Mux Video Costs

Strategies and techniques to reduce and optimize Mux Video costs through quality settings, delivery optimization, player configuration, and storage management.

## Understanding Mux Pricing Structure

Mux pricing is split into three categories:

1. **Input (Encoding)**: Charged by minutes of video uploaded and encoded
2. **Storage**: Charged by minutes of video stored per month
3. **Delivery**: Charged by minutes of video delivered to viewers

All pricing is per minute of video, prorated by the second. Costs vary based on resolution and video quality level (basic, plus, or premium).

## Cost Optimization Through Video Quality Levels

### Use Basic Video Quality for Free Encoding

The basic video quality level provides **free encoding** for all uploaded videos. This eliminates input costs entirely.

**Best suited for:**
- User-generated content (UGC)
- Social media-style platforms
- Simpler video use cases where maximum quality is not essential

**Trade-offs:**
- Uses a reduced encoding ladder with lower target video quality
- Basic quality assets have a minimum storage charge of one month (prorated thereafter)
- Not available for live streams (live requires plus or premium)

**How to set:**
- Configure the organization default in Settings in the dashboard
- Override per-asset at asset creation time

### Quality Level Comparison

| Quality | Input Cost | Best For |
|---------|------------|----------|
| Basic | Free | UGC, social content, simpler use cases |
| Plus | Per-minute charge | Professional or branded content |
| Premium | Higher per-minute charge | Studio or cinematic projects |

## Storage Cost Optimization

### Automatic Cold Storage

Mux automatically transitions assets to cheaper storage tiers based on viewing activity:

| Tier | Condition | Discount |
|------|-----------|----------|
| Frequent | Recently viewed | Base rate |
| Infrequent | Not viewed in 30+ days | 40% off |
| Cold | Not viewed in 90+ days | 60% off |

**Key behaviors:**
- New assets start in Cold tier until first viewed
- Viewing via HLS or static rendition resets the timer
- Downloading a master resets the asset to Frequent tier
- Static renditions also benefit from cold storage

### Delete Live Stream Assets After Streaming

When a live stream ends, Mux automatically creates an on-demand asset. To save on storage:

- Delete the resulting asset if you do not need the recording
- This eliminates ongoing storage charges
- Ingest/encoding costs still apply for the completed stream

**Note:** Storage is prorated by the percentage of the month. A 10-minute asset stored for half a month is charged for 5 minutes.

## Delivery Cost Optimization

### Cap Maximum Delivery Resolution

Use resolution-based pricing by limiting the maximum resolution delivered to viewers:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?max_resolution=720p
```

**Available values:**
- `720p`
- `1080p`
- `1440p`
- `2160p`

**Use cases:**
- Reduce delivery costs across the board
- Implement tiered access (e.g., free users get 720p, premium get 1080p)

**Resolution pricing tiers:**

| Tier | Pixel Range | Typical Resolution |
|------|-------------|-------------------|
| Up to 720p | Up to 921,600 pixels | 1280x720 |
| 1080p | 921,601 to 2,073,600 pixels | 1920x1080 |
| 1440p (2K) | 2,073,601 to 4,194,304 pixels | 2560x1440 |
| 2160p (4K) | 4,194,305 to 8,294,400 pixels | 3840x2160 |

### Cap Upload Resolution

Reduce costs at the source by limiting capture resolution before upload:

- When using mobile SDKs (Android/iOS), configure maximum upload resolution
- Default SDK behavior adjusts inputs larger than 1920x1080 down to 1080p
- Lower resolution inputs mean lower encoding, storage, and delivery costs

### Use Preload Settings

Control when video data loads to reduce unnecessary delivery:

```html
<!-- No preloading - lowest delivery cost, slowest startup -->
<mux-player preload="none" />

<!-- Metadata only - minimal delivery, slower startup -->
<mux-player preload="metadata" />

<!-- Auto preload - fastest startup, higher delivery cost -->
<mux-player preload="auto" />
```

**Trade-offs:**
- `preload="none"`: No video loads until play is pressed; slower startup
- `preload="metadata"`: Only loads duration and basic info; moderate startup
- `preload="auto"`: Buffers video immediately; fastest startup but uses delivery

**Note:** Mobile browsers (iOS/Android) often ignore preload hints due to data-saving policies.

### Implement Lazy Loading

Load the player only when the user is ready to watch:

- Player does not load until scrolled into view
- No delivery charges until the player actually loads
- Useful for pages with multiple potential videos

### Reduce Player Buffer Length

Shorten the forward buffer to reduce delivered video that may never be watched:

```javascript
const player = document.querySelector('mux-player');
player._hls.config.maxBufferLength = 30; // seconds
player._hls.config.maxBufferSize = 60 * 1000 * 1000; // bytes
player._hls.config.maxMaxBufferLength = 60; // seconds
```

**Configuration options:**
- `maxBufferLength`: New fragments load when buffer drops below this value
- `maxBufferSize`: Maximum buffer size in bytes
- `maxMaxBufferLength`: Absolute maximum buffer length in seconds

**Warning:** Shorter buffers increase rebuffering risk during network hiccups. This is an advanced optimization with performance trade-offs.

### Pause When Out of Viewport

Stop playback when the browser tab or window loses focus:

```javascript
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") {
        console.log("Window is inactive, pausing video player");
        player.pause();
    }
});
```

This prevents delivery charges when the viewer is not actually watching.

### Implement "Are You Still Watching?"

For autoplay scenarios, interrupt playback after extended inactivity:

```jsx
import { useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

export default function App() {
  const [lastPlayedTimestamp, setLastPlayedTimestamp] = useState();

  const playbackId = "your-playback-id";
  const secondsToStopVideo = 300; // 5 minutes of no interaction

  const handleAllUserActivity = (event) => {
    setLastPlayedTimestamp(event.target.currentTime);
  };

  const handleTimeUpdate = (event) => {
    const player = event.target;
    const timeElapsed = player.currentTime - lastPlayedTimestamp;
    if (!player.paused && timeElapsed > secondsToStopVideo) {
      player.pause();
      alert("Are you still watching?");
    }
  };

  return (
    <MuxPlayer
      playbackId={playbackId}
      onPlaying={handleAllUserActivity}
      onSeeking={handleAllUserActivity}
      onRateChange={handleAllUserActivity}
      onVolumeChange={handleAllUserActivity}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}
```

### Avoid Multiple Videos on One Page

When multiple video players load on a single page:

- Each player may preload video before playback
- This multiplies delivery charges on page load
- Consider using thumbnails that load players on click
- Use lazy loading or `preload="none"` for video galleries

### Limit Upload Duration

For UGC platforms, cap video duration at upload:

- Reduces encoding costs for unnecessarily long videos
- Common for social media and short-form content platforms
- Prevents accidental uploads of very long recordings

## Monitoring and Visibility

### Delivery Usage API

Track asset-level delivery for cost analysis:

- Get delivery details per asset for a specified time period
- Query across all assets or specific ones
- Data aggregated hourly at the top of the hour
- Available for the last 90 days, starting 12 hours prior to request

Use this API to:
- Identify high-delivery assets
- Find optimization opportunities
- Build internal cost dashboards

## Volume Discounts

Mux automatically applies volume discounts as usage increases:

- **Input**: Discounts begin after 5,000 minutes
- **Storage**: Discounts begin after 50,000 minutes
- **Delivery**: Discounts begin after 500,000 minutes (first 100,000 are free)

Volume tiers are calculated per resolution and quality level independently.

## Free Tier Benefits

Take advantage of included free usage:

- **Delivery**: First 100,000 minutes per month are free (all resolutions and quality levels)
- **Basic encoding**: Always free regardless of volume
- **Auto-generated live captions**: First 6,000 minutes per month are free

## Pre-pay Credits

For predictable savings on higher usage:

- **Launch credits**: $100 of monthly usage for $20/month
- **Scale credits**: $1,000 of monthly usage for $500/month
- Credits apply to standard usage rates
- Overage charged at pay-as-you-go rates
- Credits reset monthly

## Summary of Cost Optimization Strategies

| Strategy | Affects | Savings Potential |
|----------|---------|-------------------|
| Basic video quality | Encoding | Eliminates encoding cost |
| Automatic cold storage | Storage | Up to 60% on inactive assets |
| Delete live stream assets | Storage | Eliminates ongoing storage |
| Cap delivery resolution | Delivery | Significant based on tier difference |
| Cap upload resolution | All | Reduced costs across all categories |
| Preload settings | Delivery | Reduces wasted delivery |
| Lazy loading | Delivery | Eliminates delivery until needed |
| Pause when hidden | Delivery | Reduces background delivery |
| Shorter buffer | Delivery | Reduces over-buffered content |
| "Still watching?" prompt | Delivery | Reduces unattended playback |
| Limit upload duration | Encoding, Storage | Caps per-asset costs |
