# React Native: Analytics, Best Practices, and Advanced Topics

Advanced topics for building production-ready React Native video applications with Mux, including analytics integration, async processing patterns, native SDK bridging, best practices, and troubleshooting.

## Mux Data Analytics Integration

Mux Data provides analytics for video playback, helping you understand video performance and user engagement.

### What Mux Data Tracks

Mux Data automatically collects:

- **Performance**: Video startup time, buffering events, playback failures
- **Engagement**: Play rate, watch time, viewer drop-off
- **Quality of Experience (QoE)**: Video quality scores, rebuffering ratio
- **Audience**: Unique viewers, concurrent viewers, geographic data

### Setup

1. Go to Settings -> Data Environments in the Mux dashboard
2. Create a new environment (e.g., "Production")
3. Copy the Environment Key for integration

Environment keys are public and safe to use in React Native code (unlike API tokens).

### Install the Mux Data SDK

```bash
npm install @mux/mux-data-react-native-video
```

### Wrap Your Video Component

```tsx
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Video } from 'react-native-video';
import muxReactNativeVideo from '@mux/mux-data-react-native-video';

// Create the wrapped video component
const MuxVideo = muxReactNativeVideo(Video);

interface MuxVideoPlayerProps {
  playbackId: string;
  videoId: string;
  videoTitle: string;
  userId?: string;
}

export default function MuxVideoPlayer({
  playbackId,
  videoId,
  videoTitle,
  userId,
}: MuxVideoPlayerProps) {
  return (
    <MuxVideo
      source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
      style={styles.video}
      controls
      resizeMode="contain"
      muxOptions={{
        application_name: Platform.OS === 'ios' ? 'MyApp iOS' : 'MyApp Android',
        application_version: '1.0.0',
        data: {
          env_key: 'YOUR_MUX_DATA_ENV_KEY',
          video_id: videoId,
          video_title: videoTitle,
          viewer_user_id: userId,
          player_name: 'React Native Video',
          player_version: '6.0.0',
        },
      }}
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

### Custom Metadata

Track custom metadata for segmentation and analysis:

```tsx
<MuxVideo
  source={{ uri: videoUrl }}
  muxOptions={{
    application_name: 'MyApp',
    application_version: '1.0.0',
    data: {
      env_key: process.env.MUX_DATA_ENV_KEY,

      // Video metadata
      video_id: videoId,
      video_title: videoTitle,
      video_series: 'AI Generated',
      video_duration: duration,

      // Viewer metadata
      viewer_user_id: userId,
      viewer_user_name: username,

      // Player metadata
      player_name: 'React Native Video',
      player_version: '6.0.0',

      // Custom metadata (use for filtering)
      custom_1: 'portrait',
      custom_2: aiModel,
      custom_3: category,
    },
  }}
