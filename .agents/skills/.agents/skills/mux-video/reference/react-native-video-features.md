# React Native: Video Playback, Upload, and Live Streaming

This guide provides comprehensive coverage of video features in React Native using Mux, including video playback patterns, uploading videos, and live streaming capabilities.

## Video Playback

### Understanding HLS Playback

Mux delivers video using HLS (HTTP Live Streaming), which is natively supported on both iOS and Android:

- Videos stream in segments, not as a single large file
- Quality automatically adapts to network conditions (ABR - Adaptive Bitrate)
- Playback can start before the entire video downloads
- Works seamlessly on cellular networks

### Playback IDs and URLs

Every Mux video has a **playback ID** used to construct the streaming URL:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

#### Public vs Signed Playback

Mux supports two types of playback policies:

- **Public playback IDs**: Anyone with the URL can play the video
- **Signed playback IDs**: Requires a JWT token for access control

For signed playback, include a JWT as a query parameter:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8?token={JWT}
```

#### Secure Video Player Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

function SecureVideoPlayer({ playbackId }: { playbackId: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch signed URL from your backend
    fetch('https://your-api.com/video/signed-url', {
      method: 'POST',
      body: JSON.stringify({ playbackId }),
    })
      .then(res => res.json())
      .then(data => setVideoUrl(data.url));
  }, [playbackId]);

  const player = useVideoPlayer(videoUrl, player => {
    player.play();
  });

  if (!videoUrl) {
    return <ActivityIndicator />;
  }

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
```

### Managing Player State

The `expo-video` library uses an event-based system with hooks from the `expo` package:

```tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerProps {
  playbackId: string;
}

export default function VideoPlayer({ playbackId }: VideoPlayerProps) {
  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.loop = false;
      player.play();
    }
  );

  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {error?.message || 'Failed to load video. Please try again.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={styles.loader}
        />
      )}
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 10,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
});
```

### Listening to Player Events

#### Using the useEvent Hook

Creates a listener that returns a stateful value for use in components:

```tsx
import { useEvent } from 'expo';

const { status, error } = useEvent(player, 'statusChange', {
  status: player.status,
});

const { isPlaying } = useEvent(player, 'playingChange', {
  isPlaying: player.playing,
});
```

#### Using the useEventListener Hook

For side effects when events occur:

```tsx
import { useEventListener } from 'expo';

useEventListener(player, 'statusChange', ({ status, error }) => {
  console.log('Player status changed:', status);
  if (error) {
    console.error('Player error:', error);
  }
});

useEventListener(player, 'playToEnd', () => {
  console.log('Video finished playing');
  player.replay();
});
```

### Key Player Events

| Event | When it fires | Use case |
|-------|---------------|----------|
| `statusChange` | Player status changes (idle, loading, readyToPlay, error) | Show loading states, handle errors |
| `playingChange` | Play/pause state changes | Update play/pause button |
| `timeUpdate` | Periodically during playback | Update progress bar |
| `sourceLoad` | Video source finishes loading | Get duration, available tracks |
| `playToEnd` | Video finishes playing | Auto-play next video, show replay |

### Poster Images and Thumbnails

Mux automatically generates thumbnails for your videos:

