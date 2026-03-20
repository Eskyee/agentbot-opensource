# React Native: Video Feeds and Stories UI

Build performant video feeds and Instagram Stories/TikTok-style vertical video interfaces with auto-play, preloading, memory management, and gesture controls.

## Overview

This reference covers two major UI patterns:

1. **Scrollable Video Feeds** - Horizontal and vertical feeds like YouTube/Instagram main feeds
2. **Stories/Reels UI** - Full-screen vertical swiping like TikTok, Instagram Stories, and Snapchat Spotlight

---

## Video Feed Fundamentals

### FlatList Configuration

React Native's `FlatList` is the foundation for performant video feeds:

```tsx
import { FlatList } from 'react-native';
import { VideoCard } from './VideoCard';

interface Video {
  id: string;
  playbackId: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
}

export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard
          video={item}
          isPlaying={item.id === currentlyPlayingId}
        />
      )}
      keyExtractor={(item) => item.id}
      // Performance optimizations
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}
```

### Visibility Tracking for Auto-Play

Auto-play videos when they become visible in the viewport:

```tsx
import { useRef, useState } from 'react';
import { FlatList, ViewabilityConfig } from 'react-native';

export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);

  // Configure what counts as "visible"
  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Video is visible when 50% is on screen
    minimumViewTime: 500, // Must be visible for 500ms
  };

  // Track which video is currently visible
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      // Get the first fully visible video
      const visibleVideo = viewableItems.find(
        (item) => item.isViewable && item.item.playbackId
      );

      if (visibleVideo) {
        setVisibleVideoId(visibleVideo.item.id);
      }
    } else {
      // No videos visible, pause all
      setVisibleVideoId(null);
    }
  }).current;

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard
          video={item}
          shouldPlay={item.id === visibleVideoId}
        />
      )}
      keyExtractor={(item) => item.id}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}
```

---

## Video Card Component

Individual video item with auto-play support:

```tsx
import Video from 'react-native-video';
import { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface VideoCardProps {
  video: Video;
  shouldPlay: boolean;
}

export function VideoCard({ video, shouldPlay }: VideoCardProps) {
  const [paused, setPaused] = useState(!shouldPlay);
  const [showControls, setShowControls] = useState(false);
  const [muted, setMuted] = useState(true); // Start muted for auto-play

  const playbackUrl = `https://stream.mux.com/${video.playbackId}.m3u8`;
  const thumbnailUrl = `https://image.mux.com/${video.playbackId}/thumbnail.jpg`;

  // Sync paused state with shouldPlay prop
  useEffect(() => {
    setPaused(!shouldPlay);
  }, [shouldPlay]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setPaused(!paused)}
        style={styles.videoContainer}
      >
        <Video
          source={{ uri: playbackUrl }}
          style={styles.video}
          resizeMode="cover"
          paused={paused}
          muted={muted}
          repeat={false}
          poster={thumbnailUrl}
          posterResizeMode="cover"
        />

        {/* Mute toggle */}
        <TouchableOpacity
          style={styles.muteButton}
          onPress={() => setMuted(!muted)}
        >
          <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>

        {/* Play/Pause overlay */}
        {paused && (
          <View style={styles.pausedOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video metadata */}
      <View style={styles.metadata}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.views}>
          {video.views.toLocaleString()} views
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIcon: {
    fontSize: 18,
  },
  metadata: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  views: {
    fontSize: 14,
    color: '#666',
  },
});
```

---

## Memory Management

### Memoized Video Cards

Properly manage memory in video feeds to prevent crashes:

```tsx
import { FlatList } from 'react-native';
import React, { memo } from 'react';

// Memoize VideoCard to prevent unnecessary re-renders
const VideoCard = memo(({ video, shouldPlay }: VideoCardProps) => {
  return (
    <Video
      source={{ uri: `https://stream.mux.com/${video.playbackId}.m3u8` }}
      paused={!shouldPlay}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if video ID or shouldPlay changes
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.shouldPlay === nextProps.shouldPlay
  );
});