/>
```

### Display View Counts

Proxy requests through your backend since API credentials should never be exposed in client code.

**Backend (Node.js):**

```javascript
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// GET /api/videos/:videoId/views
export async function getVideoViews(req, res) {
  const { videoId } = req.params;

  try {
    const response = await mux.data.metrics.breakdown('views', {
      filters: [`video_id:${videoId}`],
      timeframe: ['30:days'],
    });

    const viewCount = response.total_row_count || 0;
    res.json({ videoId, viewCount });
  } catch (error) {
    console.error('Failed to fetch view count:', error);
    res.status(500).json({ error: 'Failed to fetch views' });
  }
}
```

**React Native:**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ViewCount({ videoId }: { videoId: string }) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        const response = await fetch(
          `https://your-api.com/videos/${videoId}/views`
        );
        const data = await response.json();
        setViewCount(data.viewCount);
      } catch (error) {
        console.error('Failed to fetch view count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, [videoId]);

  if (loading || viewCount === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>
        {formatViewCount(viewCount)} views
      </Text>
    </View>
  );
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
```

### Display Real-time Viewers

**Backend:**

```javascript
// GET /api/videos/:playbackId/live-viewers
export async function getLiveViewers(req, res) {
  const { playbackId } = req.params;

  try {
    const token = Mux.JWT.signViewerCounts(playbackId, {
      keyId: process.env.MUX_SIGNING_KEY_ID,
      keySecret: process.env.MUX_SIGNING_PRIVATE_KEY,
      type: 'video',
    });

    const response = await fetch(`https://stats.mux.com/counts?token=${token}`);
    const data = await response.json();

    const liveViewers = data.data?.[0]?.views || 0;
    res.json({ playbackId, liveViewers });
  } catch (error) {
    console.error('Failed to fetch live viewers:', error);
    res.status(500).json({ error: 'Failed to fetch live viewers' });
  }
}
```

**React Native:**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function LiveViewers({
  playbackId,
  refreshInterval = 15000,
}: {
  playbackId: string;
  refreshInterval?: number;
}) {
  const [liveViewers, setLiveViewers] = useState<number>(0);

  useEffect(() => {
    const fetchLiveViewers = async () => {
      try {
        const response = await fetch(
          `https://your-api.com/videos/${playbackId}/live-viewers`
        );
        const data = await response.json();
        setLiveViewers(data.liveViewers);
      } catch (error) {
        console.error('Failed to fetch live viewers:', error);
      }
    };

    fetchLiveViewers();
    const interval = setInterval(fetchLiveViewers, refreshInterval);

    return () => clearInterval(interval);
  }, [playbackId, refreshInterval]);

  if (liveViewers === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {liveViewers} {liveViewers === 1 ? 'viewer' : 'viewers'} watching
      </Text>
    </View>
  );
}
```

Do not poll the real-time viewers endpoint more frequently than every 15-30 seconds.

### Custom Analytics Hook

```tsx
import { useEffect, useState } from 'react';

interface VideoAnalytics {
  viewCount: number;
  liveViewers: number;
  loading: boolean;
  error: string | null;
}

