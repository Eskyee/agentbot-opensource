# Live Stream Troubleshooting

Guide to debugging live stream issues, understanding the Live Stream Input Health dashboard, identifying common problems, and using health data exports for monitoring.

## Live Stream Input Health Dashboard

The Live Stream Input Health dashboard is a real-time dashboard that provides visibility on how Mux receives your live stream from the encoder. When a sizable percentage of viewers complain about their viewing experience or a configured Mux Data Alert fires, this dashboard is the starting point for identifying problems.

### Navigating to the Dashboard

Access the Live Stream Input Health dashboard through your Mux dashboard. The dashboard provides both real-time and historical data about the live stream input.

## Healthy Live Stream Indicators

A healthy live stream displays the following characteristics:

### Consistent Frames Per Second
- Mux receives consistent frames per second from the encoder
- Inconsistent frames per second can introduce video stuttering
- Frame rate inconsistency can cause playback interruptions for all viewers

### Stable Audio Bitrate
- Consistent non-zero audio bitrate is essential for uninterrupted listening
- A good encoder always creates a constant non-zero bitrate even when no person is speaking or music is playing
- Varying audio bitrate can result in a bad listening experience
- Audio bitrate variation is often an indicator of Audio-Video sync problems

### Stable Video Bitrate
- Consistent average video bitrate is important for good viewing experience
- Varying video bitrate does not necessarily cause playback problems but can result in poor viewing experience
- **Low variance** in video bitrate typically means optimal network bandwidth availability and encoder hardware resource utilization
- **High variance** in video bitrate indicates the encoder hardware cannot keep up with the encoding load
- Unstable or unreliable network bandwidth availability results in transient video bitrate drops, which can cause playback interruptions

## Common Live Stream Issues

### Example 1: High Video Bitrate Variance

**Symptoms:**
- Constant frames per second and audio bitrate (appears healthy)
- High variance in video bitrate
- Drop in average video bitrate mid-stream

**Impact:** Can negatively impact viewer experience

**Solution:**
Configure your encoder to use a lower video bitrate and a constant video bitrate (CBR). Use recommended encoder settings.

### Example 2: Intermittent Loss

**Symptoms:**
- Mostly constant frames per second
- Mostly constant audio/video bitrate when connected
- Small spikes in metrics
- Intermittent loss in receiving the live stream

**Diagnosis:** When the encoder is connected the stream is healthy, but transient network bandwidth availability issues cause intermittent connection drops.

**Solution:**
- Switch to a more reliable network
- Stop other network bandwidth consuming services for the duration of the live stream

### Example 3: Spiky Audio and Video Bitrate

**Symptoms:**
- High variance in receiving audio bitrate
- High variance in receiving video bitrate
- Connection never fully drops

**Diagnosis:** Since the connection never fully drops, the network connection is probably not the problem. More likely, the encoder is unable to keep up at a fast enough pace to send consistent video and audio data. One cause is that the device running the encoder might be running out of available CPU.

**Solutions:**
1. Consider using a recommended encoder (OBS, Wirecast, etc.)
2. Configure the encoder to use a lower video bitrate
3. Use constant video bitrate (CBR)

### Example 4: Spiky Frame Rate

**Symptoms:**
- High variance in video bitrate
- Several instances of frame rate dipping to nearly zero
- Spiky video bitrate mid-stream

**Diagnosis:** This is a very unhealthy live stream. The spiky video bitrate indicates that the encoder is optimizing the video encoding based on the feed contents, which is not ideal for live streaming.

**Solutions:**
1. Switch to a more reliable network
2. Stop other network bandwidth consuming services
3. Configure the encoder to use constant video bitrate (CBR)

## Encoder Recommendations

To resolve many live stream issues:

1. **Use Constant Bitrate (CBR):** Configure your encoder to use constant bitrate instead of variable bitrate
2. **Lower Video Bitrate:** If experiencing high variance, try reducing the video bitrate
3. **Use Recommended Encoders:** Consider software encoders like OBS or Wirecast
4. **Ensure Adequate CPU:** Make sure the encoding device has sufficient CPU resources

