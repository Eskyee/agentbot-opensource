# Building a Stories/Reels Video App

Complete walkthrough of building an Instagram Stories or TikTok-style vertical video app with React Native and Mux, featuring AI video generation, Stories-style playback, and engagement features.

## Overview

This guide walks through building **Slop Social**, a complete reference implementation that demonstrates building a social video app where users can:

1. Generate videos using AI prompts
2. Upload videos from their device
3. Browse videos in a Stories-style vertical feed
4. See engagement metrics (views, likes)
5. Interact with videos (like, comment, share)

## Architecture

```
+-------------------+
|   React Native    |
|    (Expo App)     |
+---------+---------+
          |
          +-- Video Playback ----------> Mux Stream (stream.mux.com)
          |
          +-- API Requests -------------> Backend (Supabase Edge Functions)
          |                                   |
          |                                   +-- Mux API (create assets, uploads)
          |                                   +-- AI Service (Fal.ai)
          |                                   +-- Webhooks (video.asset.ready)
          |
          +-- Realtime Updates ---------> Supabase Realtime DB
```

### Tech Stack

**Frontend:**
- React Native (Expo)
- TypeScript
- react-native-video (playback)
- @mux/mux-data-react-native-video (analytics)
- react-native-gesture-handler (interactions)
- react-native-reanimated (animations)

**Backend:**
- Supabase (database, auth, realtime, edge functions)
- Node.js (edge functions runtime)

**Video:**
- Mux (video hosting, streaming, analytics)
- Fal.ai (AI video generation)

## Project Structure

```
slop-social/
├── src/
│   ├── screens/
│   │   ├── StoriesFeed.tsx          # Main feed (vertical swipe)
│   │   ├── GenerateScreen.tsx       # AI video generation
│   │   ├── UploadScreen.tsx         # Upload from device
│   │   └── ProfileScreen.tsx        # User profile & videos
│   ├── components/
│   │   ├── StoryItem.tsx            # Individual video item
│   │   ├── VideoOverlay.tsx         # UI overlay (likes, comments)
│   │   ├── VideoPlayer.tsx          # Reusable video player
│   │   ├── VideoStats.tsx           # View counts, analytics
│   │   └── LikeAnimation.tsx        # Like animation effect
│   ├── hooks/
│   │   ├── useAIVideoGeneration.ts  # AI generation flow
│   │   ├── useVideoStatus.ts        # Realtime status updates
│   │   ├── useVideoAnalytics.ts     # Mux Data integration
│   │   └── useVideoUpload.ts        # Direct upload flow
│   └── lib/
│       ├── supabase.ts              # Supabase client
│       └── api.ts                   # API client
├── supabase/
│   ├── functions/
│   │   ├── generate-video/          # AI video generation
│   │   ├── ingest-video/            # Upload to Mux
│   │   ├── webhooks/                # Mux webhook handler
│   │   └── analytics/               # View counts API
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
├── App.tsx                          # Root component
├── app.json                         # Expo config
└── package.json
```

---

## Building the Stories Feed UI

The Stories UI is the core feature - an Instagram Stories-style vertical video feed with full-screen videos, swipe navigation, and gesture controls.

### Step 1: Configure FlatList for Full-Screen Paging

The foundation is a FlatList configured for vertical paging:

```tsx
import React, { useRef, useState, useCallback } from 'react';
import {
  FlatList,
  Dimensions,
  StyleSheet,
  ViewToken,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Video {
  id: string;
  playbackId: string;
  title: string;
  username: string;
  userId: string;
  viewCount: number;
  likeCount: number;
}

interface StoriesFeedProps {
  videos: Video[];
}

export default function StoriesFeed({ videos }: StoriesFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== null) {
          setCurrentIndex(index);
        }
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      renderItem={({ item, index }) => (
        <StoryItem
          video={item}
          isActive={index === currentIndex}
        />
      )}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={(data, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
      })}
      windowSize={3}
      maxToRenderPerBatch={2}
      removeClippedSubviews
    />
  );
}
```

### Key FlatList Props