export function useVideoAnalytics(
  videoId: string,
  playbackId: string,
  options?: {
    enableLiveViewers?: boolean;
    refreshInterval?: number;
  }
): VideoAnalytics {
  const [viewCount, setViewCount] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enableLiveViewers = options?.enableLiveViewers ?? true;
  const refreshInterval = options?.refreshInterval ?? 30000;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const viewsResponse = await fetch(
          `https://your-api.com/videos/${videoId}/views`
        );
        const viewsData = await viewsResponse.json();
        setViewCount(viewsData.viewCount);

        if (enableLiveViewers) {
          const liveResponse = await fetch(
            `https://your-api.com/videos/${playbackId}/live-viewers`
          );
          const liveData = await liveResponse.json();
          setLiveViewers(liveData.liveViewers);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics');
        setLoading(false);
      }
    };

    fetchAnalytics();

    if (enableLiveViewers) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [videoId, playbackId, enableLiveViewers, refreshInterval]);

  return { viewCount, liveViewers, loading, error };
}
```

### Caching View Counts

Update view counts periodically via a scheduled job:

```javascript
// Backend: Scheduled job (runs every hour)
async function updateAllViewCounts() {
  const videos = await db.videos.findMany({
    where: { status: 'ready' },
  });

  for (const video of videos) {
    try {
      const response = await mux.data.metrics.breakdown('views', {
        filters: [`video_id:${video.id}`],
        timeframe: ['30:days'],
      });

      const viewCount = response.total_row_count || 0;

      await db.videos.update({
        where: { id: video.id },
        data: { viewCount, viewCountUpdatedAt: new Date() },
      });
    } catch (error) {
      console.error(`Failed to update views for ${video.id}:`, error);
    }

    // Rate limit: wait 250ms between requests (4 req/sec)
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
```

### Analytics Best Practices

1. **Always set custom metadata**: Include `video_id` and `viewer_user_id` for filtering
2. **Use consistent IDs**: Match IDs across your database and Mux
3. **Cache expensive queries**: View counts change slowly - cache for 5-15 minutes
4. **Rate limit awareness**: Data API has 5 requests/second max
5. **Monitor QoE scores**: 90-100 is excellent, 75-90 is good, below 75 needs investigation

---

## Async Video Processing Patterns

Video processing is asynchronous. After upload or ingestion, Mux needs time to transcode, generate thumbnails, and prepare for streaming.

### Asset States

| State | Meaning | Action |
|-------|---------|--------|
| `preparing` | Video is being processed | Show loading UI |
| `ready` | Video is ready to play | Display video player |
| `errored` | Processing failed | Show error message |

### Pattern Comparison

| Pattern | Best For | Pros | Cons |
|---------|----------|------|------|
| **Realtime Database** | Production apps | Instant updates, efficient | Requires realtime infrastructure |
| **Polling** | Simple apps, prototypes | Easy to implement | Server load, delayed updates |
| **Push Notifications** | Long processes (>60s) | Works when app backgrounded | Requires notification permissions |

### Pattern 1: Realtime Database (Recommended)

Architecture:
```
Mux -> Webhook -> Your Backend -> Database
                                     |
                              Realtime Update
                                     |
                            React Native App
```

**Backend Webhook Handler:**

```javascript
export async function handleMuxWebhook(req, res) {
  const event = req.body;

  if (event.type === 'video.asset.ready') {
    const { id, playback_ids, duration } = event.data;

    await db.videos.update({
      where: { muxAssetId: id },
      data: {
        status: 'ready',
        playbackId: playback_ids[0].id,
        duration,
        updatedAt: new Date(),
      },
    });
  }

  res.json({ received: true });
}
```

**React Native with Supabase:**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import { useVideoPlayer, VideoView } from 'expo-video';

interface Video {
  id: string;
  status: 'processing' | 'ready' | 'failed';
  playbackId: string | null;
  duration: number | null;
}

export default function VideoStatus({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (data) {
        setVideo(data);
        setLoading(false);
      }
    };

    fetchVideo();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`video-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          console.log('Video updated:', payload.new);
          setVideo(payload.new as Video);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [videoId]);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (video?.status === 'failed') {
    return <Text>Video processing failed. Please try again.</Text>;
  }

  if (video?.status === 'processing' || !video?.playbackId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Processing your video...</Text>
        <Text>This usually takes 30-60 seconds</Text>
      </View>
    );
  }

  return <VideoPlayer playbackId={video.playbackId} />;
}
```

**React Native with Firebase:**

```tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoStatus({ videoId }: { videoId: string }) {
  const [status, setStatus] = useState<'processing' | 'ready' | 'failed'>('processing');
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('videos')
      .doc(videoId)
      .onSnapshot((documentSnapshot) => {
        const data = documentSnapshot.data();
        if (data) {
          setStatus(data.status);
          if (data.status === 'ready') {
            setPlaybackId(data.playbackId);
          }
        }
      });

    return () => unsubscribe();
  }, [videoId]);

  if (status === 'processing' || !playbackId) {
    return <ActivityIndicator size="large" />;
  }

  return <VideoPlayer playbackId={playbackId} />;
}
```

### Pattern 2: Polling

Use polling for simpler apps, but it creates more server load.

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function VideoPoller({
  videoId,
  pollInterval = 3000,
}: {
  videoId: string;
  pollInterval?: number;
}) {
  const [status, setStatus] = useState<'processing' | 'ready' | 'failed'>('processing');
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 60; // Stop after 3 minutes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkVideoStatus = async () => {
      try {
        const response = await fetch(
          `https://your-api.com/videos/${videoId}/status`
        );
        const data = await response.json();

        if (data.status === 'ready') {
          setStatus('ready');
          setPlaybackId(data.playbackId);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else if (data.status === 'failed') {
          setStatus('failed');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          setAttempts((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Failed to check video status:', error);
      }
    };

    checkVideoStatus();

    intervalRef.current = setInterval(() => {
      if (attempts >= maxAttempts) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setStatus('failed');
      } else {
        checkVideoStatus();
      }
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId, attempts, pollInterval, maxAttempts]);

  if (status === 'failed') {
    return <Text>Video processing failed or timed out.</Text>;
  }

  if (status === 'processing' || !playbackId) {
    return (
      <View>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>
          Processing... ({Math.floor((attempts * pollInterval) / 1000)}s)
        </Text>
      </View>
    );
  }

  return <VideoPlayer playbackId={playbackId} />;
}
```

**Polling Best Practices:**

1. Set a maximum number of attempts
2. Use reasonable intervals (3-5 seconds)
3. Stop polling when done
4. Handle errors gracefully
5. Show elapsed time to users

### Pattern 3: Push Notifications

For longer processing times (30-120 seconds), use push notifications.

**Setup Expo Notifications:**

```bash
npx expo install expo-notifications expo-device expo-constants
```

**Request Permissions:**

```tsx
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}
```

**Backend: Send Notification:**

```javascript
async function notifyUserVideoReady(userId, videoId, playbackId) {
  const user = await db.users.findUnique({ where: { id: userId } });

  if (user.pushToken) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.pushToken,
        title: 'Your video is ready!',
        body: 'Tap to watch your video',
        data: { videoId, playbackId },
      }),
    });
  }
}
```

**Handle Notification Tap:**

```tsx
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