## Live Stream Input Health Data Export

Live Stream Input Health data can be integrated with an Amazon Kinesis or Google Pub/Sub endpoint in your cloud account for monitoring and operational purposes.

**Note:** This feature requires a subscription. Contact the Mux Sales team for more information.

### Export Capabilities

- Health and encoding metadata are sent to Kinesis or Pub/Sub as events occur
- Data is available with the same five-second interval as the Dashboard
- Can be stored in long-term storage for immediate display and historical reporting

### Use Cases

- Embedding live stream health in user-facing application features
- Building internal operational tools for stream reporting

### Setting Up Streaming Exports

Streaming exports can be configured in the **Streaming Exports** settings in the Mux dashboard. Supported platforms:
- Amazon Kinesis Data Streams
- Google Cloud Pub/Sub

### Message Format

Messages are formatted using Protobuf (proto2) encoding. Every message uses the `live_stream_input_health.v1.LiveStreamInputHealth` message type.

The protobuf definition is available in the mux-protobuf repository at: https://github.com/muxinc/mux-protobuf/tree/main/live_stream_input_health/v1

### Update Types

There are two types of updates (new types may be added in the future):

#### RTMP Metadata Event

Contains encoder metadata sent by the RTMP encoder:

```javascript
RTMPMetadataEvent = {
  // Video track data (present for AV streams)
  "video_track": {
    "width": 1280,                    // Width of the input video
    "data_rate": 4000,                // Kbps data rate of the video
    "codec_id": "avc1",               // Video codec
    "height": 720,                    // Height of the input video
    "frame_rate": 30                  // Number of frames per second
  },
  // Audio track data (present for AV and audio-only streams)
  "audio_track": {
    "sample_size": 16,                // Bits per audio sample
    "sample_rate": 44100,             // Sample rate
    "data_rate": 128,                 // Kbps data rate of the audio
    "codec_id": "mp4a",               // Audio codec
    "channel_count": 1                // Number of audio channels
  },
  "encoder": "ffmpeg",                // The encoder used to transcode for the broadcast
  "live_stream_id": "uiwe7gZtIcuyYSCfjfpGjad02RPqN",  // Mux Live Stream Id
  "asset_id": "hfye6sBqRmR8MRJZaWYq602X1rB0"          // Mux Asset Id
}
```

#### Health Update Event

Contains stream input health data:

```javascript
HealthUpdateEvent = {
  // Video tracks (present for AV streams)
  "video_tracks": [
    {
      "bytes_received": 3155737,       // Number of video bytes received during this interval
      "stream_start_ms": 4979091,      // Timestamp of first video frame (ms since stream start)
      "stream_end_ms": 4985097,        // Timestamp of last video frame (ms since stream start)
      "keyframes_received": 3,         // Number of keyframes during this interval
      "total_frames_received": 180     // Total video frames received during this interval
    }
  ],
  // Audio tracks (present for AV and audio-only streams)
  "audio_tracks": [
    {
      "bytes_received": 94864          // Number of audio bytes received during this interval
    }
  ],
  // Caption tracks
  "caption_tracks": [
    {
      "bytes_received": 12354,         // Number of captions bytes received during this interval
      "channel_count": 1               // Number of caption channels that received data
    }
  ],
  "measurement_start_ms": 1644313838000,  // Interval start timestamp (ms since Unix epoch)
  "measurement_end_ms": 1644313838000,    // Interval end timestamp (ms since Unix epoch)
  "live_stream_id": "uiwe7gZtIcuyYSCfjfpGjad02RPqN",
  "asset_id": "hfye6sBqRmR8MRJZaWYq602X1rB0",
  "asn": 25135,                        // ASN number for the ingest IP address
  "asn_name": "VODAFONE_UK_ASN (AS2135)"  // Friendly name for the ASN
}
```

