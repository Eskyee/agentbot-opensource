# Video Playback Synchronization

Guide to synchronizing video playback across multiple viewers or with other application components. Covers watch party implementations, understanding EXT-X-PROGRAM-DATE-TIME tags in HLS manifests, supported video players, and integration with real-time communication channels.

## Introduction to Video Playback Synchronization

Video playback synchronization enables interactive experiences such as:

- **Watch parties**: Each viewer watches the video at the exact same moment simultaneously. When one viewer pauses, playback pauses for all viewers at the same point.
- **Component synchronization**: Synchronize video playback with other webpage elements like chats, activity feeds, fitness stats collection, and more.

The synchronization mechanism relies on aligning your web page or application components using a common source of truth: **epoch time** (Unix time). The underlying assumption is that viewers' devices remain synced to an NTP server.

## How EXT-X-PROGRAM-DATE-TIME Works

Mux records the epoch time of each frame received for live streams and includes that timing information in the HLS Manifest using the `EXT-X-PROGRAM-DATE-TIME` (PDT) tag, as defined in RFC 8216.

Key characteristics of PDT tags:

- Tag values are represented in ISO 8601 format
- Tags are added every few seconds with monotonically increasing epoch time
- Each tag represents the next frame's recorded epoch time

### Example HLS Manifest with PDT Tags

Below is an example of an HLS rendition (2nd level) manifest with repeating PDT tags for every 2 seconds of live stream recorded:

```text
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:2
#EXT-X-MAP:URI="https://chunk-gce-us-east1-production.cfcdn.mux.com/v1/chunk/..."
#EXT-X-PLAYLIST-TYPE:VOD

#EXT-X-PROGRAM-DATE-TIME:2021-06-28T17:53:25.533+00:00
#EXTINF:2,
https://chunk-gce-us-east1-production.cfcdn.mux.com/v1/chunk/.../0.m4s?...

#EXT-X-PROGRAM-DATE-TIME:2021-06-28T17:53:27.533+00:00
#EXTINF:2,
https://chunk-gce-us-east1-production.cfcdn.mux.com/v1/chunk/.../1.m4s?...

#EXT-X-PROGRAM-DATE-TIME:2021-06-28T17:53:29.533+00:00
#EXTINF:2,
https://chunk-gce-us-east1-production.cfcdn.mux.com/v1/chunk/.../2.m4s?...

#EXT-X-PROGRAM-DATE-TIME:2021-06-28T17:53:31.533+00:00
#EXTINF:2,
https://chunk-gce-us-east1-production.cfcdn.mux.com/v1/chunk/.../3.m4s?...

#EXT-X-ENDLIST
```

## Getting Epoch Time from Video Players

Every modern video player exposes an API to get the `EXT-X-PROGRAM-DATE-TIME` tag value. Your application can use this epoch time to synchronize video playback with other components.

### Supported Video Players

The following video players provide APIs to retrieve the `EXT-X-PROGRAM-DATE-TIME` tag value:

| Player | Documentation |
|--------|---------------|
| Mux Player | See section below |
| hls.js | hls-js-dev.netlify.app/api-docs/ |
| JW Player | JavaScript API Reference - `jwplayer.ontime` |
| THEOplayer | Program Date Time documentation |
| Bitmovin | SegmentPlaybackEvent datetime interface |
| React Native | currentplaybacktime property |
| Apple AVPlayer | AVPlayerItem currentDate method |
| Android ExoPlayer | HlsMediaPlaylist hasProgramDateTime |

## Mux Player Synchronization API

Mux Player provides two key properties/methods for synchronization: `currentPdt` and `getStartDate()`.

**Important**: `currentPdt` and `getStartDate()` currently require that Slates are enabled on your stream. If Slates are not enabled, the times provided may not be accurate.

### currentPdt Property

Returns a JavaScript Date object based on the current playback time. If there is no PDT in the stream, an invalid date object is returned.

```js
const player = document.querySelector('mux-player');

// Get the current PDT (assuming the example stream above)
player.currentPdt;
// Mon Jun 28 2021 13:53:25 GMT-0400 (Eastern Daylight Time)

player.currentPdt.getTime();
// 1624902805533

// After seeking forward by 10 seconds
player.currentTime = 10;

player.currentPdt;
// Mon Jun 28 2021 13:53:35 GMT-0400 (Eastern Daylight Time)

player.currentPdt.getTime();
// 1624902815533
```

### getStartDate() Method

Returns a JavaScript Date object based on the beginning of the stream. This method reflects the HTML specified method for media elements.

```js
const player = document.querySelector('mux-player');

// Get the start date
player.getStartDate();
// Mon Jun 28 2021 13:53:25 GMT-0400 (Eastern Daylight Time)

player.getStartDate().getTime();
// 1624902805533

// Note: When currentTime is 0, getStartDate() is equivalent to currentPdt

// After seeking forward by 10 seconds
player.currentTime = 10;

player.getStartDate();
// Mon Jun 28 2021 13:53:25 GMT-0400 (Eastern Daylight Time)
// The value remains the same regardless of current position
```

## Multi-Viewer Synchronization

To synchronize viewers playing videos on different devices, your application can subscribe to communication channels for receiving and sending epoch time values. Many cloud-based or commercial products built on WebSockets are available for implementing such communication channels.

### Implementation Pattern

1. **Establish a communication channel** using WebSockets or a similar real-time messaging service
2. **Broadcast PDT values** when playback actions occur (play, pause, seek)
3. **Receive PDT values** and adjust local playback to match the synchronized time
4. **Handle latency** by accounting for network delays between viewers

## Excluding PDT Tags

By default, HLS playback using `stream.mux.com/{PLAYBACK_ID}.m3u8` always includes the `EXT-X-PROGRAM-DATE-TIME` tag with the recorded epoch time value.

To exclude PDT tags, add the `exclude_pdt=true` parameter to the playback URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?exclude_pdt=true
```

### Reasons to Exclude PDT Tags

- **React Native compatibility**: Some video players like React Native update the current play position time value with the `EXT-X-PROGRAM-DATE-TIME` tag value. If your application expects a zero-based play position time, viewers could experience playback issues when the video player reports epoch time instead.
- **Legacy player support**: Your application may use a legacy video player or a player version without support for this HLS tag.

### Using with Signed URLs

If your `playback_id` uses a `signed` playback policy, all query parameters including `exclude_pdt` must be added to the JWT claims body rather than as URL query parameters. Refer to the signed URLs guide for details on generating properly signed URLs.

## FAQs

### Is the epoch time available with on-demand video?

Yes. Mux records epoch time for all live streams. The HLS manifest includes the epoch time every few seconds with the `EXT-X-PROGRAM-DATE-TIME` tag value when:

- The live stream is active
- Playing on-demand recordings of the live stream

**Note**: The epoch time is **not available** in the HLS manifest when the input is a video file (direct upload or URL import).

### Can I retrieve the epoch time through the API?

Yes. The asset resource object includes `recording_times` which represents the live stream start epoch time and the duration recorded. You can store this timing information for managing the live stream's status information.

## Additional Resources

For a deeper understanding of cross-platform stream synchronization, see:

- Demuxed 2018 presentation by Seth Maddison: "How to Synchronize your Watches: Cross-platform stream synchronization of HLS and DASH"