export function useNotificationHandler() {
  const navigation = useNavigation();
  const responseListener = useRef<any>();

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { videoId } = response.notification.request.content.data;
        navigation.navigate('Video', { videoId });
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [navigation]);
}
```

### Async Processing Best Practices

1. Always clean up subscriptions to prevent memory leaks
2. Show meaningful progress (elapsed time, estimated time remaining)
3. Handle edge cases (user navigates away)
4. Set timeouts (max 3-5 minutes)
5. Provide feedback (loading states, success animations, error messages)
6. Allow cancellation for long operations
7. Test on slow networks

---

## Performance Optimization

### Video Preloading

Preload the next video's metadata without downloading the entire video:

```tsx
import { useEffect, useRef } from 'react';
import Video from 'react-native-video';

function PreloadManager({ videos, currentIndex }: Props) {
  const nextVideoRef = useRef<Video>(null);

  return (
    <>
      <Video
        source={{ uri: videos[currentIndex].playbackUrl }}
        style={styles.video}
      />

      {currentIndex + 1 < videos.length && (
        <Video
          ref={nextVideoRef}
          source={{ uri: videos[currentIndex + 1].playbackUrl }}
          style={{ display: 'none' }}
          paused={true}
          playInBackground={false}
        />
      )}
    </>
  );
}
```

Do not preload more than 1-2 videos at a time. HLS handles adaptive bitrate streaming automatically.

### Memory Management in FlatLists

```tsx
import { FlatList, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

<FlatList
  data={videos}
  renderItem={({ item, index }) => (
    <VideoItem
      video={item}
      isVisible={index === currentIndex}
    />
  )}
  windowSize={3}
  maxToRenderPerBatch={2}
  removeClippedSubviews={true}
  initialNumToRender={1}
  getItemLayout={(data, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  })}
  keyExtractor={(item) => item.id}
/>
```

### Avoiding Re-renders

Use React.memo for video items in lists:

```tsx
import React, { memo } from 'react';

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  onLike: (videoId: string) => void;
}

const VideoItem = memo(({ video, isActive, onLike }: VideoItemProps) => {
  return (
    <Video
      source={{ uri: video.playbackUrl }}
      paused={!isActive}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.isActive === nextProps.isActive
  );
});
```

### Cleanup Video References

```tsx
import { useRef, useEffect } from 'react';