### Update Frequency

- **Encoder metadata:** Sent when the RTMP stream connects to Mux. Some encoders also send metadata updates during the live stream.
- **Health updates:** Occur every 5 seconds for each stream that is currently connected.

## Live Streaming FAQs

### What is Mux's latency for live streams?

| Mode | Latency |
|------|---------|
| Standard | Greater than 20 seconds, typically 25-30 seconds |
| Reduced Latency | 12-20 seconds |
| Low-Latency | As low as 5 seconds glass-to-glass (varies by viewer location and connectivity) |

### What is the maximum live stream duration?

Mux has a 12 hour limit for continuous streaming to live endpoints. The live stream is disconnected after 12 hours. If the encoder reconnects, Mux will transition to a new asset with its own playback ID.

### Does Mux support WebRTC for live streaming ingest?

Mux currently does not support direct WebRTC ingest to a Live Stream. The focus is on RTMP and RTMPS for live streams from an encoder as they are the most universal ingest protocols.

### How can I go live from a browser?

To go live directly from a browser, you need to convert the browser stream into a format that can be consumed by RTMP. Options include:
- Using Zoom with its RTMP-out feature to broadcast a stream with Mux
- Using other services that convert browser streams to RTMP

### Is Mux Live Streaming API suitable for 2-way video communication?

No. Mux's Live Streaming API is not intended for 2-way video communication. For such use cases, consider partners like LiveKit.

### Can I rewind live content while the stream continues (DVR mode)?

**Non-DVR mode (default):** Only has access to the most recent 30 seconds of the live stream.

**DVR mode:** Possible by utilizing the live stream's `active_asset_id`. When constructing the playback URL, use the `playback_id` for the associated `active_asset_id`. When the live video ends, the Playback ID will automatically transition to an on-demand asset for playback.

### Do I need to create stream keys for every live event?

No. Stream keys can be reused any number of times. It is common for applications to assign one stream key to each user (broadcaster) and allow that user to reuse the same stream key over time.

### Is there a limit to creating stream keys and live streams?

There is no limit on how many stream keys and live streams you can create. Once created, stream keys are persistent and can be used for any number of live events.

### Do you charge for creating stream keys?

No charge for creating stream keys. Charges only apply when sending an active RTMP feed.

### Can I live stream a pre-recorded video?

Mux does not support generating simulated live from on-demand assets (playout service). However, you can run a simulated live stream using tools like OBS or Wirecast to send on-demand assets as an RTMP stream.

### Can I restream/simulcast to social platforms?

Yes. Mux Video live service supports up to six simultaneous restreams to third party platforms that support RTMP feed.

### Is my content saved after the live broadcast is over?

Yes. Mux automatically creates an on-demand (VOD) asset after the live stream ends, which can be streamed again instantly.

### Can I get access to my live event's recording?

Yes. Enable downloading of the entire event recording using the Master access feature. With Master access enabled, you will receive a Webhook notification after the live stream ends indicating that the master copy is available to download.

### Can I generate thumbnails/GIFs while the live stream is active?

Yes. You can use the thumbnail and animated GIF API while the live event is active. This is commonly used to show what content is currently playing or to promote the live stream.

### Can I test Mux live streaming for free?

Yes. On any paid plan, you can create free test live streams. Test live streams are:
- Unlimited in number
- Watermarked with the Mux logo
- Limited to 5 minutes
- Disabled after 24 hours

### Can I add multiple audio channels or tracks to my live stream?

No. Currently only one audio track is supported for live streams. On-demand video assets do support multiple alternative audio tracks.

**Workaround for multi-language support:** Ingest multiple streams with one in each language, then add logic to the player to switch between different playback URLs when the user changes the language.

### What happens if I live stream variable frame rate (VFR) content?

While Mux does not output variable frame rate (VFR) content for live streams, it will accept VFR content for ingest. However, constant frame rate (CFR) content is recommended for live streams to ensure the best playback experience.