| Prop | Purpose |
|------|---------|
| `pagingEnabled` | Snaps to full screens |
| `snapToInterval={SCREEN_HEIGHT}` | Ensures exact screen alignment |
| `snapToAlignment="start"` | Aligns to top of screen |
| `decelerationRate="fast"` | Quick snap to next video |
| `windowSize={3}` | Renders 3 items (prev, current, next) |
| `getItemLayout` | Optimizes scroll performance |
| `removeClippedSubviews` | Unmounts off-screen items (memory optimization) |

### Step 2: Build the StoryItem Component

Each story item is a full-screen video with controls:

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import muxReactNativeVideo from '@mux/mux-data-react-native-video';

const MuxVideo = muxReactNativeVideo(Video);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryItemProps {
  video: Video;
  isActive: boolean;
}

export function StoryItem({ video, isActive }: StoryItemProps) {
  const videoRef = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(!isActive);
  const [liked, setLiked] = useState(false);

  // Auto-play when active, pause when not
  useEffect(() => {
    setPaused(!isActive);
  }, [isActive]);

  // Single tap: pause/play
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      setPaused((prev) => !prev);
    });

  // Double tap: like
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      setLiked(true);
      // TODO: Call API to like video
    });

  const taps = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={taps}>
        <View style={styles.videoContainer}>
          <MuxVideo
            ref={videoRef}
            source={{ uri: `https://stream.mux.com/${video.playbackId}.m3u8` }}
            poster={`https://image.mux.com/${video.playbackId}/thumbnail.png?time=0`}
            posterResizeMode="cover"
            style={styles.video}
            paused={paused}
            repeat={true}
            resizeMode="cover"
            muxOptions={{
              application_name: 'Slop Social',
              data: {
                env_key: MUX_DATA_ENV_KEY,
                video_id: video.id,
                video_title: video.title,
                viewer_user_id: currentUserId,
              },
            }}
            onError={(error) => console.error('Video error:', error)}
          />

          {/* Overlay UI */}
          <VideoOverlay
            username={video.username}
            title={video.title}
            viewCount={video.viewCount}
            likeCount={video.likeCount}
            liked={liked}
            onLike={() => setLiked(!liked)}
          />

          {/* Like animation (shown on double-tap) */}
          {liked && <LikeAnimation />}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
```

### Step 3: Create the Video Overlay

The overlay displays video metadata and action buttons:

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoOverlayProps {
  username: string;
  title: string;
  viewCount: number;
  likeCount: number;
  liked: boolean;
  onLike: () => void;
}

export function VideoOverlay({
  username,
  title,
  viewCount,
  likeCount,
  liked,
  onLike,
}: VideoOverlayProps) {
  return (
    <>
      {/* Top gradient for better text readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
      />

      {/* Bottom gradient and content */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      >
        <View style={styles.bottomContent}>
          {/* Left side: User info and caption */}
          <View style={styles.leftContent}>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.views}>
              {formatNumber(viewCount)} views
            </Text>
          </View>

          {/* Right side: Actions */}
          <View style={styles.rightContent}>
            <ActionButton
              icon={liked ? 'heart-filled' : 'heart'}
              label={formatNumber(likeCount)}
              onPress={onLike}
            />
            <ActionButton
              icon="comment"
              label="Comment"
              onPress={() => {/* TODO */}}
            />
            <ActionButton
              icon="share"
              label="Share"
              onPress={() => {/* TODO */}}
            />
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

const styles = StyleSheet.create({
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    zIndex: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftContent: {
    flex: 1,
    marginRight: 20,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  views: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  rightContent: {
    alignItems: 'center',
    gap: 20,
  },
});
```

### Step 4: Add Like Animation

Show a heart animation when users double-tap:

```tsx
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

export function LikeAnimation({ onComplete }: { onComplete?: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 10 }),
      withSpring(0, { damping: 10 }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    opacity.value = withSequence(
      withSpring(1),
      withSpring(1),
      withSpring(0)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.Text style={styles.heart}>heart</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    zIndex: 10,
  },
  heart: {
    fontSize: 100,
  },
});
```

### Step 5: Add Progress Indicator

Show progress at the top (like Instagram Stories):

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressIndicatorProps {
  duration: number;
  paused: boolean;
}