function VideoPlayer({ videoUrl, paused }: Props) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current = null;
      }
    };
  }, []);

  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUrl }}
      paused={paused}
    />
  );
}
```

### Network Detection

Adapt video quality or warn users on cellular:

```tsx
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

function useNetworkType() {
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return networkType;
}
```

### Pause Videos When App Backgrounds

```tsx
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, []);

  return appState;
}

function VideoPlayer({ videoUrl }: Props) {
  const appState = useAppState();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (appState === 'background' || appState === 'inactive') {
      setPaused(true);
    }
  }, [appState]);

  return <Video source={{ uri: videoUrl }} paused={paused} />;
}
```

---

## Error Handling

### Retry Logic with Exponential Backoff

```tsx
import { useState, useEffect } from 'react';

function useVideoWithRetry(videoUrl: string, maxRetries = 3) {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(videoUrl);

  const handleError = (err: any) => {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentUrl(`${videoUrl}?retry=${retryCount + 1}`);
      }, delay);
    } else {
      setError('Failed to load video after multiple attempts');
    }
  };

  return { currentUrl, error, handleError, retryCount };
}

function VideoPlayer({ videoUrl }: Props) {
  const { currentUrl, error, handleError, retryCount } = useVideoWithRetry(videoUrl);

  if (error) {
    return <ErrorView message={error} />;
  }

  return (
    <>
      <Video source={{ uri: currentUrl }} onError={handleError} />
      {retryCount > 0 && (
        <Text>Retrying... ({retryCount}/3)</Text>
      )}
    </>
  );
}
```

### Fallback UI for Errors

```tsx
function ErrorView({ message, onRetry }: Props) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Unable to play video</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Tap to retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Logging Errors

```tsx
import { Platform } from 'react-native';

function VideoPlayer({ video }: Props) {
  const handleError = (error: any) => {
    console.error('Video playback error:', {
      videoId: video.id,
      playbackId: video.playbackId,
      platform: Platform.OS,
      error: error.error,
      timestamp: new Date().toISOString(),
    });

    setError('Unable to play video');
  };

  return (
    <Video source={{ uri: video.playbackUrl }} onError={handleError} />
  );
}
```

---

## Security Best Practices

### Use Signed URLs for Private Content

Never expose private videos with public playback IDs:

```javascript
// Backend: Generate signed URL
import Mux from '@mux/mux-node';

function generateSignedUrl(playbackId: string, userId: string) {
  const token = Mux.JWT.signPlaybackId(playbackId, {
    keyId: process.env.MUX_SIGNING_KEY_ID!,
    keySecret: process.env.MUX_SIGNING_KEY_SECRET!,
    expiration: '1h',
    params: {
      aud: userId,
    },
  });

  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}
```

```tsx
// React Native: Use signed URL
<Video source={{ uri: signedUrl }} />
```

### Never Expose API Keys in Client Code

All Mux API calls must go through your backend:

```tsx
// NEVER DO THIS
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: 'YOUR_TOKEN_ID',     // NEVER in client code!
  tokenSecret: 'YOUR_TOKEN_SECRET',
});

// DO THIS INSTEAD
async function createUploadUrl() {
  const response = await fetch('https://your-api.com/generate-upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAuthToken}`,
    },
  });
  return response.json();
}
```

---

## Accessibility

### Captions and Subtitles

```tsx
<Video
  source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
  textTracks={[
    {
      title: 'English Subtitles',
      language: 'en',
      type: 'text/vtt',
      uri: `https://stream.mux.com/${playbackId}/text/en.vtt`,
    },
  ]}
  selectedTextTrack={{ type: 'title', value: 'English Subtitles' }}
/>
```

### Screen Reader Support

```tsx
<View accessible={true} accessibilityLabel={`Video by ${username}: ${title}`}>
  <Video
    source={{ uri: videoUrl }}
    accessible={true}
    accessibilityLabel="Video player"
    accessibilityHint="Double tap to play or pause"
  />
  <Text accessibilityRole="text">{title}</Text>