export function VideoFeed() {
  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}

      // Memory management
      windowSize={3} // Render 3 screens worth of content
      maxToRenderPerBatch={3} // Render 3 items per batch
      initialNumToRender={2} // Only render 2 items initially
      removeClippedSubviews={true} // Remove off-screen views (Android)

      // Performance optimizations
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  );
}
```

### Cleanup Video References

```tsx
export function VideoCard({ video, shouldPlay }: VideoCardProps) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (videoRef.current) {
        videoRef.current = null;
      }
    };
  }, []);

  return <Video ref={videoRef} />;
}
```

---

## Pagination and Infinite Scroll

Load more videos as the user scrolls:

```tsx
export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Load initial videos
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/videos?page=${page}&limit=10`);
      const newVideos = await response.json();

      if (newVideos.length === 0) {
        setHasMore(false);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndReached = () => {
    loadVideos();
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5} // Load more when 50% from bottom
      ListFooterComponent={
        loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        ) : null
      }
    />
  );
}
```

---

## Pull to Refresh

```tsx
import { RefreshControl } from 'react-native';

export function VideoFeed() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const response = await fetch(`${API_URL}/videos?page=1&limit=10`);
      const newVideos = await response.json();

      setVideos(newVideos);
      setPage(2);
      setHasMore(true);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
        />
      }
    />
  );
}
```

---

## Horizontal Video Feed

For YouTube-style horizontal scrolling:

```tsx
export function HorizontalVideoFeed() {
  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToAlignment="center"
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + CARD_MARGIN}
    />
  );
}
```

---

## Stories/Reels UI

Build full-screen vertical video swiping like TikTok and Instagram Stories.

### Architecture

```
StoriesScreen
  ├── FlatList (pagingEnabled, vertical)
  │   └── StoryItem (full-screen video + overlay)
  │       ├── MuxVideo (with auto-play logic)
  │       ├── VideoOverlay (username, stats, actions)
  │       └── GestureDetector (tap, double-tap)
  └── PreloadManager (loads next videos)
```

### FlatList for Full-Screen Paging

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
    itemVisiblePercentThreshold: 50, // Item is "visible" when 50% is on screen
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
      windowSize={3} // Render 1 above, 1 current, 1 below
      maxToRenderPerBatch={2}
      removeClippedSubviews
    />
  );
}
```

### Key FlatList Props for Stories

| Prop | Purpose |
|------|---------|
| `pagingEnabled` | Snaps to full screens |
| `snapToInterval={SCREEN_HEIGHT}` | Ensures exact screen alignment |
| `snapToAlignment="start"` | Aligns to top of screen |
| `decelerationRate="fast"` | Quick snap to next video |
| `windowSize={3}` | Renders 3 items (prev, current, next) |
| `getItemLayout` | Optimizes scroll performance |
| `removeClippedSubviews` | Unmounts off-screen items (memory optimization) |

---

## StoryItem Component

Each story item is a full-screen video with gesture controls:

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
          <Video
            ref={videoRef}
            source={{ uri: `https://stream.mux.com/${video.playbackId}.m3u8` }}
            poster={`https://image.mux.com/${video.playbackId}/thumbnail.png?time=0`}
            posterResizeMode="cover"
            style={styles.video}
            paused={paused}
            repeat={true} // Loop the video
            resizeMode="cover"
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

---

## Video Overlay Component

Display metadata and action buttons:

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
              icon={liked ? '...' : '...'}
              label={formatNumber(likeCount)}
              onPress={onLike}
            />
            <ActionButton
              icon="..."
              label="Comment"
              onPress={() => {/* TODO */}}
            />
            <ActionButton
              icon="..."
              label="Share"
              onPress={() => {/* TODO */}}
            />
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
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
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
```

---

## Like Animation

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
      <Animated.Text style={styles.heart}>heart icon</Animated.Text>
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

---

## Progress Indicator

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
  duration: number; // Video duration in seconds
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
    top: 50, // Below status bar
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

---

## Preloading Strategy

### For Video Feeds

HLS (the format Mux uses) handles adaptive streaming automatically. You do not need to preload entire videos - just let the HLS manifest load and the player will handle the rest.

```tsx
import { useEffect, useRef } from 'react';