export function ProgressIndicator({ duration, paused }: ProgressIndicatorProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!paused) {
      progress.value = withTiming(1, {
        duration: duration * 1000,
        easing: Easing.linear,
      });
    }
  }, [paused, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progress, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  progress: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
```

### Step 6: Preload Adjacent Videos

Preload the next video for seamless transitions:

```tsx
import { useEffect } from 'react';
import Video from 'react-native-video';

interface PreloadManagerProps {
  videos: Video[];
  currentIndex: number;
}

export function PreloadManager({ videos, currentIndex }: PreloadManagerProps) {
  useEffect(() => {
    // Preload next video
    const nextIndex = currentIndex + 1;
    if (nextIndex < videos.length) {
      const nextVideo = videos[nextIndex];
      Video.preload(`https://stream.mux.com/${nextVideo.playbackId}.m3u8`);
    }

    // Optionally preload previous video
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevVideo = videos[prevIndex];
      Video.preload(`https://stream.mux.com/${prevVideo.playbackId}.m3u8`);
    }
  }, [currentIndex, videos]);

  return null;
}
```

HLS streaming means videos do not need to fully download before playing. Preloading just fetches the manifest and initial segments for instant startup.

---

## Video Upload Methods

There are two primary ways to get videos into Mux from a React Native application:

| Method | Use Case | React Native Role | Backend Required | User Experience |
|--------|----------|-------------------|------------------|-----------------|
| **Direct Upload** | User-generated content (camera, library) | High - handles file upload | Yes - generates upload URL | Shows upload progress |
| **Upload from URL** | AI-generated videos, pre-hosted content | Low - just displays result | Yes - creates asset | Background process |

### Direct Upload from Device

Direct uploads allow users to upload videos directly from their React Native app to Mux without the file touching your backend servers.

**Architecture:**
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
      cors_origin: '*',
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

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = async (videoUri: string) => {
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
      return null;
    }
  };

  return { uploadVideo, uploading, uploadProgress, error };
}
```

### Upload from URL (for AI-Generated Videos)

This approach is ideal when videos are generated by AI services or already hosted elsewhere. The video never touches the React Native app - your backend handles everything.

**Architecture:**
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

#### Backend: Create Asset from URL

```javascript
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

The video URL must be publicly accessible. Mux will fetch the video file from that URL to ingest it.

---

## AI Video Generation Workflow

Complete workflow for generating videos with AI:

### React Native Hook

```tsx
import { useState } from 'react';