</View>
```

---

## Native SDK Bridging

Consider native Mux SDKs only when you need advanced features not available in JavaScript solutions.

### When to Use Native SDKs

- DRM (Digital Rights Management) - FairPlay (iOS) and Widevine (Android)
- Picture-in-picture support
- Background playback
- Offline playback with DRM
- AirPlay (iOS) / Chromecast (Android)
- Maximum performance for video-heavy apps

### When NOT to Use Native SDKs

- Your JavaScript solution works fine
- You do not need DRM
- You want to avoid native development complexity
- Your team lacks iOS/Android experience
- You want easier maintenance

95% of React Native video apps work great with react-native-video. Only invest in native bridging if you have specific requirements.

### Available Native SDKs

**Mux Player iOS:**
- GitHub: github.com/muxinc/mux-player-ios
- Installation: `pod 'MuxPlayerSwift', '~> 2.0'`

**Mux Player Android:**
- GitHub: github.com/muxinc/mux-player-android
- Installation: `implementation 'com.mux:stats-muxplayer:1.0.0'`

### Example iOS Bridge

```swift
// ios/MuxPlayerModule.swift
import Foundation
import MuxPlayerSwift
import React

@objc(MuxPlayerModule)
class MuxPlayerModule: RCTEventEmitter {
  var player: MuxPlayer?