```tsx
import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoWithPoster({ playbackId }: { playbackId: string }) {
  const [showPoster, setShowPoster] = useState(true);
  const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.png?time=0`;

  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.loop = false;
    }
  );

  const handlePosterPress = () => {
    setShowPoster(false);
    player.play();
  };

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      {showPoster && (
        <Pressable onPress={handlePosterPress} style={styles.poster}>
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  poster: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
```

#### Thumbnail URL Options

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.{format}?{params}
```

**Common parameters:**

- `time` - Timestamp in seconds (e.g., `time=5` for 5 seconds in)
- `width` - Thumbnail width in pixels (e.g., `width=640`)
- `height` - Thumbnail height in pixels (e.g., `height=360`)
- `fit_mode` - How to resize: `preserve`, `stretch`, `crop`, `smartcrop`

**Example:**

```tsx
const thumbnail = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=5&width=1280&fit_mode=smartcrop`;
```

### Aspect Ratios

#### Landscape Video (16:9)

```tsx
const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9, // 1.777
  },
});
```

#### Portrait Video (9:16)

For Stories, Reels, or TikTok-style feeds:

```tsx
const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 9 / 16, // 0.5625
  },
});
```

#### Square Video (1:1)

For social feeds:

```tsx
const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 1,
  },
});
```

#### Dynamic Aspect Ratio

Match the video's actual dimensions using the `sourceLoad` event:

```tsx
import { View, StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function DynamicVideoPlayer({ playbackId }: { playbackId: string }) {
  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();
    }
  );

  const loadedMetadata = useEvent(player, 'sourceLoad');

  const aspectRatio = (() => {
    const tracks = loadedMetadata?.availableVideoTracks;
    if (tracks && tracks.length > 0) {
      const { width, height } = tracks[0].size;
      return width / height;
    }
    return 16 / 9; // Default fallback
  })();

  return (
    <VideoView
      player={player}
      style={[styles.video, { aspectRatio }]}
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
  },
});
```

**Note:** The `sourceLoad` event works reliably on iOS and Android. On web, it may not fire consistently. For cross-platform dynamic aspect ratios, consider fetching video dimensions from the Mux API.

### Fullscreen Support

```tsx
import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPlayerWithFullscreen({ playbackId }: { playbackId: string }) {
  const videoRef = useRef<VideoView>(null);

  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();
    }
  );

  const enterFullscreen = async () => {
    await videoRef.current?.enterFullscreen();
  };

  return (
    <View>
      <VideoView
        ref={videoRef}
        player={player}
        style={styles.video}
        nativeControls={false}
        allowsFullscreen
        onFullscreenEnter={() => console.log('Entered fullscreen')}
        onFullscreenExit={() => console.log('Exited fullscreen')}
      />
      <TouchableOpacity onPress={enterFullscreen} style={styles.button}>
        <Text style={styles.buttonText}>Go Fullscreen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  button: {
    backgroundColor: '#ec9430ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
```

Fullscreen behavior is handled natively by the platform. On iOS, this uses AVPlayerViewController. On Android, this uses ExoPlayer's fullscreen controller.

### Error Handling

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

function VideoPlayerWithRetry({ playbackId }: { playbackId: string }) {
  const [retryKey, setRetryKey] = useState(0);

  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();
    }
  );

  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  const retry = useCallback(() => {
    player.replay();
    setRetryKey(prev => prev + 1);
  }, [player]);

  const getErrorMessage = (error: any) => {
    const message = error?.message || '';
    if (message.includes('network') || message.includes('ENOTFOUND')) {
      return 'Network error. Check your connection.';
    } else if (message.includes('403') || message.includes('forbidden')) {
      return 'This video is not available.';
    }
    return 'Failed to load video.';
  };

  if (status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <VideoView
      key={retryKey}
      player={player}
      style={styles.video}
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  errorContainer: {
    backgroundColor: '#000',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 16 / 9,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
```

#### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| Network timeout | Slow/no connection | Show retry button, check network status |
| 403 Forbidden | Invalid playback ID or signed URL expired | Refresh token, verify playback ID |
| Video not loading | Asset still processing | Check asset status, show "processing" message |
| Playback stalled | Poor network | HLS handles this automatically via ABR |

### Custom Controls

Build custom video controls by setting `nativeControls={false}`:

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import Slider from '@react-native-community/slider';

export default function CustomControlsPlayer({ playbackId }: { playbackId: string }) {
  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.timeUpdateEventInterval = 0.25; // Update every 250ms
    }
  );

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const timeUpdate = useEvent(player, 'timeUpdate');
  const currentTime = timeUpdate?.currentTime ?? 0;
  const duration = player.duration;

  const handleSeek = (time: number) => {
    player.currentTime = time;
  };

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayback}>
          <Text style={styles.controlText}>
            {isPlaying ? '||' : '>'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.time}>{formatTime(currentTime)}</Text>

        <Slider
          style={styles.slider}
          value={currentTime}
          minimumValue={0}
          maximumValue={duration || 1}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#666"
          thumbTintColor="#fff"
        />

        <Text style={styles.time}>{formatTime(duration || 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlText: {
    color: '#fff',
    fontSize: 24,
    marginRight: 10,
  },
  time: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 5,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
});
```

### Playback Speed Control

```tsx
import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayerWithSpeed({ playbackId }: { playbackId: string }) {
  const [speedIndex, setSpeedIndex] = useState(2); // Default to 1x

  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();
    }
  );

  const cycleSpeed = useCallback(() => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIndex);
    player.playbackRate = PLAYBACK_SPEEDS[nextIndex];
  }, [player, speedIndex]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      <TouchableOpacity onPress={cycleSpeed} style={styles.speedButton}>
        <Text style={styles.speedText}>
          Speed: {PLAYBACK_SPEEDS[speedIndex]}x
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  speedButton: {
    backgroundColor: '#ec9430ff',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

**Tip:** Use `player.preservesPitch = true` (default) to maintain audio pitch at higher speeds.

### Picture-in-Picture Support

```tsx
import React, { useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useVideoPlayer, VideoView, isPictureInPictureSupported } from 'expo-video';

export default function VideoPlayerWithPiP({ playbackId }: { playbackId: string }) {
  const videoRef = useRef<VideoView>(null);
  const [isInPiP, setIsInPiP] = useState(false);

  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();
    }
  );

  const togglePiP = useCallback(() => {
    if (!isInPiP) {
      videoRef.current?.startPictureInPicture();
    } else {
      videoRef.current?.stopPictureInPicture();
    }
  }, [isInPiP]);

  const pipSupported = Platform.OS !== 'web' && isPictureInPictureSupported();

  if (!pipSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Picture-in-Picture is not supported on this platform.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        ref={videoRef}
        player={player}
        style={styles.video}
        nativeControls
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        onPictureInPictureStart={() => setIsInPiP(true)}
        onPictureInPictureStop={() => setIsInPiP(false)}
      />
      <TouchableOpacity onPress={togglePiP} style={styles.button}>
        <Text style={styles.buttonText}>
          {isInPiP ? 'Exit' : 'Enter'} Picture-in-Picture
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  button: {
    backgroundColor: '#ec9430ff',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
});
```

**Configuration required in app.json:**

```json
{
  "expo": {
    "plugins": [
      ["expo-video", { "supportsPictureInPicture": true }]
    ]
  }
}
```

### iOS vs Android Considerations

#### iOS (AVPlayer)

- Native HLS support
- Picture-in-Picture available on iOS 14+
- Smooth fullscreen transitions
- AirPlay support via `allowsExternalPlayback`
- Respects system audio settings

#### Android (ExoPlayer)

- Native HLS support via ExoPlayer
- Picture-in-Picture on Android 12+
- Configurable surface type (SurfaceView vs TextureView)
- May require additional permissions for background playback

**Important:** Test your video player on both iOS and Android physical devices, not just simulators.

#### Platform-specific Configuration

```tsx
import { Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function PlatformAwarePlayer({ playbackId }: { playbackId: string }) {
  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.play();

      // iOS-specific settings
      if (Platform.OS === 'ios') {
        player.allowsExternalPlayback = true; // Enable AirPlay
      }

      // Configure buffer options
      player.bufferOptions = {
        preferredForwardBufferDuration: Platform.OS === 'ios' ? 0 : 20,
        minBufferForPlayback: 2,
      };
    }
  );

  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9 }}
      nativeControls
      // Android-specific: use TextureView for overlapping videos
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
    />
  );
}
```

### Performance Tips

#### 1. Pause Videos When Not Visible

```tsx
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPlayer({ playbackId }: { playbackId: string }) {
  const player = useVideoPlayer(
    `https://stream.mux.com/${playbackId}.m3u8`,
    player => {
      player.staysActiveInBackground = false;
    }
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        player.play();
      } else {
        player.pause();
      }
    });

    return () => subscription.remove();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9 }}
      nativeControls
    />
  );
}
```

#### 2. Preload Videos for Smoother Transitions

```tsx
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import { useState, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

const video1: VideoSource = 'https://stream.mux.com/PLAYBACK_ID_1.m3u8';
const video2: VideoSource = 'https://stream.mux.com/PLAYBACK_ID_2.m3u8';

export default function PreloadingPlayer() {
  const player1 = useVideoPlayer(video1, player => {
    player.play();
  });

  const player2 = useVideoPlayer(video2, player => {
    player.currentTime = 0; // Preload from the start
  });

  const [currentPlayer, setCurrentPlayer] = useState(player1);

  const switchVideo = useCallback(() => {
    currentPlayer.pause();
    if (currentPlayer === player1) {
      setCurrentPlayer(player2);
      player2.play();
    } else {
      setCurrentPlayer(player1);
      player1.play();
    }
  }, [currentPlayer, player1, player2]);

  return (
    <View>
      <VideoView player={currentPlayer} style={styles.video} nativeControls />
      <TouchableOpacity onPress={switchVideo} style={styles.button}>
        <Text style={styles.buttonText}>Switch Video</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  button: {
    backgroundColor: '#4630ec',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
```

#### 3. Enable Video Caching

```tsx
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';

function CachedVideoPlayer({ playbackId }: { playbackId: string }) {
  const videoSource: VideoSource = {
    uri: `https://stream.mux.com/${playbackId}.m3u8`,
    useCaching: true,
    metadata: {
      title: 'My Video',
    },
  };

  const player = useVideoPlayer(videoSource, player => {
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9 }}
      nativeControls
    />
  );
}
```

**How caching works:**

- The cache is persistent across app launches
- Videos are evicted on a least-recently-used basis when the cache size limit is reached (default: 1GB)
- The system may clear the cache when device storage is low
- Cached videos can be played offline until the cached data is exhausted

**Managing the cache:**

```tsx
import {
  setVideoCacheSizeAsync,
  getCurrentVideoCacheSize,
  clearVideoCacheAsync
} from 'expo-video';

// Set cache size to 500MB (must be called when no players exist)
await setVideoCacheSizeAsync(500 * 1024 * 1024);

// Get current cache size
const cacheSize = getCurrentVideoCacheSize();
console.log(`Cache is using ${cacheSize} bytes`);

// Clear all cached videos (must be called when no players exist)
await clearVideoCacheAsync();
```

**Caching limitations:**

- HLS video sources cannot be cached on iOS due to platform limitations
- DRM-protected videos cannot be cached on Android and iOS
- Cache management functions can only be called when no `VideoPlayer` instances exist

#### 4. Optimize Poster Image Loading

Use lower resolution thumbnails for poster images:

```tsx
const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&time=0`;
```

---

## Uploading Videos

There are two primary ways to get videos into Mux from a React Native application:

1. **Direct upload from device** - User records or selects a video, which is uploaded directly from their mobile device
2. **Upload from URL** - Your backend creates a Mux asset from a video URL (ideal for AI-generated content)

### Choosing an Upload Method

| Method | Use Case | React Native Role | Backend Required | User Experience |
|--------|----------|-------------------|------------------|-----------------|
| **Direct Upload** | User-generated content (camera, library) | High - handles file upload | Yes - generates upload URL | Shows upload progress |
| **Upload from URL** | AI-generated videos, pre-hosted content | Low - just displays result | Yes - creates asset | Background process |

### Direct Upload from Mobile Device

Direct uploads allow users to upload videos directly from their React Native app to Mux without the file touching your backend servers.

#### Architecture

```
User Device -> Your Backend (generate upload URL) -> Mux
                |
            Upload URL returned
                |
User Device -> Mux (upload file directly)
                |
            Mux processes video
                |
            Webhook -> Your Backend (asset ready)
```

#### Step 1: Generate a Signed Upload URL (Backend)

```javascript
// Backend: Node.js + Mux SDK
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// API endpoint: POST /api/generate-upload-url
export async function generateUploadUrl(req, res) {
  try {
    const upload = await mux.video.uploads.create({
      cors_origin: '*', // Or specify your app's origin
      new_asset_settings: {
        playback_policies: ['public'],
        video_quality: "basic"
      },
    });

    res.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error('Failed to create upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
```

**Important:** Never expose your Mux API credentials in your React Native app. Always generate upload URLs from your backend.

#### Step 2: Record or Select Video (React Native)

```tsx
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export function useVideoPicker() {
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  return { videoUri, pickVideo, recordVideo };
}
```

#### Step 3: Upload to Mux (React Native)

```tsx
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';

interface UploadResult {
  uploadId: string;
  assetId?: string;
}

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = async (videoUri: string): Promise<UploadResult | null> => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Get upload URL from your backend
      const response = await fetch('https://your-api.com/generate-upload-url', {
        method: 'POST',
      });
      const { uploadUrl, uploadId } = await response.json();

      // Step 2: Upload video file to Mux with progress tracking
      const uploadTask = FileSystem.createUploadTask(
        uploadUrl,
        videoUri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
        (uploadProgress) => {
          const progress = uploadProgress.totalBytesSent / uploadProgress.totalBytesExpectedToSend;
          setUploadProgress(Math.round(progress * 100));
        }
      );

      const uploadResponse = await uploadTask.uploadAsync();

      if (!uploadResponse || uploadResponse.status !== 200) {
        throw new Error('Upload failed');
      }

      setUploading(false);

      return { uploadId };
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video');
      setUploading(false);
      setUploadProgress(0);
      return null;
    }
  };

  return { uploadVideo, uploading, uploadProgress, error };
}
```

#### Complete Upload Example

```tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function VideoUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const selectAndUploadVideo = async () => {
    // Step 1: Select video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (result.canceled) return;

    const videoUri = result.assets[0].uri;
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 2: Get upload URL
      const response = await fetch('https://your-api.com/generate-upload-url', {
        method: 'POST',
      });
      const { uploadUrl, uploadId } = await response.json();

      // Step 3: Upload to Mux with progress tracking
      const uploadTask = FileSystem.createUploadTask(
        uploadUrl,
        videoUri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
        (progress) => {
          const percentage = progress.totalBytesSent / progress.totalBytesExpectedToSend;
          setUploadProgress(Math.round(percentage * 100));
        }
      );

      await uploadTask.uploadAsync();

      setUploadId(uploadId);
      setUploading(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      {uploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
        </View>
      ) : uploadId ? (
        <Text style={styles.text}>
          Video uploaded! Processing...
        </Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={selectAndUploadVideo}>
          <Text style={styles.buttonText}>Select Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
```

### Upload from URL (for AI-Generated Videos)

This approach is ideal when videos are generated by AI services or already hosted elsewhere.

#### Architecture

```
User submits prompt -> Your Backend -> AI Service (Fal.ai, Runway, etc.)
                                            |
                                      AI returns video URL
                                            |
                      Your Backend -> Mux (create asset from URL)
                                            |
                                     Mux ingests & processes
                                            |
                      Webhook -> Your Backend (asset ready)
                                            |
                      Realtime DB -> React Native App
```

#### Create Asset from URL (Backend)

```javascript
// Backend: Node.js + Mux SDK
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// API endpoint: POST /api/create-video-from-url
export async function createVideoFromUrl(req, res) {
  const { videoUrl, userId, prompt } = req.body;

  try {
    // Create Mux asset from URL
    const asset = await mux.video.assets.create({
      input: [{ url: videoUrl }],
      playback_policies: ['public'],
      video_quality: "basic"
    });

    // Store in your database
    await db.videos.create({
      id: generateId(),
      userId,
      prompt,
      muxAssetId: asset.id,
      status: 'processing',
      createdAt: new Date(),
    });

    res.json({
      videoId: video.id,
      assetId: asset.id,
      status: 'processing',
    });
  } catch (error) {
    console.error('Failed to create asset:', error);
    res.status(500).json({ error: 'Failed to create video asset' });
  }
}
```

**Note:** The video URL must be publicly accessible. Mux will fetch the video file from that URL to ingest it.

#### Handle Asset Ready Webhook (Backend)

```javascript
// Backend: Webhook handler
const mux = new Mux();

// API endpoint: POST /api/webhooks/mux
export async function handleMuxWebhook(req, res) {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  const signature = req.headers['mux-signature'];

  // Verify webhook signature
  try {
    mux.webhooks.verifySignature(req.body, req.headers, webhookSecret);
  } catch (error) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  // Handle video.asset.ready
  if (event.type === 'video.asset.ready') {
    const { id, playback_ids, duration } = event.data;

    await db.videos.update({
      where: { muxAssetId: id },
      data: {
        status: 'ready',
        playbackId: playback_ids[0].id,
        duration,
      },
    });
  }

  // Handle video.asset.errored
  if (event.type === 'video.asset.errored') {
    const { id } = event.data;

    await db.videos.update({
      where: { muxAssetId: id },
      data: {
        status: 'failed',
        error: 'Video processing failed',
      },
    });
  }

  res.json({ received: true });
}
```

**Important:** Always verify webhook signatures to ensure requests are actually from Mux.

#### React Native Subscribes to Status Updates

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from './supabase'; // or Firebase, etc.
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoGenerationProps {
  videoId: string;
}

export default function VideoGeneration({ videoId }: VideoGenerationProps) {
  const [status, setStatus] = useState<'processing' | 'ready' | 'failed'>('processing');
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  const player = useVideoPlayer(
    playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
    (player) => {
      player.loop = false;
    }
  );

  useEffect(() => {
    // Subscribe to video status changes using Supabase Realtime
    const subscription = supabase
      .channel('video-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          const video = payload.new;
          setStatus(video.status);
          if (video.status === 'ready') {
            setPlaybackId(video.playback_id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [videoId]);

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Video generation failed. Please try again.
        </Text>
      </View>
    );
  }

  if (status === 'processing' || !playbackId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Generating your video...</Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
  },
});
```

### Upload Error Handling

#### Direct Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Network timeout | Slow/unstable connection | Implement retry logic, allow resumable uploads |
| 403 Forbidden | Upload URL expired (valid for 48 hours) | Request a new upload URL from your backend |
| Connection lost | User switched from WiFi to cellular | Cancel upload, show option to retry |
| File too large | Video exceeds Mux limits | Validate file size before upload, compress if needed |
| Out of storage | Device storage full | Check available storage before upload |

#### Enhanced Error Handling with Retry

```tsx
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';

interface UploadError {
  message: string;
  canRetry: boolean;
  shouldRequestNewUrl: boolean;
}

export function useVideoUploadWithRetry() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;

  const handleUploadError = (error: any): UploadError => {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('connection')) {
      return {
        message: 'Network error. Check your connection and try again.',
        canRetry: true,
        shouldRequestNewUrl: false,
      };
    }

    if (message.includes('timeout')) {
      return {
        message: 'Upload timed out. Try again or use a shorter video.',
        canRetry: true,
        shouldRequestNewUrl: false,
      };
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return {
        message: 'Upload URL expired. Requesting a new one...',
        canRetry: true,
        shouldRequestNewUrl: true,
      };
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return {
        message: 'Server error. Retrying...',
        canRetry: true,
        shouldRequestNewUrl: false,
      };
    }

    if (message.includes('400') || message.includes('413')) {
      return {
        message: 'Invalid video file or file too large.',
        canRetry: false,
        shouldRequestNewUrl: false,
      };
    }

    return {
      message: 'Upload failed. Please try again.',
      canRetry: true,
      shouldRequestNewUrl: false,
    };
  };

  const uploadVideoWithRetry = async (
    videoUri: string,
    getUploadUrl: () => Promise<{ uploadUrl: string; uploadId: string }>
  ): Promise<{ uploadId: string } | null> => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setRetryCount(0);

    let uploadUrl: string;
    let uploadId: string;

    try {
      const result = await getUploadUrl();
      uploadUrl = result.uploadUrl;
      uploadId = result.uploadId;
    } catch (err) {
      setError('Failed to get upload URL');
      setUploading(false);
      return null;
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        setRetryCount(attempt);

        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
          throw new Error('No network connection');
        }

        const uploadTask = FileSystem.createUploadTask(
          uploadUrl,
          videoUri,
          {
            httpMethod: 'PUT',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          },
          (progress) => {
            const percentage =
              progress.totalBytesSent / progress.totalBytesExpectedToSend;
            setUploadProgress(Math.round(percentage * 100));
          }
        );

        const uploadResponse = await uploadTask.uploadAsync();

        if (!uploadResponse || uploadResponse.status !== 200) {
          throw new Error(`Upload failed with status ${uploadResponse?.status}`);
        }

        setUploading(false);
        return { uploadId };
      } catch (err: any) {
        console.error(`Upload attempt ${attempt + 1} failed:`, err);

        const errorInfo = handleUploadError(err);
        setError(errorInfo.message);

        if (!errorInfo.canRetry || attempt === MAX_RETRIES - 1) {
          setUploading(false);
          setUploadProgress(0);
          return null;
        }

        if (errorInfo.shouldRequestNewUrl) {
          try {
            const result = await getUploadUrl();
            uploadUrl = result.uploadUrl;
            uploadId = result.uploadId;
          } catch {
            setError('Failed to get new upload URL');
            setUploading(false);
            setUploadProgress(0);
            return null;
          }
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setUploading(false);
    setUploadProgress(0);
    return null;
  };

  return { uploadVideoWithRetry, uploading, uploadProgress, error, retryCount };
}
```

Install `expo-network` to check connectivity: `npx expo install expo-network`

#### URL Upload Errors

Common issues when creating assets from URLs:

- **Invalid URL**: Ensure the URL is publicly accessible
- **Unsupported format**: Mux supports MP4, MOV, AVI, and more
- **File too large**: Check Mux's file size limits
- **URL expired**: Some AI services return temporary URLs

### Upload Best Practices

**For direct upload:**

1. Show upload progress using `FileSystem.createUploadTask`
2. Validate file size before uploading (e.g., max 5GB)
3. Handle retries for network issues
4. Consider client-side compression for large files

**For URL upload:**

1. Validate URLs are publicly accessible before sending to Mux
2. Handle temporary URLs that may expire quickly
3. Store original URL in case you need to re-ingest
4. Set timeouts for AI video generation (30-120 seconds)

**General:**

1. Use webhooks (more reliable than polling for asset status)
2. Store metadata (prompt, user ID, timestamps) in your database
3. Handle failures gracefully with clear error messages and retry options

---

## Live Streaming

Playing live streams in React Native is exactly the same as playing on-demand videos. If you can play a video, you can play a live stream.

### Overview

Mux Live Stream allows you to broadcast live video to viewers in real-time. Common use cases:

- Live events and conferences
- Live Q&A sessions
- Live shopping streams
- Gaming streams
- Real-time video interactions

**Architecture:**

```
Broadcaster (RTMP) -> Mux Live Stream -> HLS Playback -> React Native App
```

### Creating Live Streams (Backend)

```javascript
// Backend code (Node.js)
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Create live stream
app.post('/api/live-stream/create', async (req, res) => {
  const { userId, title } = req.body;

  const liveStream = await mux.video.liveStreams.create({
    playback_policy: ['public'], // or ['signed'] for private
    new_asset_settings: {
      playback_policy: ['public'], // Record stream as VOD
    },
    reconnect_window: 60, // Allow reconnection within 60 seconds
    reduced_latency: false, // Set true for low-latency streaming
  });

  // Save to database
  await db.liveStreams.create({
    id: liveStream.id,
    userId,
    title,
    streamKey: liveStream.stream_key,
    playbackId: liveStream.playback_ids[0].id,
    status: 'idle',
  });

  res.json({
    streamId: liveStream.id,
    streamKey: liveStream.stream_key, // Keep secret! Only share with broadcaster
    playbackId: liveStream.playback_ids[0].id,
    rtmpUrl: `rtmps://global-live.mux.com:443/app/${liveStream.stream_key}`,
  });
});
```

**Important:** Keep stream keys secret. Only share them with the broadcaster. Anyone with the stream key can broadcast to your live stream.

### Playing Live Streams

Playing a live stream is identical to playing a VOD video:

```tsx
import Video from 'react-native-video';

function LiveStreamPlayer({ playbackId }: Props) {
  const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  return (
    <Video
      source={{ uri: playbackUrl }}
      style={styles.video}
      controls={true}
      resizeMode="contain"
      streamType="live"
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
```

### Live Stream States

Live streams have different states that affect playback:

```tsx
import { useState, useEffect } from 'react';

type LiveStreamStatus = 'idle' | 'active' | 'disconnected';

function useLiveStreamStatus(streamId: string) {
  const [status, setStatus] = useState<LiveStreamStatus>('idle');

  useEffect(() => {
    const checkStatus = async () => {
      const response = await fetch(`${API_URL}/live-stream/${streamId}/status`);
      const { status } = await response.json();
      setStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [streamId]);

  return status;
}

function LiveStreamPlayer({ streamId, playbackId }: Props) {
  const status = useLiveStreamStatus(streamId);

  if (status === 'idle') {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Stream will start soon...</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status === 'disconnected') {
    return (
      <View style={styles.disconnectedContainer}>
        <Text style={styles.disconnectedText}>
          Stream temporarily disconnected. Reconnecting...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
        style={styles.video}
        streamType="live"
      />
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
```

**Backend endpoint to check status:**

```javascript
app.get('/api/live-stream/:streamId/status', async (req, res) => {
  const { streamId } = req.params;

  const liveStream = await mux.video.liveStreams.retrieve(streamId);

  res.json({
    status: liveStream.status, // 'idle', 'active', 'disconnected'
    isActive: liveStream.status === 'active',
  });
});
```

### Live Stream with Viewer Count

```tsx
import { useLiveViewers } from '../hooks/useVideoAnalytics';

function LiveStreamPlayer({ streamId, playbackId }: Props) {
  const liveViewers = useLiveViewers(playbackId);

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
        style={styles.video}
        streamType="live"
      />

      <View style={styles.topOverlay}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        <View style={styles.viewerCount}>
          <Text style={styles.viewerText}>
            {liveViewers.toLocaleString()} watching
          </Text>
        </View>
      </View>
    </View>
  );
}
```

### Low-Latency Streaming

For interactive use cases (live Q&A, auctions), enable low-latency mode:

```javascript
// Backend code - Create low-latency stream
const liveStream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  reduced_latency: true, // Enable low-latency mode (3-5s vs 10-15s)
});
```

```tsx
// React Native - Same playback code, lower latency automatically
<Video
  source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
  streamType="live"
/>
```

Low-latency streaming reduces latency from approximately 10-15 seconds to approximately 3-5 seconds. However, it may increase buffering on poor networks. Choose based on your use case.

### DVR Mode (Seeking in Live Streams)

Allow viewers to scrub backwards in live streams:

```tsx
function LiveStreamPlayer({ playbackId }: Props) {
  const videoRef = useRef<Video>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekableDuration, setSeekableDuration] = useState(0);

  return (
    <View>
      <Video
        ref={videoRef}
        source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
        streamType="live"
        onProgress={(data) => {
          setCurrentTime(data.currentTime);
          setSeekableDuration(data.seekableDuration);
        }}
      />

      <View style={styles.controls}>
        <Slider
          value={currentTime}
          maximumValue={seekableDuration}
          onSlidingComplete={(value) => {
            videoRef.current?.seek(value);
          }}
        />

        <TouchableOpacity
          onPress={() => {
            videoRef.current?.seek(seekableDuration);
          }}
        >
          <Text style={styles.liveButton}>Go to LIVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### Broadcasting from React Native

Broadcasting live video from React Native is more complex than playback. Options:

#### Option 1: Use External RTMP Apps (Recommended)

```tsx
import { Linking, Alert } from 'react-native';

function StartBroadcastButton({ rtmpUrl, streamKey }: Props) {
  const startBroadcast = () => {
    Alert.alert(
      'Start Broadcasting',
      'To broadcast, you need an RTMP streaming app.',
      [
        {
          text: 'Download Larix',
          onPress: () => {
            Linking.openURL('https://softvelum.com/larix/');
          },
        },
        {
          text: 'Copy Stream Info',
          onPress: () => {
            Clipboard.setString(`RTMP URL: ${rtmpUrl}\nStream Key: ${streamKey}`);
          },
        },
        { text: 'Cancel' },
      ]
    );
  };

  return (
    <Button title="Start Broadcasting" onPress={startBroadcast} />
  );
}
```

**Recommended RTMP apps:**

- **Larix Broadcaster** (iOS/Android) - Free, professional features
- **Streamlabs** (iOS/Android) - Gaming-focused, with overlays
- **OBS Mobile** (iOS) - Open source streaming

#### Option 2: WebRTC Broadcasting (Advanced)

For in-app broadcasting without external apps, use WebRTC:

```tsx
import { RTCView, mediaDevices } from 'react-native-webrtc';

function InAppBroadcaster({ streamId }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const startBroadcast = async () => {
    const stream = await mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: 1280,
        height: 720,
      },
      audio: true,
    });

    setLocalStream(stream);

    // Connect to Mux via WebRTC (requires custom implementation)
    // Note: Mux accepts RTMP/RTMPS input. To broadcast via WebRTC,
    // you need a media server (like Janus or Jitsi) that converts WebRTC to RTMP.
  };

  return (
    <View style={styles.container}>
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.preview}
        />
      )}
      <Button title="Start Broadcast" onPress={startBroadcast} />
    </View>
  );
}
```

**Note:** WebRTC broadcasting to Mux requires a media server bridge. Mux accepts RTMP/RTMPS input. To broadcast via WebRTC, you need a media server (like Janus or Jitsi) that converts WebRTC to RTMP. This is an advanced setup.

#### Option 3: Native Modules (Most Advanced)

Bridge native RTMP broadcasting libraries:

- **iOS**: Use libraries like `HaishinKit` or `LFLiveKit`
- **Android**: Use `rtmp-rtsp-stream-client-java`

This requires building React Native native modules.

### Live to VOD (Recording)

Mux automatically records live streams as VOD assets:

```javascript
// Backend - Create stream with recording enabled
const liveStream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: {
    playback_policy: ['public'],
  },
});

// After stream ends, check for created asset
app.post('/webhooks/mux', async (req, res) => {
  const event = req.body;

  if (event.type === 'video.live_stream.recording') {
    const assetId = event.data.asset_id;

    await db.videos.create({
      liveStreamId: event.data.id,
      muxAssetId: assetId,
      status: 'ready',
      type: 'vod',
    });
  }

  res.sendStatus(200);
});
```

```tsx
// React Native - Play recorded stream
function RecordedStream({ assetId }: Props) {
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/asset/${assetId}`)
      .then(r => r.json())
      .then(data => setPlaybackId(data.playbackId));
  }, [assetId]);

  if (!playbackId) {
    return <LoadingView />;
  }

  return (
    <Video
      source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
      controls
    />
  );
}
```

### Complete Live Stream Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Video from 'react-native-video';

interface LiveStreamProps {
  streamId: string;
  playbackId: string;
}

type StreamStatus = 'idle' | 'active' | 'disconnected';

export function LiveStreamPlayer({ streamId, playbackId }: LiveStreamProps) {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/live-stream/${streamId}/status`);
        const data = await response.json();
        setStatus(data.status);
      } catch (error) {
        console.error('Failed to fetch stream status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [streamId]);

  useEffect(() => {
    if (status !== 'active') return;

    const fetchViewers = async () => {
      try {
        const response = await fetch(`${API_URL}/live-stream/${streamId}/viewers`);
        const data = await response.json();
        setViewers(data.viewers);
      } catch (error) {
        console.error('Failed to fetch viewers:', error);
      }
    };

    fetchViewers();
    const interval = setInterval(fetchViewers, 10000);

    return () => clearInterval(interval);
  }, [streamId, status]);

  if (status === 'idle') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Stream will start soon...</Text>
      </View>
    );
  }

  if (status === 'disconnected') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>Stream temporarily disconnected</Text>
        <Text style={styles.subText}>Reconnecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
        style={styles.video}
        streamType="live"
        resizeMode="contain"
      />

      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {viewers > 0 && (
        <View style={styles.viewerCount}>
          <Text style={styles.viewerText}>
            {viewers.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  centerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  subText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  viewerCount: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### Live Streaming Best Practices

**For Playback:**

- Handle all stream states: idle, active, disconnected
- Show "LIVE" badge to make it clear this is live content
- Display viewer count for social proof
- Test on real devices (live streams require good network)
- Add buffering indicators (live streams may buffer more than VOD)

**For Broadcasting:**

- Recommend dedicated RTMP apps for better UX
- Keep stream keys secure (never expose in client code)
- Test network requirements (live upload needs stable upload bandwidth)
- Provide clear instructions (broadcasting is complex for users)
- Monitor stream health and alert broadcaster if connection is poor