export function useAIVideoGeneration() {
  const [status, setStatus] = useState<'idle' | 'generating' | 'uploading' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async (prompt: string) => {
    try {
      // Step 1: Call AI service
      setStatus('generating');
      const response = await fetch(`${API_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const { videoUrl, videoId } = await response.json();

      // Step 2: Backend uploads to Mux
      setStatus('uploading');
      await fetch(`${API_URL}/ingest-video`, {
        method: 'POST',
        body: JSON.stringify({ videoUrl, videoId }),
      });

      // Step 3: Listen for processing completion
      setStatus('processing');
      await waitForVideoReady(videoId);

      setStatus('ready');
      return videoId;

    } catch (err) {
      setError(err.message);
      setStatus('idle');
      throw err;
    }
  };

  return { generateVideo, status, progress, error };
}
```

### Backend Edge Functions

**Generate Video (Supabase Edge Function):**

```typescript
// supabase/functions/generate-video/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { prompt, userId } = await req.json();

  // Call AI service (Fal.ai)
  const response = await fetch('https://fal.run/fal-ai/video-gen', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${Deno.env.get('FAL_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const { video_url } = await response.json();

  return new Response(
    JSON.stringify({ videoUrl: video_url }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Ingest Video (Upload to Mux):**

```typescript
// supabase/functions/ingest-video/index.ts
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: Deno.env.get('MUX_TOKEN_ID')!,
  tokenSecret: Deno.env.get('MUX_TOKEN_SECRET')!,
});

serve(async (req) => {
  const { videoUrl, videoId } = await req.json();

  const asset = await mux.video.assets.create({
    input: [{ url: videoUrl }],
    playback_policy: ['public'],
  });

  // Save to database
  await supabase.from('videos').insert({
    id: videoId,
    mux_asset_id: asset.id,
    status: 'preparing',
  });

  return new Response(JSON.stringify({ assetId: asset.id }));
});
```

**Handle Mux Webhooks:**

```typescript
// supabase/functions/webhooks/index.ts
import Mux from '@mux/mux-node';

serve(async (req) => {
  const signature = req.headers.get('mux-signature');
  const body = await req.text();

  // Verify webhook
  Mux.Webhooks.verifyHeader(
    body,
    signature,
    Deno.env.get('MUX_WEBHOOK_SECRET')!
  );

  const event = JSON.parse(body);

  if (event.type === 'video.asset.ready') {
    const asset = event.data;

    await supabase
      .from('videos')
      .update({
        status: 'ready',
        playback_id: asset.playback_ids[0].id,
        duration: asset.duration,
      })
      .eq('mux_asset_id', asset.id);
  }

  return new Response('OK');
});
```

---

## Realtime Status Updates

Listen for video processing updates via Supabase Realtime:

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useVideoStatus(videoId: string) {
  const [video, setVideo] = useState<Video | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchVideo = async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      setVideo(data);
      setIsReady(data.status === 'ready');
    };

    fetchVideo();

    // Subscribe to changes
    const subscription = supabase
      .channel(`video-${videoId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'videos',
        filter: `id=eq.${videoId}`,
      }, (payload) => {
        const updatedVideo = payload.new as Video;
        setVideo(updatedVideo);
        setIsReady(updatedVideo.status === 'ready');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [videoId]);

  return { video, isReady };
}
```

---

## View Analytics

Display engagement metrics using Mux Data:

```tsx
import { useVideoAnalytics } from '../hooks/useVideoAnalytics';

export function VideoStats({ videoId }: Props) {
  const { views, liveViewers } = useVideoAnalytics(videoId);

  return (
    <View style={styles.stats}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>
          {views.toLocaleString()} views
        </Text>
      </View>

      {liveViewers > 0 && (
        <View style={styles.stat}>
          <View style={styles.liveDot} />
          <Text style={styles.statValue}>
            {liveViewers} watching now
          </Text>
        </View>
      )}
    </View>
  );
}

// Custom hook
function useVideoAnalytics(videoId: string) {
  const [views, setViews] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);

  useEffect(() => {
    // Fetch total views
    fetch(`${API_URL}/video/${videoId}/views`)
      .then(r => r.json())
      .then(data => setViews(data.views));

    // Poll for live viewers
    const interval = setInterval(async () => {
      const response = await fetch(`${API_URL}/video/${videoId}/live-viewers`);
      const data = await response.json();
      setLiveViewers(data.liveViewers);
    }, 10000);

    return () => clearInterval(interval);
  }, [videoId]);

  return { views, liveViewers };
}
```

---

## Database Schema

```sql
-- Videos table
create table videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  mux_asset_id text unique,
  playback_id text,
  status text check (status in ('preparing', 'ready', 'errored')),
  title text,
  prompt text,
  duration float,
  aspect_ratio text,
  thumbnail_url text,
  view_count integer default 0,
  like_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Likes table
create table likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  video_id uuid references videos(id),
  created_at timestamp with time zone default now(),
  unique(user_id, video_id)
);

-- Realtime setup
alter publication supabase_realtime add table videos;
```

---

## Error Handling

### Direct Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Network timeout | Slow/unstable connection | Implement retry logic, allow resumable uploads |
| 403 Forbidden | Upload URL expired (valid for 48 hours) | Request a new upload URL from your backend |
| Connection lost | User switched from WiFi to cellular | Cancel upload, show option to retry |
| File too large | Video exceeds Mux limits | Validate file size before upload, compress if needed |
| Out of storage | Device storage full | Check available storage before upload |

### Enhanced Error Handling with Retry

```tsx
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';

export function useVideoUploadWithRetry() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;

  const uploadVideoWithRetry = async (
    videoUri: string,
    getUploadUrl: () => Promise<{ uploadUrl: string; uploadId: string }>
  ) => {
    setUploading(true);
    setUploadProgress(0);

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

        // Check network connectivity
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

        if (attempt === MAX_RETRIES - 1) {
          setUploading(false);
          setError('Upload failed after multiple attempts');
          return null;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return null;
  };

  return { uploadVideoWithRetry, uploading, uploadProgress, error, retryCount };
}
```

---

## Performance Optimization

### Memory Management

```tsx
// Clean up videos when they're far from view
const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set([0]));

