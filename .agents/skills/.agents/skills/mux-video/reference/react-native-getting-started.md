# React Native: Getting Started

Quickstart guide for playing Mux video in React Native apps using Expo and expo-video. Covers installation, basic playback, poster images, player events, and platform configuration.

## Overview

Mux delivers video using HLS (HTTP Live Streaming), which is natively supported on both iOS and Android. To play Mux videos in React Native, use `expo-video`, a cross-platform, performant video component with native support for React Native and Expo.

## Installation

Install the `expo-video` package using your preferred package manager:

```bash
# npm
npm install expo-video

# yarn
yarn add expo-video

# pnpm
pnpm add expo-video
```

**Note:** This guide assumes you are using Expo. If you are using bare React Native without Expo, you will need to install the `expo` package first and configure your project for Expo modules. See the Expo documentation for details on installing Expo modules.

For iOS in a bare workflow, install the native dependencies:

```bash
cd ios && pod install && cd ..
```

## Basic Video Player Component

Create a new file called `components/video-player.tsx` in your project. You will need a Mux **playback ID** to construct the video URL.

Demo playback ID for testing: `OfjbQ3esQifgboENTs4oDXslCP5sSnst`

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPlayer() {
  // Replace with your own playback ID from https://dashboard.mux.com
  const playbackId = 'OfjbQ3esQifgboENTs4oDXslCP5sSnst';
  const videoSource = `https://stream.mux.com/${playbackId}.m3u8`;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
```

## Understanding the Video URL

Mux videos are streamed using the format:

```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

- `{PLAYBACK_ID}` is the unique identifier for your video
- `.m3u8` is the HLS manifest file format

## Running Your App

Import and use the `VideoPlayer` component in your app. If you used `create-expo-app`, you will likely find your main screen at `app/(tabs)/index.tsx` or `app/index.tsx`:

```tsx
import VideoPlayer from '@/components/video-player';

export default function HomeScreen() {
  return <VideoPlayer />;
}
```

Then run your app:

```bash
# Start Expo dev server
npx expo start

# Press 'i' for iOS or 'a' for Android
# Or scan the QR code with Expo Go
```

The video will stream using HLS with adaptive bitrate, automatically adjusting quality based on the viewer's network conditions.

## Adding a Poster Image (Thumbnail)

Mux provides thumbnails for your videos using the same playback ID. Display a poster image that the user taps to start playback:

```tsx
import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPlayer() {
  const [showPoster, setShowPoster] = useState(true);
  const playbackId = 'OfjbQ3esQifgboENTs4oDXslCP5sSnst';
  const videoSource = `https://stream.mux.com/${playbackId}.m3u8`;
  const posterSource = `https://image.mux.com/${playbackId}/thumbnail.png?time=0`;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    // Don't autoplay - wait for user to tap poster
  });

  const handlePosterPress = () => {
    setShowPoster(false);
    player.play();
  };

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
      {showPoster && (
        <Pressable onPress={handlePosterPress} style={styles.poster}>
          <Image
            source={{ uri: posterSource }}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
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

### Thumbnail URL Format

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.png?time={SECONDS}
```

Set `time` to capture a frame at a specific timestamp (e.g., `time=5` for 5 seconds in).

## Handling Player Events

Track loading, playback progress, and errors using `expo-video`'s event system:

```tsx
import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPlayer() {
  const playbackId = 'OfjbQ3esQifgboENTs4oDXslCP5sSnst';
  const videoSource = `https://stream.mux.com/${playbackId}.m3u8`;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
    player.timeUpdateEventInterval = 0.5; // Update time every 0.5 seconds
  });

  // Listen to status changes (loading, readyToPlay, error)
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  // Listen to playback progress
  const timeUpdate = useEvent(player, 'timeUpdate');
  const currentTime = timeUpdate?.currentTime ?? 0;

  // Listen to playing state changes
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  if (status === 'error' && error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load video: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      )}
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
      <View style={styles.info}>
        <Text style={styles.infoText}>Status: {status}</Text>
        <Text style={styles.infoText}>
          Time: {Math.floor(currentTime)}s / {Math.floor(player.duration)}s
        </Text>
        <Text style={styles.infoText}>
          {isPlaying ? 'Playing' : 'Paused'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  loader: {
    position: 'absolute',
  },
  info: {
    marginTop: 20,
    padding: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
```

## Supporting Different Aspect Ratios

For portrait videos (like Stories or Reels), adjust the aspect ratio in your styles:

```tsx
const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 9 / 16, // Portrait mode
  },
});
```

## Platform Considerations

### iOS vs Android

Both iOS and Android have native HLS support, so `expo-video` works seamlessly on both platforms. However, there are a few differences:

| Platform | HLS Implementation |
|----------|-------------------|
| iOS | AVPlayer |
| Android | ExoPlayer (Media3) |
| Web | HTML5 video with HLS.js |

These differences are handled automatically by `expo-video`, but you may notice slight variations in buffering behavior or UI controls across platforms.

### Expo Go Limitations

`expo-video` works with Expo Go for basic playback, but for advanced features like Picture-in-Picture or background playback, you will need to create a development build.

**Important:** Features like Picture-in-Picture (`allowsPictureInPicture`) and background playback require configuration through the config plugin and a custom development build. These features will not work in Expo Go.

## Configuration for Advanced Features

To enable advanced features, add the `expo-video` config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-video",
        {
          "supportsBackgroundPlayback": true,
          "supportsPictureInPicture": true
        }
      ]
    ]
  }
}
```