export function VideoCard({ video, shouldPlay }: VideoCardProps) {
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);

  return (
    <Video
      ref={videoRef}
      source={{ uri: playbackUrl }}
      paused={!shouldPlay || !isReady}
      onLoad={() => setIsReady(true)} // Video is ready to play
      onBuffer={({ isBuffering }) => {
        // Handle buffering states
        if (isBuffering) {
          setIsLoading(true);
        }
      }}
      onReadyForDisplay={() => {
        // Video is ready to display
        setIsReady(true);
      }}
    />
  );
}
```

### For Stories/Reels

Preload adjacent videos for seamless transitions:

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

## Advanced Features

### Memory Management for Stories

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

### Horizontal Swipe for User Navigation

Add horizontal swipes to jump between users:

```tsx
const panGesture = Gesture.Pan()
  .onEnd((event) => {
    if (Math.abs(event.translationX) > 100) {
      if (event.translationX > 0) {
        // Swipe right - previous user
        goToPreviousUser();
      } else {
        // Swipe left - next user
        goToNextUser();
      }
    }
  });
```

### Multiple Videos Per User

Track user stories and show progress bars:

```tsx
<View style={styles.progressBars}>
  {userVideos.map((video, index) => (
    <ProgressBar
      key={video.id}
      filled={index < currentVideoIndex}
      active={index === currentVideoIndex}
    />
  ))}
</View>
```

### Mute Toggle

```tsx
const [muted, setMuted] = useState(false);

<Video
  source={videoSource}
  muted={muted}
/>

<TouchableOpacity onPress={() => setMuted(!muted)}>
  <Text>{muted ? 'Unmute' : 'Mute'}</Text>
</TouchableOpacity>
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

## Empty and Error States

Handle empty feeds and errors gracefully:

```tsx
export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Empty state
  if (!loading && videos.length === 0 && !error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No videos yet</Text>
        <Text style={styles.emptyText}>
          Check back later for new content!
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load videos</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadVideos()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}
    />
  );
}
```

### Handle Video Errors in Stories

```tsx
const [error, setError] = useState(false);

<Video
  source={videoSource}
  onError={() => setError(true)}
/>

{error && (
  <View style={styles.errorOverlay}>
    <Text>Video unavailable</Text>
    <Button title="Skip" onPress={skipToNext} />
  </View>
)}
```

---

## Performance Best Practices

### Recommended Practices

- Use `React.memo` for VideoCard components
- Implement proper `getItemLayout` for FlatList
- Set reasonable `windowSize` (3-5 screens)
- Use `removeClippedSubviews` on Android
- Mute videos by default for auto-play
- Only play one video at a time
- Cleanup video refs on unmount
- Use `useCallback` for all event handlers
- Test on physical devices (simulators do not reflect real performance)

### Practices to Avoid

- Do not render all videos at once
- Do not play multiple videos simultaneously
- Do not forget to pause videos when scrolled away
- Do not load entire videos in advance (HLS handles streaming)
- Do not skip `keyExtractor` (causes render issues)

---

## Troubleshooting

### Videos Do Not Auto-Play

- Check `isActive` prop is updating correctly
- Verify `paused` state changes when `isActive` changes
- Ensure `onViewableItemsChanged` fires (add console.log)

### Stuttering Between Videos

- Increase `windowSize` to preload more videos
- Verify `getItemLayout` is set correctly
- Enable `removeClippedSubviews` for memory management
- Check network conditions (poor network causes stuttering)

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

## Required Dependencies

Install the necessary packages:

```bash
# For gesture handling
npx expo install react-native-gesture-handler

# For animations
npx expo install react-native-reanimated

# For video playback
npm install react-native-video

# For gradients (optional, for overlays)
npx expo install expo-linear-gradient

# For safe area handling
npx expo install react-native-safe-area-context
```