const onViewableItemsChanged = useCallback(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIndices = viewableItems.map(item => item.index).filter(Boolean);

    // Load current + adjacent
    const indicesToLoad = new Set([
      ...visibleIndices,
      ...visibleIndices.map(i => i - 1),
      ...visibleIndices.map(i => i + 1),
    ].filter(i => i >= 0 && i < videos.length));

    setLoadedVideos(indicesToLoad);
  },
  [videos.length]
);

// In renderItem:
if (!loadedVideos.has(index)) {
  return <VideoPlaceholder />;
}
```

### Use React.memo

```tsx
const StoryItem = React.memo(
  ({ video, isActive }: StoryItemProps) => {
    // ... component code
  },
  (prevProps, nextProps) => {
    return (
      prevProps.video.id === nextProps.video.id &&
      prevProps.isActive === nextProps.isActive
    );
  }
);
```

### Pause on App Background

```tsx
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState !== 'active') {
      setPaused(true);
    }
  });

  return () => subscription.remove();
}, []);
```

---

## Environment Setup

### Environment Variables

Create `.env` file:

```bash
# Mux (Dashboard -> Settings -> API Access Tokens)
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_KEY_SECRET=your_signing_key_secret
MUX_WEBHOOK_SECRET=your_webhook_secret

# Mux Data (Dashboard -> Settings -> Data)
EXPO_PUBLIC_MUX_DATA_ENV_KEY=your_mux_data_env_key

# Supabase (Dashboard -> Settings -> API)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Fal.ai
FAL_API_KEY=your_fal_api_key

# API URL (local or deployed)
EXPO_PUBLIC_API_URL=http://localhost:54321/functions/v1
```

### Configure Mux Webhooks

In Mux Dashboard -> Settings -> Webhooks:

**Webhook URL**: `https://your-project.supabase.co/functions/v1/webhooks`

**Events**:
- video.asset.ready
- video.asset.errored
- video.upload.asset_created

### Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## Troubleshooting

### Videos Don't Auto-play

- Check `isActive` prop is updating correctly
- Verify `paused` state changes when `isActive` changes
- Ensure `onViewableItemsChanged` fires (add console.log)

### Stuttering Between Videos

- Increase `windowSize` to preload more videos
- Verify `getItemLayout` is set correctly
- Enable `removeClippedSubviews` for memory management
- Check network conditions (poor network = stuttering)

### High Memory Usage

- Reduce `windowSize` (default is 3, ideal for Stories)
- Use `removeClippedSubviews={true}`
- Implement video unloading for far-away items
- Monitor with Xcode Instruments / Android Profiler

### Gestures Not Working

- Wrap root component with `<GestureHandlerRootView>`
- Check `react-native-gesture-handler` is installed correctly
- Verify gesture detector wraps the video container

---

## Best Practices Summary

### What Works Well

- **Stories UI is engaging** - Vertical swipe is intuitive and familiar
- **Mux handles video complexity** - No need to worry about formats, codecs, or streaming
- **Webhooks + Realtime = Great UX** - Users see updates immediately
- **Mux Data provides insights** - View counts and analytics out of the box
- **Upload from URL is perfect for AI** - Seamless integration with AI video services

### Common Pitfalls to Avoid

- **Don't render all videos at once** - Use FlatList windowSize
- **Don't forget React.memo** - Prevents expensive re-renders
- **Don't expose API keys** - Always use backend proxy
- **Don't skip error states** - Videos fail, networks drop - handle it
- **Don't test only in simulator** - Real devices perform differently

### For Direct Upload

1. Show upload progress with `FileSystem.createUploadTask`
2. Validate file size before uploading
3. Handle retries for network issues
4. Consider client-side compression for large files

### For URL Upload

1. Validate URLs are publicly accessible before sending to Mux
2. Handle temporary URLs from AI services that expire quickly
3. Store original URL in case you need to re-ingest
4. Set timeouts - AI video generation can take 30-120 seconds