After adding the config plugin, rebuild your app with `eas build` or `npx expo run:ios`/`npx expo run:android`.

## VideoView Props Reference

| Prop | Type | Description |
|------|------|-------------|
| `player` | VideoPlayer | The player instance from `useVideoPlayer` |
| `style` | StyleProp | Styling for the video view |
| `allowsFullscreen` | boolean | Enable fullscreen mode |
| `allowsPictureInPicture` | boolean | Enable Picture-in-Picture (requires config) |
| `nativeControls` | boolean | Show native platform controls |
| `contentFit` | string | How video fits container (`contain`, `cover`, etc.) |

## useVideoPlayer Hook

The `useVideoPlayer` hook creates a video player instance:

```tsx
const player = useVideoPlayer(videoSource, (player) => {
  // Configuration callback
  player.loop = false;
  player.play();
  player.timeUpdateEventInterval = 0.5;
});
```

### Player Properties

| Property | Type | Description |
|----------|------|-------------|
| `loop` | boolean | Whether video loops |
| `playing` | boolean | Current playing state |
| `status` | string | Player status (`loading`, `readyToPlay`, `error`) |
| `duration` | number | Video duration in seconds |
| `timeUpdateEventInterval` | number | Interval for time update events |

### Player Methods

| Method | Description |
|--------|-------------|
| `play()` | Start playback |
| `pause()` | Pause playback |

## useEvent Hook

The `useEvent` hook from `expo` subscribes to player events:

```tsx
import { useEvent } from 'expo';

// Status changes
const { status, error } = useEvent(player, 'statusChange', {
  status: player.status,
});

// Time updates
const timeUpdate = useEvent(player, 'timeUpdate');

// Playing state changes
const { isPlaying } = useEvent(player, 'playingChange', {
  isPlaying: player.playing,
});
```

## Summary

Key capabilities covered:

- Install and set up `expo-video`
- Create a video player using the `useVideoPlayer` hook
- Play Mux videos using playback IDs
- Display poster images (thumbnails) using Mux's image service
- Handle player events with the `useEvent` hook (status, progress, playback state)
- Adjust for different aspect ratios (landscape and portrait)
- Configure advanced features like Picture-in-Picture and background playback