  @objc
  func initializePlayer(
    _ playbackId: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let playerView = MuxPlayerView()
      playerView.playbackId = playbackId
      self.player = playerView.player
      self.setupPlayerListeners()
      resolver(["success": true])
    }
  }

  @objc
  func play(
    _ resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    player?.play()
    resolver(["playing": true])
  }

  @objc
  func pause(
    _ resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    player?.pause()
    resolver(["playing": false])
  }

  override func supportedEvents() -> [String]! {
    return ["onVideoEnd", "onProgress", "onError"]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

### Decision Framework

```
Do you need DRM?
  Yes -> Consider native bridging
  No -> Do you need advanced features (PiP, AirPlay, Chromecast)?
    Yes -> Consider native bridging
    No -> Do you have performance issues with react-native-video?
      Yes -> Try optimization first, then consider native
      No -> Stick with react-native-video
```

---

## Troubleshooting

### Video Will Not Play

**Solutions:**

1. Check if asset is ready:
   ```tsx
   if (video.status !== 'ready') {
     return <LoadingView />;
   }
   ```

2. Verify playback ID is correct:
   ```tsx
   const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;
   console.log('Playing:', playbackUrl);
   ```

3. Check network connectivity:
   ```tsx
   import NetInfo from '@react-native-community/netinfo';

   NetInfo.fetch().then(state => {
     console.log('Connection type:', state.type);
     console.log('Is connected?', state.isConnected);
   });
   ```

4. Test on real device - the Android Emulator frequently has issues with HLS video playback

### Playback Errors

**Invalid playback ID:**
Check Mux Dashboard to verify asset exists.

**Asset not ready yet:**
```tsx
if (video.status === 'preparing') {
  return (
    <View>
      <ActivityIndicator />
      <Text>Video is processing...</Text>
    </View>
  );
}
```

**Signed URL expired:**
```tsx
const isTokenExpired = (url: string) => {
  const params = new URLSearchParams(url.split('?')[1]);
  const exp = params.get('exp');
  if (exp) {
    return Date.now() / 1000 > parseInt(exp);
  }
  return false;
};

if (isTokenExpired(signedUrl)) {
  const newUrl = await fetchNewSignedUrl(playbackId);
  setVideoUrl(newUrl);
}
```

### Upload Failures

**File size too large:**
```tsx
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB recommended for mobile

const validateFileSize = async (uri: string) => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (fileInfo.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 500MB limit');
  }
};
```

**Network interruption - implement retry:**
```tsx
const uploadWithRetry = async (uploadUrl: string, fileUri: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (result.status === 200) {
        return result;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

**Upload URL expired:**
Direct upload URLs expire after 48 hours. Always generate fresh URLs right before uploading.

### Performance Issues

1. Reduce `windowSize` in FlatList
2. Use `React.memo` for VideoItem components
3. Check for memory leaks with React DevTools
4. Profile with Xcode Instruments (iOS) or Android Profiler

### Platform-Specific Issues

**iOS Simulator vs Device:**
- Videos may behave differently; always test on real iOS devices
- Simulator performance is not representative of device performance

**Android Codec Support:**
- Different manufacturers have different codec support
- Mux automatically encodes videos in multiple formats for compatibility

**Expo Go Limitations:**
- Basic video playback works fine
- Advanced features (background video, PiP) require Expo dev client:
  ```bash
  npx expo install expo-dev-client
  npx expo run:ios
  npx expo run:android
  ```

---

## API Reference Quick Reference

### Common Architecture Pattern

```
React Native App <-> Your Backend <-> Mux API
```

All API calls must go through your backend. Never expose Mux API credentials in client code.

### Create Asset from URL

```javascript
// Backend
const asset = await mux.video.assets.create({
  input: [{ url: videoUrl }],
  playback_policy: ['public'],
  mp4_support: 'standard',
});
```

### Create Direct Upload URL

```javascript
// Backend
const upload = await mux.video.uploads.create({
  cors_origin: '*',
  new_asset_settings: {
    playback_policy: ['public'],
  },
});
```

### Get Playback URL

```tsx
// Public playback
const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

// Signed playback (from backend)
const token = Mux.JWT.signPlaybackId(playbackId, {
  keyId: process.env.MUX_SIGNING_KEY_ID,
  keySecret: process.env.MUX_SIGNING_KEY_SECRET,
  expiration: '7d',
});
const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
```

### Get Thumbnail URL

```tsx
// Basic thumbnail
const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

// With options
const thumbnailWithOptions = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&time=5`;
```

Parameters: `width`, `height`, `time` (seconds), `fit_mode` (smartcrop, preserve, crop)

### Common Webhook Events

- `video.asset.ready` - Asset is ready for playback
- `video.asset.errored` - Asset processing failed
- `video.asset.created` - New asset created
- `video.asset.deleted` - Asset deleted
- `video.upload.asset_created` - Direct upload completed
- `video.upload.cancelled` - Direct upload cancelled
- `video.upload.errored` - Direct upload failed

### Rate Limits

- General API: 100 requests per second per account
- Data API: 5 requests per second

Implement exponential backoff for rate limit errors:

```javascript
async function muxApiCallWithRetry(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Production Checklist

### Performance
- [ ] Videos play smoothly on 3G networks
- [ ] FlatList handles 100+ videos without memory issues
- [ ] App does not drain battery excessively
- [ ] Videos pause when app backgrounds
- [ ] No memory leaks in video components

### Error Handling
- [ ] Network failures show clear error messages
- [ ] Retry logic works for transient failures
- [ ] Invalid playback IDs handled gracefully
- [ ] Errors logged to tracking service

### Accessibility
- [ ] Captions available for videos
- [ ] Screen reader support for video controls
- [ ] Proper labels on interactive elements

### Security
- [ ] No API keys in client code
- [ ] Private videos use signed playback IDs
- [ ] Signed URLs have appropriate expiration times
- [ ] User authentication checked before video access

### Testing
- [ ] Tested on iOS (multiple screen sizes)
- [ ] Tested on Android (multiple manufacturers)
- [ ] Tested on slow networks
- [ ] Tested error scenarios
- [ ] Tested with screen reader

### Analytics
- [ ] Mux Data integrated for all videos
- [ ] Custom metadata includes user_id, video_id
- [ ] Dashboard metrics reviewed regularly
